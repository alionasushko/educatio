# Educatio v1 — Implementation Plan & Requirements

> Document audience: Claude Code (or any AI coding agent) tasked with implementing Educatio v1.
> Companion docs: `docs/SPEC.md` (feature contracts + data/API shapes), `docs/ARCHITECTURE.md` (repo shape), `docs/DESIGN.md` (screen-level visual specs).
>
> **Division of labour with `docs/SPEC.md`:** SPEC is the source of truth for _behavior and contracts_ — data models, canvas element types, Liveblocks state, API routes. This file owns the _plan_ — tech stack, env vars, project tree, status, and non-functional requirements. Where they would overlap, this file points at SPEC rather than copying it (copies drift).

---

## 1. Product Summary

**Educatio** is a collaborative whiteboard application built specifically for one-on-one online tutoring. Tutors create lesson rooms, share a link with their student, and meet on a real-time collaborative canvas alongside their existing video tool (Zoom/Meet/whatever). The canvas auto-saves and lessons can be revisited. After each lesson, an AI-generated summary can be exported as PDF.

**v1 explicitly does NOT include:** embedded video chat, subject-specific tools (math equations, code execution, language flashcards), AI exercise generation, AI hints, lesson templates, payments, mobile editing, or student dashboards. These come in later phases.

---

## 2. Tech Stack (Required)

| Layer              | Choice                                                                                                     | Lives in                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Monorepo manager   | **npm workspaces**                                                                                         | root                                      |
| Frontend framework | **Next.js 16** (App Router, React 19)                                                                      | `apps/web`                                |
| Backend framework  | **NestJS** with Fastify adapter (`@nestjs/platform-fastify`)                                               | `apps/api`                                |
| Language           | TypeScript (strict)                                                                                        | both                                      |
| Styling            | Tailwind CSS v4 + shadcn/ui (`base-nova`)                                                                  | `apps/web`                                |
| Canvas rendering   | React Konva (`konva` + `react-konva`)                                                                      | `apps/web`                                |
| Real-time (client) | `@liveblocks/react`, `@liveblocks/client`                                                                  | `apps/web`                                |
| Real-time (server) | `@liveblocks/node` (token issuance only)                                                                   | `apps/api`                                |
| Auth               | Email + password (bcrypt) or Resend magic-link → JWT by Nest, stored as `httpOnly` cookie by web           | `apps/api` owns; `apps/web` stores cookie |
| Database           | MongoDB Atlas + Mongoose                                                                                   | `apps/api` only                           |
| AI                 | Google Gemini via Vercel AI SDK (`@ai-sdk/google`)                                                         | `apps/api` only                           |
| File storage       | Vercel Blob (`@vercel/blob`)                                                                               | `apps/api` only                           |
| PDF generation     | `@react-pdf/renderer` (client-side)                                                                        | `apps/web`                                |
| Email              | Resend                                                                                                     | `apps/api` only                           |
| Validation         | Zod schemas in `@educatio/shared`, consumed by Nest's `ZodValidationPipe` and the web's typed fetch client | `packages/shared`                         |
| Deployment         | Vercel for web; Railway/Fly/Render (TBD) for api                                                           | per app                                   |
| Monitoring         | Sentry                                                                                                     | both                                      |

**Required Node version:** 22.x (`.nvmrc` pins 22.22.2).

---

## 3. Environment Variables

Two `.env` files, one per app. The only env var shared between them is `AUTH_JWT_SECRET`.

### `apps/web/.env.local`

```
# Shared secret (must match apps/api)
AUTH_JWT_SECRET=                # `openssl rand -base64 32`

# Where the api lives
EDUCATIO_API_URL=http://localhost:3001

# No Liveblocks key here. The canvas client authenticates through
# /liveblocks-auth, which forwards the session cookie to api and relays the
# room token api mints.

# Sentry (optional in dev)
SENTRY_DSN=
```

### `apps/api/.env`

