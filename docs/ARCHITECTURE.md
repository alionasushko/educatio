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
│           ├── summary/            ← Gemini summary generation
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
- Import `@ai-sdk/google`, `resend`, `@vercel/blob` — those are api-side concerns
- Embed business logic that duplicates an api handler

**`apps/api` is the only place that:**

- Talks to Mongo (Mongoose + DB connection pool)
- Calls Google Gemini (`@ai-sdk/google`)
- Calls Resend (magic-link send)
- Mints Liveblocks tokens (`@liveblocks/node`)
- Writes to Vercel Blob

This split is enforced two ways: by what's installed where (api-only packages aren't in web's workspace), and at lint time by `no-restricted-imports` in `apps/web/eslint.config.mjs`. Don't paper over a missing endpoint by adding a Mongo client to the web app — add the endpoint to api instead.

## Auth flow

Nest owns the entire identity surface.

```
Tutor sign-up (email verification; password set later):
  Browser → web POST /sign-up form                     (web: pure UI)
  web → api POST /auth/signup { name, email, teaches }  (web acts as a proxy)
  api creates unverified User in Mongo,
    generates one-time magic-link token,
    sends verification email via Resend → web/auth/callback?token=...
  api → web returns 200 { sent: true }
  web → renders /verify ("Check your email")
  (a password is set only post-verification via authenticated POST /auth/password)

Magic-link callback:
  Browser → web GET /auth/callback?token=…  (needs its own binding cookie)
  web → api POST /auth/callback { token, binding }
  api validates token, marks User.emailVerified, mints session JWT
  api → web returns { sessionJwt } in the response body
  web → sets `educatio_session` httpOnly cookie on its own domain, redirects to /dashboard

Password sign-in:
  Browser → web POST /sign-in form { email, password }
  web → api POST /auth/signin/password { email, password }
  api verifies bcrypt hash; if the email is verified, mints session JWT
  api → web returns { sessionJwt }
  web verifies the JWT, sets `educatio_session` cookie, redirects to /dashboard (or callbackUrl)
  (the "email me a magic link" fallback + password recovery reuses the magic-link callback above)

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

The route gate answers two questions, both from the cookie alone — no Mongo, no api call. First: does the request carry an `educatio_session` cookie whose JWT verifies against `AUTH_JWT_SECRET`? The shared secret is the only thing the web side needs; Resend, Mongo, and JWT minting are all api-only. Second: does the token's `kind` match the path? A student token is signed with the same secret, so a signature check alone would admit one to `/dashboard`. Students may reach `/lesson/<id>` and an explicit allowlist of subpaths under it — currently just `summary` — and **only for their own `lessonId`**. Everything else in the matcher is tutor-only, `/lesson/new` and any unlisted subpath included, so a route added under `/lesson/<id>/…` later stays closed until someone adds it to `STUDENT_LESSON_SUBPATHS` on purpose. An out-of-scope student is sent back to their own room rather than to `/sign-in`, having no account to sign into.

**The gate is defense-in-depth, not the sole authorization.** Next 16's proxy docs warn that a matcher change or moving a Server Function to a different route can silently drop proxy coverage. When the authenticated screens land, every protected page/layout and every Server Action must re-check auth via `getCurrentSession()` (in `src/lib/session-server.ts`) and verify the claim — do not rely on `proxy.ts` alone. Relatedly, when `/sign-in` consumes a `callbackUrl` to redirect after login, it MUST reject any value that isn't a relative path (must start with a single `/`, not `//` or a scheme) or it becomes an open redirect.

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

## Request layer (web → api)

Hand-written and deliberately so. OpenAPI codegen, contract-first RPC (oRPC / ts-rest), TanStack Query and a same-origin BFF proxy were each evaluated and rejected: when both sides live in one TypeScript repo the contract is a shared package the compiler checks, and codegen or an RPC runtime exists to cross an ownership or language boundary we don't have. The rejections rest on facts worth keeping written down, because they'll be re-proposed otherwise:

- **No OpenAPI spec exists.** `@nestjs/swagger` derives specs from class DTOs; api validates with hand-written Zod through `ZodValidationPipe`. Adopting codegen means _building_ spec generation first, after which the Zod schemas stop being the contract and become a mirror of it.
- **TanStack Query has nothing to attach to.** `api-client` is `server-only` and reads an httpOnly cookie, so it can never be a `queryFn`. Feeding a client cache needs either a route handler per endpoint or cross-origin fetch with credentials — and the browser does not call api cross-origin in v1.
- **oRPC bypasses Nest's response pipeline** by default, so `AllExceptionsFilter` stops being the single exit for errors. ts-rest is out on versions: stable peers zod 3 against this repo's zod 4.

The rules that hold it together:

1. **`schema` is required on every call.** `RequestOptions.schema` is not optional and `request` always parses. Validation you can forget is validation you don't have — before this was enforced, 1 of 9 calls passed a schema.
2. **The core throws; values happen at the seam.** `request` throws one of `ApiClientError` / `ApiTransportError` / `ApiResponseError`; `query()`, `queryOrNotFound()` and `actionError()` adapt those to values. Do not push a `{ ok, data, error }` envelope down into `request` — `cookies()` signals dynamic rendering by throwing, `requireApiUrl()` throws a config error, and `redirect()`/`notFound()` throw control flow. `actionError` uses `unstable_rethrow` so those pass through untouched.
3. **Wire shape ≠ domain shape.** Response schemas describe what the api serialises — dates as ISO strings — while `Lesson` keeps `Date | string` unions to describe both sides at once. Web consumes `z.infer` of the wire schema.
4. **Nothing cookie-scoped gets cached.** Every read carries a per-user Bearer JWT. Reading `cookies()` makes the _route_ dynamic; it does **not** stop an individual `fetch` with `next: { tags }` from landing that response in the shared Data Cache. `cache: "no-store"` is the default and no read may opt out without a per-tutor tag _and_ an invalidator.
5. **Mutations revalidate server-side.** `revalidateLessons()` in `lib/revalidate.ts` holds every path that renders a lesson list, rather than a literal at each call site — the compiler cannot check that a mutation invalidated everything it should. Path-based, not tag-based: with `no-store` there is no tagged entry to invalidate. `revalidateTag` would be inert, and `updateTag` (not `revalidateTag`) is the one to reach for if caching ever lands, since only it is immediate.

Paths live beside the schema they belong to in `@educatio/shared/api/*`, consumed by both Nest's decorators and web's wrappers, so a path typo is a compile error rather than a runtime 404. `packages/shared/src/api/lessons.ts` encodes ids in `lessonPath` because they arrive from URL slugs; `apps/web/src/lib/routes.ts` holds web's _own_ routes, which are a different set (`/lesson/<id>` there against `/lessons/<id>` in shared) and deliberately do not encode.

## Deployment

