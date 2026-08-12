# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project context

Educatio is a collaborative whiteboard for one-on-one online tutoring. The project is structured as a **monorepo with two apps** (npm workspaces):

- **`apps/web`** — Next 16 / React 19 / Tailwind v4 / shadcn `base-nova`. **UI only** — no DB, AI, email, or Liveblocks-server code (the boundary rule is now real, not aspirational). Has the marketing landing (`/`), the magic-link plumbing (`auth/callback` + `auth/signout` route handlers), the Edge `proxy.ts` gate, the typed `api-client`, and session helpers. The tutor sign-up (`/sign-up`), sign-in (`/sign-in`), email-verify (`/verify`), and post-verification set-password (`/set-password`) screens are built (on shared `Input`/`Card`/`AuthShell` primitives), including email+password sign-in alongside magic-link and a flag-gated one-click demo login. The `/dashboard` is built — lesson list with search, status filters and pagination, create and delete, and a skeleton for the cold load — as are the route boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`). Still to build: the lesson canvas, the summary, and student join (`/lesson/[id]` is a placeholder, `/lesson/[id]/summary` and `/join/[code]` don't exist) — they consume the api that already exists.
- **`apps/api`** — NestJS + Fastify. Owns data (Mongoose), auth (Resend magic-link → JWT), AI (Anthropic), Liveblocks token issuance, blob uploads, email. **All endpoints are implemented**: `auth/*`, `sessions/student`, `lessons` CRUD, `lessons/:id/snapshot`, `lessons/:id/summary`, `liveblocks/auth`, `upload`.
- **`packages/shared`** — `@educatio/shared`: domain types (`canvas`, `lesson`, `auth`) + per-endpoint Zod schemas under `@educatio/shared/api/*`. Consumed by both apps.

> **Status.** The marketing landing, the tutor `/sign-up` + `/sign-in` + `/verify` + `/set-password` screens, and the `/dashboard` (list, search, filters, pagination, create, delete) are built; every api endpoint is implemented. The web→api request layer is finished and hardened — one `server-only` seam, a response schema required on every call, one `ActionResult` shape for every Server Action, and route boundaries for errors and 404s (see `docs/ARCHITECTURE.md` §Request layer for the rules and the rejected alternatives). The remaining work is the **lesson canvas, the summary, and student join** (see `docs/SPEC.md` §Features), plus Sentry wiring and the rest of the tests.
>
> **Verification status.** Everything compiles, builds, and passes `npm run check`. The api's responses are pinned to the shared contract by `apps/api/test/api-contract.spec.ts`; `apps/web` has no tests at all yet, so the request-layer behaviour above is type-checked and reasoned about but not exercised — including `proxy.ts`'s tutor-claim gate. The magic-link sign-up / sign-in / verify / demo flows have been run against **local** Mongo (Resend unconfigured in dev, so the magic link is logged to the api console). Email + password sign-in and everything added since have not been run in a browser. Nothing has run against live Resend/Liveblocks/Anthropic — treat behavior beyond local magic-link auth as unverified.

Read first when picking up work:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — repo shape, web↔api boundary, auth flow, deployment.
- [docs/SPEC.md](docs/SPEC.md) — task list with API contracts, data shapes, and the lesson-summary prompt.
- [docs/DESIGN.md](docs/DESIGN.md) — per-screen visual specs, design tokens, motion system, and cross-cutting UX conventions (loading/empty/error states, toasts, forms, realtime/connection).
- [docs/implementation-plan.md](docs/implementation-plan.md) — tech-stack table, env vars, full project tree, build status.

## Commands

```bash
# Root (npm workspaces) — installs both apps and packages/shared
npm install

# From root, scoped to the web app (most common)
npm run dev                  # next dev on :3000 (delegates to apps/web)
npm run build                # builds all workspaces
npm run lint                 # lints all workspaces
npm run typecheck            # tsc --noEmit across all workspaces
npm run format               # prettier --write across the repo
npm run check                # one-shot gate: format:check + lint + typecheck + test (run before committing)
npm run test                 # vitest across workspaces (only apps/api has a suite today)

# Run the api dev server
npm run dev:api              # nest start --watch on :3001

# Work in a specific workspace
npm run dev -w @educatio/web
npm run start:dev -w @educatio/api
npm run typecheck -w @educatio/shared

# After editing packages/shared — its exports map points at dist, so both apps
# import the BUILT output at runtime while TypeScript reads src. Skip this and
# typecheck passes while dev serves the stale dist (a new export arrives as
# `undefined`). Run the watcher in a third terminal when working in shared.
npm run build -w @educatio/shared
npm run dev -w @educatio/shared     # tsc -w, same thing on save
```

Node version is pinned to 22.22.2 (`.nvmrc`) — run `nvm use` before any command. Next 16 refuses to start on <20.9.

## Architecture

### Boundary rule (the only one that really matters)

`apps/web` is UI. `apps/api` is everything else. Web is forbidden from importing the api-only packages — `mongoose`/`mongodb`, `@liveblocks/node`, `@ai-sdk/anthropic`, `ai`, `@vercel/blob`, `resend`, `bcrypt`, plus the unused `next-auth`/`@auth/mongodb-adapter`. The full list is enforced at lint time by `no-restricted-imports` in [apps/web/eslint.config.mjs](apps/web/eslint.config.mjs), and those packages live only in api's workspace. If a web route needs data, add the endpoint to api — don't paper over a missing endpoint by reaching for a DB client.

### Auth flow

Nest owns the identity surface:

1. **Sign-up** posts `{ name, email, teaches? }` to `POST /auth/signup`; api creates the (unverified) user and emails a magic-link verification via Resend. No password at signup — a password is set only after verification, via the authenticated `POST /auth/password` (the `/set-password` screen), so it can never be planted on an account the caller doesn't control.
2. **Sign-in** has two paths: password (`POST /auth/signin/password` — api verifies the hash and, once the email is verified, returns a session JWT that the sign-in server action sets as the cookie) and magic-link (`POST /auth/signin` — emails a link; also the password-recovery route).
3. Any magic-link URL (sign-up verification or magic-link sign-in) hits `apps/web/src/app/auth/callback/route.ts`, which proxies to `POST /auth/callback`, marks `emailVerified`, and sets an `educatio_session` httpOnly cookie from the returned JWT.
4. `apps/web/src/proxy.ts` (the Edge gate) verifies that JWT's signature (HS256, `AUTH_JWT_SECRET`) on every request to `/dashboard`, `/lesson/*`, `/settings`. No DB calls, no api calls — just signature check.
5. Web's typed `api-client` reads the cookie and forwards it as `Authorization: Bearer <jwt>` on every server-side fetch to api. Api's `JwtAuthGuard` verifies with the same secret.

Students join without an account: api mints a scoped JWT (`kind: 'student'`, `lessonId`, `name`, 7-day exp). The same guard accepts either kind and scopes accordingly.

### Shared types

`@educatio/shared` exports `CanvasElement` (+ variants), `Lesson`, `LessonStatus`, `LessonSummary`, `SessionClaims`, `StudentSessionClaims`, plus Zod schemas in `@educatio/shared/api/*` for every endpoint. Api consumes via `ZodValidationPipe`; web consumes via the typed `api-client`. **Do not** redefine these types in either app.

### Realtime canvas

- `@liveblocks/node` (server SDK): api only — under `apps/api/src/liveblocks/`. Issues room tokens via `POST /liveblocks/auth`.
- `@liveblocks/react`, `@liveblocks/client`: web only — will live under `apps/web/src/components/canvas/` (not built yet). Connects to rooms using the token from api.
- One room per `lesson.liveblocksRoomId`. Storage = `LiveMap<elementId, CanvasElement>` + a metadata `LiveObject`. Presence = cursor/name/role/color/selection/tool. Full schema in [docs/SPEC.md §Liveblocks](docs/SPEC.md).

### Design tokens

Brand tokens (`--bg`, `--surface`, `--accent-brand`, sticky palette, `--shadow-*`, etc.) are wired in [apps/web/src/app/globals.css](apps/web/src/app/globals.css) and mapped onto shadcn semantic tokens via `@theme inline`. Use tokens, not hard-coded hex — and prefer the token-mapped Tailwind utility (`text-accent-brand`, `bg-surface`, `border-border-subtle`) over inline `style={{ color: "var(--accent-brand)" }}`. Reserve inline `var()` (or an arbitrary class like `shadow-[var(--shadow-medium)]`) for tokens with no mapped utility (e.g. shadows) or dynamic/computed values (e.g. a prop-driven `fontSize`). Fonts (`font-sans` Inter, `font-mono` JetBrains Mono, `font-hand` Caveat, `font-display` Fraunces) are loaded in [apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx) via `next/font/google`. UI icons come from `lucide-react` (use the `*Icon` named exports, e.g. `UsersIcon`, `ArrowRightIcon`); reserve inline `<svg>` for the brand mark and bespoke illustrations (the product-preview mock, the how-it-works step illos) that have no library equivalent — don't hand-author glyphs that lucide already provides.

### Next 16 specific

The Next file convention previously called `middleware.ts` is now `proxy.ts`. [apps/web/src/proxy.ts](apps/web/src/proxy.ts) verifies the `educatio_session` JWT (HS256 via `jose`, Edge-safe) on `/dashboard`, `/lesson/*`, `/settings` — no DB or api calls. Before editing it, read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — the file convention, matcher syntax, and runtime contract differ from middleware-era patterns.

## Constraints & policies

**Security — MUST follow:**

- Secrets live in `apps/api` only — `ANTHROPIC_API_KEY`, `AUTH_JWT_SECRET`, `MONGODB_URI`, `RESEND_API_KEY`, `LIVEBLOCKS_SECRET_KEY`, `BLOB_READ_WRITE_TOKEN`. The web bundle may contain only `NEXT_PUBLIC_*` values (e.g. the Liveblocks _public_ key). The boundary rule enforces this — never import an api-only package into web to reach a secret.
- Secrets come from env vars only, validated at boot in `apps/api/src/config/env.schema.ts`. No hard-coded keys, ever.
- Never commit `.env`, `.env.local`, or any file containing keys (already gitignored — keep it that way).
- Validate **and** sanitize all external input. Validation: Zod at the api boundary (`@educatio/shared/api/*`). Sanitization: render the markdown summary without raw HTML (react-markdown's default — do not add `rehype-raw`), never pass user/AI-generated strings to `dangerouslySetInnerHTML`, and treat canvas content as untrusted.
- Protected api routes sit behind `JwtAuthGuard`; `apps/web/src/proxy.ts` verifies the session JWT on protected paths. No unauthenticated data access.

**Code quality:**

- TypeScript strict; no `any` without an inline justification comment.
- Run `npm run check` before committing (format, lint, typecheck, and tests in one shot).
- Conventional commits with app scope: `feat(api): …`, `feat(web): …`, `feat(shared): …`.

**Dependencies:**

- Prefer existing shadcn (`base-nova`) components over adding a new UI library.
- Minimize external dependencies, especially for the MVP — a new runtime dep needs a reason, and it belongs to exactly one workspace (respect the api/web boundary before adding).

**Architecture conventions** — short version; full list in [docs/SPEC.md §Implementation conventions](docs/SPEC.md):

- Boundary discipline (above) — load-bearing, hard rule.
- Server components by default in web; client only where interactive.
- Components as an arrow `const` + `export default`, one per **folder** — `component-name/index.tsx` holds the component, with a co-located `helpers/` subfolder for non-component code (`types.ts`, `constants.ts`, `enums.ts`, `helpers.ts` as needed), a nested `components/` folder for child components, and `__tests__/` for tests. The shadcn primitives in `components/ui/` stay flat single-files; older flat components migrate to the folder shape over time. Props typed as an `interface` (use `type` only for unions/intersections/mapped types); non-components keep named exports. Prefer arrow-function expressions over `function` declarations for **all** functions — module utilities and lib helpers too, not just components (`export const safeInternalPath = (…) => { … }`). Use a `function` declaration only where the language requires it: call-before-definition hoisting, TypeScript overload signatures, or generators — plus one exception by convention: `route.ts` HTTP method exports (`export async function POST(…)`) keep Next's documented form, since the framework calls them by name and route files are what we paste from Next's docs. A page's `export default` is not an exception — the component rule covers it.
- Name components for what they are to the user, not for how they render. `Container`, `Wrapper`, `View` and `Shell` describe something true of every component and so say nothing; when no domain name fits, that usually means the component has two jobs. `*Layout` is the exception — arrangement genuinely _is_ the job, and Next already uses the term (`DashboardLayout`). `AuthShell` predates this and should become `AuthLayout` when someone is next in those files.
- File and folder names are kebab-case (`sign-up-form/index.tsx`, `faq-section.tsx`); the component identifier inside is PascalCase (`SignUpForm`).
- All web→api calls through `apps/web/src/lib/api-client.ts`.
- All api validation via Zod schemas in `@educatio/shared/api/*`.
