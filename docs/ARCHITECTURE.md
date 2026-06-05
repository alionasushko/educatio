# Educatio — Target Architecture

Read alongside `docs/SPEC.md` (feature contracts) and `docs/implementation-plan.md` (sequencing). This file describes the **shape**: where code lives, how the two services talk, and which decisions are load-bearing.

## TL;DR

- **Monorepo** (`npm` workspaces): two apps + one shared package.
- **`apps/web`** — Next 16 SSR + UI only. No DB, no AI, no Liveblocks server SDK.
- **`apps/api`** — NestJS (Fastify adapter). Owns data, auth, AI, Liveblocks token issuance, blob uploads.
- **`packages/shared`** — pure TS: domain types + Zod request/response schemas, imported by both apps.
- **Auth fully in Nest.** Resend magic-link flow + user creation + session JWT issuance all live in `apps/api`. Next stores the JWT in an `httpOnly` cookie and forwards it; it does not own any identity logic.
- **Web ↔ api over HTTPS.** Server components fetch from the api over HTTP just like the browser does — single boundary, no shared Mongo client.

## Repo shape

```
educatio/                          ← npm workspaces root
├── apps/
│   ├── web/                        ← Next 16
│   └── api/                        ← NestJS
│       └── src/
│           ├── main.ts             ← bootstrap (Fastify, CORS, ValidationPipe)
│           ├── app.module.ts       ← root module (ConfigModule, MongooseModule, feature modules)
│           ├── config/             ← env schema + accessor
│           ├── common/             ← guards, decorators, filters, pipes
│           ├── auth/               ← Resend magic-link, JWT issuance, AuthGuard
│           ├── lessons/            ← lesson CRUD
│           ├── summary/            ← Anthropic summary generation
│           ├── snapshots/          ← periodic canvas snapshots
│           ├── liveblocks/         ← room token issuance
│           ├── upload/             ← Vercel Blob upload
│           └── sessions/           ← student session tokens
├── packages/
│   └── shared/                     ← @educatio/shared
│       └── src/
│           ├── canvas.ts           ← CanvasElement + element types
│           ├── lesson.ts           ← Lesson, LessonSummary, LessonStatus
│           ├── auth.ts             ← session JWT claim shapes
│           └── api/                ← zod schemas mirroring DTOs (used by both apps)
├── package.json                    ← workspaces: ["apps/*", "packages/*"]
└── docs/                         ← this folder (planning + reference)
```

## Boundary between web and api

**`apps/web` is allowed to:**

- Render UI (server components + client components)
- Read its own session cookie to know if a user is signed in
- Call `apps/api` over HTTPS, from server components OR the browser
- Set/clear cookies via response headers when proxying auth responses
- Use Liveblocks **client** SDK (`@liveblocks/react`, `@liveblocks/client`) to subscribe to rooms

**`apps/web` must NOT:**

- Import `mongoose`, any Mongoose model, or any Mongo client
- Import `@liveblocks/node` (server SDK) — the token comes from api
- Import `@ai-sdk/anthropic`, `resend`, `@vercel/blob` — those are api-side concerns
- Embed business logic that duplicates an api handler

**`apps/api` is the only place that:**

- Talks to Mongo (Mongoose + DB connection pool)
- Calls Anthropic (`@ai-sdk/anthropic`)
- Calls Resend (magic-link send)
- Mints Liveblocks tokens (`@liveblocks/node`)
- Writes to Vercel Blob

This split is enforced two ways: by what's installed where (api-only packages aren't in web's workspace), and at lint time by `no-restricted-imports` in `apps/web/eslint.config.mjs`. Don't paper over a missing endpoint by adding a Mongo client to the web app — add the endpoint to api instead.

## Auth flow

Nest owns the entire identity surface.

```
Tutor sign-up:
  Browser → web POST /sign-up form                     (web: pure UI)
  web → api POST /auth/signup { name, email, teaches } (web acts as a proxy)
  api creates User in Mongo, generates one-time magic-link token,
    sends email via Resend with link → web/auth/callback?token=...
  api → web returns 200 { sent: true }
  web → renders /verify ("Check your email")

Magic-link callback:
  Browser → web GET /auth/callback?token=…
  web → api POST /auth/callback { token }
  api validates token, marks User.emailVerified, mints session JWT
  api → web returns { sessionJwt } in the response body
  web → sets `educatio_session` httpOnly cookie on its own domain, redirects to /dashboard

Authenticated request from web → api:
  Browser → web /dashboard (server component)
  web reads `educatio_session` cookie, forwards as `Authorization: Bearer <jwt>`
  api JwtAuthGuard verifies (HS256, shared AUTH_JWT_SECRET) → handler runs

Student join:
  Browser → web /join/[code], submits name
  web → api POST /sessions/student { inviteCode, name }
  api validates code, mints scoped JWT { kind: 'student', lessonId, name, exp: +7d }
  api → web returns { sessionJwt }
  web sets `educatio_student_session` cookie (httpOnly, lesson-scoped path) and redirects to lesson
  Subsequent calls (snapshot, liveblocks-auth, upload) forward this token
  api accepts EITHER `kind: 'tutor'` OR `kind: 'student'` and scopes accordingly
```