```
# Shared secret (must match apps/web)
AUTH_JWT_SECRET=

# Database
MONGODB_URI=

# Email (Resend) — owns magic-link send
RESEND_API_KEY=
EMAIL_FROM=noreply@educatio.app

# Liveblocks (server SDK — token issuance)
LIVEBLOCKS_SECRET_KEY=

# Google Gemini (aistudio.google.com/apikey)
GOOGLE_GENERATIVE_AI_API_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# Web origin for CORS allowlist
WEB_ORIGIN=http://localhost:3000

# Fastify trustProxy hop count (or CIDR/IP list). Must match the deployment's
# proxy depth; never "true" in prod. Default 1 (single LB/web hop).
TRUST_PROXY=1

# Sentry (optional in dev)
SENTRY_DSN=

# Port
PORT=3001
```

Each app ships a `.env.example` template (`apps/api/.env.example`, `apps/web/.env.example`) — copy to `.env` / `.env.local` and fill in.

---

## 4. Project Structure

Monorepo (`npm` workspaces). See `docs/ARCHITECTURE.md` for the rationale and the boundary rules.

```
educatio/                                  ← workspaces root
├── apps/
│   ├── web/                                ← Next 16
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/page.tsx    # Landing                          [built]
│   │   │   │   ├── sign-in/page.tsx        # tutor sign-in + server action     [built]
│   │   │   │   ├── sign-up/page.tsx        # tutor sign-up + server action     [built]
│   │   │   │   ├── verify/page.tsx         # check-your-email + resend         [built]
│   │   │   │   ├── set-password/page.tsx   # post-verify set/change password   [built]
│   │   │   │   ├── auth/callback/route.ts  # thin proxy: token → cookie       [built]
│   │   │   │   ├── auth/signout/route.ts   #                                  [built]
│   │   │   │   ├── auth/demo/route.ts      # flag-gated one-click demo login   [built]
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx             # list, search, filters, paging     [built]
│   │   │   │   │   ├── loading.tsx          # cold-load skeleton                [built]
│   │   │   │   │   └── actions.ts           # delete lesson                     [built]
│   │   │   │   ├── lesson/
│   │   │   │   │   ├── new/page.tsx         # + actions.ts                      [built]
│   │   │   │   │   └── [lessonId]/
│   │   │   │   │       ├── page.tsx         # placeholder until the canvas      [built]
│   │   │   │   │       ├── not-found.tsx    #                                   [built]
│   │   │   │   │       └── summary/page.tsx #                                   [not built]
│   │   │   │   ├── join/[inviteCode]/page.tsx    #                            [not built]
│   │   │   │   ├── error.tsx                # route error boundary              [built]
│   │   │   │   ├── global-error.tsx         # root-layout failure               [built]
│   │   │   │   ├── not-found.tsx            # app-wide 404                      [built]
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                      # shadcn
│   │   │   │   ├── canvas/                  # Canvas, Toolbar, PresenceLayer   [not built]
│   │   │   │   ├── lesson/                  # LessonHeader, EndLessonDialog    [not built]
│   │   │   │   └── marketing/               # Hero, Features, etc.             [built]
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts            # the one server-only fetch seam    [built]
│   │   │   │   ├── api-auth.ts              # per-domain wrappers               [built]
│   │   │   │   ├── api-lessons.ts           #                                   [built]
│   │   │   │   ├── api-error.ts             # query/queryOrNotFound/actionError [built]
│   │   │   │   ├── error-messages.ts        # ERROR_COPY, keyed on api code     [built]
│   │   │   │   ├── routes.ts                # web's own route builders          [built]
│   │   │   │   ├── revalidate.ts            # every path showing a lesson list  [built]
│   │   │   │   ├── session.ts               # Edge-safe cookie/JWT helpers      [built]
│   │   │   │   ├── session-server.ts        # getCurrentSession via next/headers [built]
│   │   │   │   ├── pdf/SummaryPDF.tsx        #                                  [not built]
│   │   │   │   └── utils.ts
│   │   │   └── proxy.ts                     # Edge: verifies session JWT        [built]
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── api/                                ← NestJS service                    [all endpoints built]
│       ├── src/
│       │   ├── main.ts                     # Fastify bootstrap, CORS, multipart
│       │   ├── app.module.ts               # root module (Config, Mongoose, features)
│       │   ├── config/                     # env.schema.ts (zod) + validated config
│       │   ├── common/                     # JwtAuthGuard, @Session(), ZodValidationPipe, filter
│       │   ├── schemas/                    # Mongoose schemas (User, MagicLink, Lesson, LessonSnapshot)
│       │   ├── auth/                       # Resend magic-link, JWT, callback
│       │   ├── sessions/                   # student session tokens
│       │   ├── lessons/                    # CRUD
│       │   ├── snapshots/                  # canvas snapshot save/latest
│       │   ├── liveblocks/                 # token issuance
│       │   ├── upload/                     # Vercel Blob proxy
│       │   └── summary/                    # Gemini call (summary.service.ts)
│       ├── nest-cli.json
│       ├── tsconfig.json
│       ├── eslint.config.mjs
│       ├── .env.example
│       └── package.json
├── packages/
│   └── shared/                             ← @educatio/shared (consumed by both apps)
│       ├── src/
│       │   ├── index.ts
│       │   ├── canvas.ts                   # CanvasElement + element types
│       │   ├── lesson.ts                   # Lesson, LessonStatus, LessonSummary
│       │   ├── auth.ts                     # SessionClaims, StudentSessionClaims
│       │   └── api/                        # zod schemas, one file per endpoint group
│       │       ├── auth.ts
│       │       ├── sessions.ts
│       │       ├── lessons.ts
│       │       ├── snapshot.ts
│       │       ├── liveblocks.ts
│       │       ├── upload.ts
│       │       └── errors.ts
│       ├── tsconfig.json
│       └── package.json
├── docs/                                   # planning + reference docs
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── SPEC.md
│   └── implementation-plan.md
├── package.json                            # workspaces: ["apps/*", "packages/*"]
├── .nvmrc
└── tsconfig.base.json                      # shared tsconfig base
```