- **web** → Vercel (single Next deployment). Env: `AUTH_JWT_SECRET` (shared), `EDUCATIO_API_URL`, `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (optional — Sentry stays uninitialised without them). The canvas client needs no Liveblocks key of its own — its room token comes from api through `/liveblocks-auth`.
- **api** → **Google Cloud Run**, scaling to zero. Env: `NODE_ENV=production` (required — an unset value fails boot rather than unlocking the dev-only magic-link log), `AUTH_JWT_SECRET` (shared, and it must _match_ web's or every authenticated request redirects to sign-in), `MONGODB_URI`, `TRUST_PROXY`, `WEB_ORIGIN` (CORS allowlist), `ENABLE_DEMO_LOGIN`, plus `RESEND_API_KEY`, `EMAIL_FROM`, `LIVEBLOCKS_SECRET_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`. The five secrets go through Secret Manager (`--set-secrets`), not `--set-env-vars`, so they stay out of the revision config and out of shell history.
  - Deploy flags: `--min-instances=0 --max-instances=2 --concurrency=20 --memory=512Mi --timeout=300 --allow-unauthenticated`. `--max-instances=2` is protective, not a throttle: Mongoose pools _per instance_, and Atlas M0 caps at 500 connections, so uncapped scaling would exhaust them. Set `maxPoolSize` on the Mongoose connection for the same reason.
  - `TRUST_PROXY` must name the link-local hop **and** GCP's front-end ranges — `loopback, linklocal, uniquelocal, 130.211.0.0/22, 35.191.0.0/16`. Cloud Run's socket peer is `169.254.x.x`, which `proxy-addr`'s `uniquelocal` preset does not cover, so the default leaves `req.ip` pointing at infrastructure. That matters beyond rate-limit accuracy: `SessionThrottlerGuard` falls back to `req.ip` for unauthenticated callers, so a collapsed value makes the demo-login cap (10 per 24h) global and the 11th visitor of the day gets a 429. Never `TRUST_PROXY=true` — that takes the leftmost `x-forwarded-for` entry, which the client supplies. Verify `req.ip` against a real request once on first deploy; nothing tests it.
  - Rejected: **Fly.io** (~$2/mo for an always-warm machine and a dedicated IPv4, so a real Atlas allowlist stays affordable — worth revisiting if this ever serves real tutors, but a 3–10s cold start is acceptable for a portfolio demo and Cloud Run is free at that traffic). **Vercel for the api** — a second serverless deployment beside web puts two cold starts in series across an HTTP hop for no gain, and its 4.5 MB request-body limit is below our own 5 MB `MAX_UPLOAD_BYTES`. **Render's free tier** sleeps for ~50s. Cloud Run keeps the most generous request timeout of the four, which suits the unbounded Gemini call.
  - Cold-start cost is uneven: the summary route lazily `await import()`s the AI SDK, which keeps every other route booting fast and puts ~15–25s on the first summary. Deliberate.
  - Egress is dynamic, so Atlas allowlists `0.0.0.0/0` and credentials carry the weight. A static egress IP needs Cloud NAT, which costs more than the hosting.
- Local dev: web on `:3000`, api on `:3001`. The session cookie is `Secure` in production only — WebKit refuses a `Secure` cookie over `http://localhost`, which silently breaks every authenticated request in Safari while Chromium accepts it. `e2e/webkit.spec.ts` runs in the `webkit` Playwright project to keep that from regressing unnoticed. Web's `EDUCATIO_API_URL=http://localhost:3001`.

## Status

The api implements every endpoint listed in `docs/SPEC.md` §API routes, and every screen in §Features is built (see `docs/implementation-plan.md` §7 for per-screen status). The remaining work is the deploy itself plus a Lighthouse pass.

A whole-app security review ran before deploy; its confirmed findings are fixed and the deliberate deferrals are recorded in `docs/SECURITY.md`. Everything compiles, builds and passes `npm run check`. Still unverified against live services: Resend and Gemini have never been exercised, and Liveblocks only locally — so the first deploy is also the first real test of the summary and realtime paths.

## Open items

- **api hosting target** — settled: Cloud Run, scaling to zero. See §Deployment for the flags and what was rejected.
- **Email-verification UX** — settled: the magic-link URL hits web, at `apps/web/src/app/auth/callback/route.ts`, so it can set the cookie before redirecting.
- **Student email at join** — kept required, deliberately, because the `mailto:` summary hand-off in `email-summary-button` is worth demonstrating. That is why `GET /lessons/:id` projects its response by session kind instead: the field exists, so it needs withholding rather than removing. Making it `.optional()` would remove the class outright if the demo ever stops needing it.
- **Demo login in production** — on, deliberately: it is the entry path for anyone trying the app, which is also why no domain is required (without `RESEND_API_KEY` a real sign-up cannot complete). It is the reason the Gemini budget must be metered per caller rather than globally — every visitor gets a real tutor session, and demo accounts get fresh ids on each login, so a per-tutor key alone is defeated by clicking Try demo again.
- **Rate limiting** on api — done: `@nestjs/throttler` (global 120/min via `APP_GUARD`, tighter per-route `@Throttle` on `auth/*`, `sessions/student`, `upload`) plus `@fastify/helmet` for security headers.
- **OpenAPI** — Nest has `@nestjs/swagger` for free OpenAPI gen from Zod schemas via `nestjs-zod`. Worth adding once the api has 3+ endpoints so the web fetch client can be generated from it.