### Why cookies (not localStorage)

- `httpOnly` prevents XSS exfiltration
- `SameSite=Lax` defeats CSRF for navigations
- Set by web on web's own domain — no cross-origin cookie problems
- Server components can read them synchronously; the browser sends them on every fetch to web

### `proxy.ts` gate

The Edge route gate's only job: does the request carry an `educatio_session` cookie whose JWT verifies against `AUTH_JWT_SECRET`? No Mongo, no api call. The shared secret is the only thing the web side needs; Resend, Mongo, and JWT minting are all api-only.

## API surface

Lives at `api.educatio.app` (final domain TBD). Inventory in `docs/SPEC.md` §API routes. Two structural notes:

- The base path is `https://api.educatio.app/...`, not `/api/...` on the web origin.
- Auth endpoints (`POST /auth/signup`, `/auth/signin`, `/auth/callback`, `/auth/signout`, `GET /auth/me`) and `POST /sessions/student` are api-owned; the web host has no `/api/*` surface.

CORS allowlist on api = the web origin only. Credentials (cookies) flow web ↔ api only via web's server-side fetches; the browser does not call api cross-origin in v1.

## Shared package (`@educatio/shared`)

Pure TypeScript, zero runtime deps except `zod`. Exports:

- Domain types: `CanvasElement` (+ element variants), `Lesson`, `LessonStatus`, `LessonSummary`.
- Auth shapes: `SessionClaims` (tutor JWT), `StudentSessionClaims`.
- Zod schemas under `@educatio/shared/api/*` — one per endpoint, used by Nest's `ZodValidationPipe` for inbound validation AND by the web's typed fetch client for response parsing.
- `ApiError` shape (`{ code: string, message: string, details?: unknown }`) so the web renders errors consistently.

Both apps consume via workspace import: `import { Lesson } from "@educatio/shared"`. Build is `tsc -b` from the package root; both apps treat it as a normal dependency.

### Scope discipline (what belongs here, and what doesn't)

`packages/shared` is **only** for genuine contract types — the shapes that cross the web↔api boundary:

- domain entities (`Lesson`, `CanvasElement` + variants, `LessonSummary`, …)
- API request/response DTOs (the Zod schemas under `api/*`)
- JWT claim shapes (`SessionClaims`, `StudentSessionClaims`)
- shared error shape (`ApiError`)

It is **not** a junk drawer for "code used in more than one place." Utility functions, UI helpers, AI prompts, formatting, Mongoose schemas, React hooks — all live in the app that owns them, even if a second app later wants something similar (duplicate it there instead). The test: _does this type define the contract between the two services?_ If no, it doesn't go in shared. Letting shared accrete non-contract code turns it into a coupling surface that defeats the point of splitting the apps.

## Deployment

- **web** → Vercel (single Next deployment). Env: `AUTH_JWT_SECRET` (shared), `EDUCATIO_API_URL`, `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` (when canvas client lands).
- **api** → Railway / Fly.io / Render — pick one when we get to deploy. Nest is a long-running process; Vercel's serverless model fights it (cold starts, no shared Mongo pool, request timeouts on AI calls). Env: `AUTH_JWT_SECRET` (shared), `MONGODB_URI`, `RESEND_API_KEY`, `EMAIL_FROM`, `LIVEBLOCKS_SECRET_KEY`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `WEB_ORIGIN` (CORS allowlist).
- Local dev: web on `:3000`, api on `:3001`. Web's `EDUCATIO_API_URL=http://localhost:3001`.

## Status

The api implements every endpoint listed in `docs/SPEC.md` §API routes; web has the marketing landing, the Edge `proxy.ts` gate, the typed `api-client`, and the auth cookie route handlers (`/auth/callback`, `/auth/signout`). The remaining work is web feature screens (see `docs/SPEC.md` §Features for behavior, `docs/implementation-plan.md` §7 for status), Sentry wiring, and tests. Everything compiles and builds; end-to-end behavior is unverified until both apps run against live Mongo/Resend/Liveblocks/Anthropic.

## Open items

- **api hosting target** — Railway vs Fly vs Render. Decide before deploy task.
- **Email-verification UX** — does the magic-link URL hit web or api directly? Recommendation: web (so it can set the cookie before redirecting to `/dashboard`), but api works too if the redirect can carry the JWT.
- **Rate limiting** on api — `@nestjs/throttler` is the standard pick; add when auth lands.
- **OpenAPI** — Nest has `@nestjs/swagger` for free OpenAPI gen from Zod schemas via `nestjs-zod`. Worth adding once the api has 3+ endpoints so the web fetch client can be generated from it.