---

## 5. Data Models & Canvas Element Types

Canonical definitions live in `docs/SPEC.md`:

- **Mongoose schemas** (`User`, `Lesson`, `LessonSnapshot`, `MagicLink`) — `docs/SPEC.md` §Data models. Schemas live in `apps/api/src/schemas/` (api only).
- **Canvas element types** (`text` / `sticky` / `shape` / `path` / `image` / `code`, all extending `BaseElement`) — `docs/SPEC.md` §Canvas element types. The TypeScript source of truth is `packages/shared/src/canvas.ts`.

---

## 6. Liveblocks Room State Shape

Canonical definition lives in `docs/SPEC.md` §Liveblocks room state — one room per `lesson.liveblocksRoomId`, `Storage` (`elements` LiveMap + `metadata` LiveObject), `Presence` (cursor/name/role/color/selection/tool), and the `POST /liveblocks/auth` server-auth rules for tutor vs student tokens.

---

## 7. Implementation Status

Behavior contracts live in `docs/SPEC.md` §Features (one heading per feature). **This is the single status tracker** — what's built, what's left. Don't restate behavior here.

### Per-feature

- [x] **Project setup** — monorepo + workspace tooling. Sentry still unwired: `@sentry/nextjs` is in `apps/web`'s deps with no config files, and `apps/api` has no Sentry dependency at all.
- [x] **Marketing landing** — see `docs/SPEC.md` §Marketing landing. Lighthouse not yet measured.
- [ ] **Authentication** — api endpoints built (`/auth/*` incl. flag-gated `/auth/demo`, authenticated `/auth/password`, `JwtAuthGuard`, `proxy.ts`, `auth/callback`, `auth/signout`). Email + password sign-in added alongside magic-link (password set only post-verification via `/auth/password`; per-account lockout; client-IP forwarding for throttling). Web screens: `/sign-up`, `/sign-in`, `/verify`, and `/set-password` built (+ shared `Input`/`Card`/`AuthShell` primitives, server actions, one-click demo login, stale-tab redirect on `/verify`). **Follow-ups:** (1) `/set-password` is the interim home for password set/change shown after verification — fold it into the profile/settings screen when that's built; (2) deferred security hardening — server-side session revocation (`tokenVersion` / make `/auth/signout` kill live sessions) and full magic-link login-CSRF defense. Remaining: tests. See `docs/SPEC.md` §Authentication.
- [x] **Tutor dashboard** — api ready (`GET /lessons`). Web page built: lesson list (card + row), search, status filters, pagination, create, delete, empty state, cold-load skeleton, shared `DashboardLayout` + sidebar. Row click uses `lessonHref`, which sends **ended** lessons to `/lesson/:id/summary` — a page that does not exist yet, so those rows 404 until Summary page ships. Remaining: tests. See `docs/SPEC.md` §Tutor dashboard.
- [x] **Lesson creation** — api endpoint built (`POST /lessons`); web form (`/lesson/new`) + server action built, redirecting to `/lesson/:id`. Remaining: tests. See `docs/SPEC.md` §Lesson creation.
- [x] **Lesson canvas** — built. Konva stage with pan/zoom (wheel, a fixed zoom ladder, pinch and two-finger pan on touch), element renderers (text, sticky, shape, path, image, code), the toolbar, colour and stroke pickers, selection with transform/rotate, undo/redo, live cursors, presence, peer selection, live strokes and live transforms through presence, image upload, and the 30s snapshot loop that finally gives the AI summary something to read. Exercised by a Playwright suite against real Liveblocks. Remaining: mobile is read-only by notice only — a one-finger drag still moves an element.
- [x] **Student join** — built. `/join/[inviteCode]` is public; the server action verifies the returned JWT and takes the lesson id from its claims before setting the student cookie, whose lifetime now follows the token. Share dialog on the lesson page is gated server-side to tutors; a signed-in tutor opening an invite link is warned before their session is replaced. Covered end to end (two browser contexts) in `e2e/join.spec.ts`. See `docs/SPEC.md` §Student join.
- [x] **Image upload** — built end to end: canvas tool and drag-and-drop, through `POST /upload`. Verified against live Vercel Blob (201 with a real blob URL). See `docs/SPEC.md` §Image upload.
- [x] **AI lesson summary** — built. Ending a lesson sets `status: ended`; generation runs when the tutor reaches the summary page, on Google Gemini with a fallback to a lighter model when one is overloaded. Unverified: nothing has run against a paid tier or at volume.
- [x] **Summary page & export** — built: `/lesson/[id]/summary` for tutor and student, the final whiteboard as inline SVG, PDF / text / clipboard exports, and an "Email to student" that prefills the tutor's mail client. Server-side sending via Resend is out of scope for v1 (see `docs/SPEC.md` §Summary page & export).
- [x] **Session history / replay** — built. The summary page shows the final board as a thumbnail, and "View canvas" opens it in a read-only pan/zoom viewer sharing the same SVG. See `docs/SPEC.md` §Session history / replay.

### Build state

- **Done:** monorepo + tooling; `apps/web` (Next 16 marketing landing; Edge `proxy.ts` JWT gate via `jose`, gating on the session _kind_ as well as its signature; `auth/callback` + `auth/signout` + flag-gated `auth/demo` route handlers; the `/sign-up` + `/sign-in` + `/verify` + `/set-password` screens on shared `Input`/`Card`/`AuthShell` primitives; the full `/dashboard` and `/lesson/new`; route boundaries; and the finished request layer — one `server-only` `api-client` seam, a mandatory response schema per call, one `ActionResult` shape per Server Action, `ERROR_COPY` keyed on the api's error code); `apps/api` (every endpoint from `docs/SPEC.md` §API routes, plus env-validated config, `@Global` CommonModule with `JwtAuthGuard` + `JwtModule`, `@Session()`/`@CurrentTutor()` decorators, `ZodValidationPipe`, `ApiError`-shaped exception filter, four Mongoose schemas); `packages/shared` (domain types, per-endpoint Zod request _and_ response schemas, shared route-path constants, builds to `dist`).
- **Verified:** `npm run check` passes (format, lint, typecheck, test) and production builds pass for all three workspaces. `apps/api`'s responses are pinned to the shared contract by `test/api-contract.spec.ts`, which boots the real Nest app against an ephemeral mongod. The magic-link sign-up / sign-in / verify / demo flows have been run against **local** Mongo.
- **Not verified:** email + password sign-in has not been run in a browser, and nothing has run against live Resend or Gemini. `apps/web` now has a Vitest suite (33 tests) and a Playwright suite (24 tests, chromium + webkit) covering the canvas, the join flow and session-cookie lifetimes against **live Liveblocks** and local Mongo — but the request layer and `proxy.ts`'s kind gate are still only covered incidentally.
- **Cross-cutting remaining:** Sentry on both apps, the `/settings` screen `proxy.ts` already gates, and the deferred auth hardening under Authentication.
- **CI:** `.github/workflows/ci.yml` runs on every push to `main` and every pull request — `npm ci`, build `@educatio/shared` (both apps import its built output, so a fresh checkout cannot typecheck without it), `npm run check`, then a production build. No secrets and no network calls: the api's contract tests run against an ephemeral in-process mongod, and the summary tests mock the AI SDK. The Playwright suite runs in two projects: `chromium` for everything, and `webkit` for the cookie behaviour that differs between engines. **Playwright stays local** — it needs live Liveblocks, Vercel Blob and Gemini, so putting it in CI means real keys and third-party flakiness in the merge path. Run `npm run test:e2e` before anything that touches the canvas, the join flow or the summary.

---

## 8. API Routes

Canonical route table (method · auth · request/response shapes) lives in `docs/SPEC.md` §API routes. All routes live on the **api service** (NestJS, base URL `EDUCATIO_API_URL`), authed by bearer JWT (`JwtAuthGuard`, tutor or student `kind`), with request/response Zod schemas in `@educatio/shared/api/*`.

---

## 9. PDF Export Format

Use `@react-pdf/renderer` to compose the summary PDF. Document structure:

```
[Header strip — Educatio logo, color-blocked]
[Title: "Lesson Summary"]
[Metadata block: lesson title, student name, date, duration]
[Horizontal rule]
[Summary content — markdown rendered as PDF text with headings, bullets, etc.]
[Footer: "Generated by Educatio • educatio.app • {date}"]
```

Page size: A4. Margins: 40pt. Body font: Inter (or system sans-serif fallback). Color accents per design brief.

---

## 10. Accessibility Requirements

- WCAG 2.1 AA compliance
- All interactive elements keyboard-navigable
- Canvas tools have keyboard shortcuts (P for pen, T for text, S for sticky, etc.)
- ARIA labels on all icon-only buttons
- Sufficient color contrast (4.5:1 for body text, 3:1 for UI components)
- Focus indicators visible
- Screen reader announcements for real-time events ("Sarah joined the lesson")

---

## 11. Performance Requirements

- Lighthouse score >90 on landing page and dashboard
- First Contentful Paint <1.5s on landing page
- Canvas can render and interact smoothly with 100+ elements
- Real-time sync latency <100ms (target; depends on Liveblocks region)
- Image uploads complete within 3s for files up to 5MB

---

## 12. Testing Approach

- **Unit tests** (Vitest): utility functions, data transformations, canvas element factories
- **Component tests** (Vitest + Testing Library): forms, toolbar, modals, summary viewer
- **E2E tests** (Playwright): full flows
  - Tutor creates lesson, joins, ends, sees summary
  - Student joins via invite link, contributes to canvas
  - Summary export downloads PDF
- Target: 70% code coverage minimum on `lib/`, smoke E2E on critical paths

### What is actually wired

Only `apps/api`. `apps/web` and `packages/shared` have no test setup yet, and there is no Playwright and no CI — so nothing runs automatically.

`npm test` at the root fans out to workspaces; `npm run check` now runs the tests too, so they gate a commit.

**The api contract test** (`apps/api/test/api-contract.spec.ts`) is the drift guard that replaces codegen. It boots the real Nest app — guards, `ZodValidationPipe` and `AllExceptionsFilter` included — against an ephemeral mongod on port 0, and asserts every response parses against its `@educatio/shared/api/*` schema. Mocks cannot do this job: a fixture only confirms itself.

Setup notes, each of which cost something to discover:

- **Vitest needs `unplugin-swc`.** Its esbuild transform drops the decorator metadata Nest's DI reads at runtime; without swc every provider fails to resolve.
- **Vitest aliases `@educatio/shared` to `src`.** The package's exports map sends runtime imports to `dist`, so without the alias the suite validates against the last build and a schema edit is invisible.
- **`ignoreEnvFile` under `NODE_ENV=test`.** `ConfigModule.forRoot()` merges `apps/api/.env`, and that file's `MONGODB_URI` otherwise beats what a harness sets — which once pointed the suite at the dev database. `forRoot()` is also evaluated _while `app.module` is imported_, so the harness imports it dynamically, after setting env.
- **Mongoose builds indexes on connect** (`autoIndex` is not disabled), so connecting is already a write. The harness therefore verifies the resolved `MONGODB_URI` **before** anything connects, and re-checks host, port and database name after. Any new suite that boots Nest should go through `test/harness.ts` rather than repeat this.
- **`mongodb-memory-server`, not Testcontainers** — it runs a real mongod rather than a fake, needs no Docker daemon and no CI service, and this suite doesn't need production-version fidelity. Switch when a test needs replica-set behaviour (transactions); `MongoMemoryReplSet` covers the step before Testcontainers becomes necessary. The binary is ~141MB cached under `node_modules/.cache/`, so the first run after `npm ci` pays a download.

**Untested and worth knowing:** everything in `apps/web`. Notably `proxy.ts`'s `claims.kind` gate is a security fix with no test behind it, and `lib/`'s pure functions (`dashboardHref`, `lessonHref`, `isPlainClick`, `safeTimeZone`) are the cheapest tests available — no MSW, no browser.

---

## 13. Acceptance: v1 is "Done" When

- A tutor can sign up, create a lesson, share the invite link, work with a student on the canvas, end the lesson, view the AI summary, and export it as PDF — without errors and without leaving Educatio (except to open their separate video call)
- A student can join via invite link without an account, contribute to the canvas, and download the summary after the lesson
- The landing page communicates the product clearly and converts visitors to signups
- All routes are responsive at 1280px and 768px widths (mobile editing is out of scope; viewing should still render)
- Deployed to Vercel with custom domain
- Sentry receiving error events
- No `any` types in committed code (strict TypeScript)

---

## 14. Notes for the Implementing Agent

- Follow `docs/DESIGN.md` for visual specs (colors, spacing, typography) — this document does not duplicate them.
- If a technical decision is ambiguous, prefer the simpler option and document the choice in a code comment.
- **Boundary discipline:** `apps/web` is UI; `apps/api` is everything else. Don't paper over a missing endpoint by adding Mongo/AI/Liveblocks-server/Blob/Resend deps to the web app — add the endpoint to api instead. Enforced at lint time by `no-restricted-imports` in `apps/web/eslint.config.mjs`, and by which packages are installed in which workspace.
- Prefer Next server components by default; client components only where interactivity is required (canvas, toolbar, forms).
- All web→api calls go through `apps/web/src/lib/api-client.ts` (typed wrapper that reads the `educatio_session` cookie and forwards it as a bearer token).
- All api routes use Zod schemas from `@educatio/shared/api/*` for request/response validation — no ad-hoc types in controllers.
- All Mongoose models live in `apps/api/src/schemas/` — never imported from `apps/web`.
- All AI calls go through `apps/api/src/summary/summary.service.ts` (dynamic-imports the ESM-only `ai`/`@ai-sdk/google`) — single point of configuration.
- All Liveblocks **server** calls go through `apps/api/src/liveblocks/` — never `@liveblocks/node` in web.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, etc.). Scope by app where useful: `feat(api): add lessons module`, `feat(web): wire api-client`.

---

_End of v1 implementation requirements._
