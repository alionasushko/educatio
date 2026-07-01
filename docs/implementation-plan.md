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
| Auth               | Resend magic-link → JWT issued by Nest, stored as `httpOnly` cookie by web                                 | `apps/api` owns; `apps/web` stores cookie |
| Database           | MongoDB Atlas + Mongoose                                                                                   | `apps/api` only                           |
| AI                 | Anthropic Claude via Vercel AI SDK (`@ai-sdk/anthropic`)                                                   | `apps/api` only                           |
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

# Liveblocks client (public key, safe to ship)
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=

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

# Anthropic
ANTHROPIC_API_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# Web origin for CORS allowlist
WEB_ORIGIN=http://localhost:3000

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
│   │   │   │   ├── sign-in/page.tsx        #                                  [not built]
│   │   │   │   ├── sign-up/page.tsx        # tutor sign-up + server action     [built]
│   │   │   │   ├── verify/page.tsx         # check-your-email + resend         [built]
│   │   │   │   ├── auth/callback/route.ts  # thin proxy: token → cookie       [built]
│   │   │   │   ├── auth/signout/route.ts   #                                  [built]
│   │   │   │   ├── (app)/
│   │   │   │   │   ├── dashboard/page.tsx   # stub: greeting + sign-out        [built]
│   │   │   │   │   ├── lesson/
│   │   │   │   │   │   ├── new/page.tsx     #                                  [not built]
│   │   │   │   │   │   └── [lessonId]/
│   │   │   │   │   │       ├── page.tsx     #                                  [not built]
│   │   │   │   │   │       └── summary/page.tsx  #                             [not built]
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── join/[inviteCode]/page.tsx    #                            [not built]
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                      # shadcn
│   │   │   │   ├── canvas/                  # Canvas, Toolbar, PresenceLayer   [not built]
│   │   │   │   ├── lesson/                  # LessonHeader, EndLessonDialog    [not built]
│   │   │   │   └── marketing/               # Hero, Features, etc.             [built]
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts            # typed fetch over EDUCATIO_API_URL [built]
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
│       │   └── summary/                    # Anthropic call (summary.service.ts)
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

- [x] **Project setup** — monorepo + workspace tooling. Sentry wiring still pending.
- [x] **Marketing landing** — see `docs/SPEC.md` §Marketing landing. Lighthouse not yet measured.
- [ ] **Authentication** — api endpoints built (`/auth/*`, `JwtAuthGuard`, `proxy.ts`, `auth/callback`, `auth/signout`). Web screens: `/sign-up` and `/verify` built (+ shared `Input`/`Card`/`AuthShell` primitives, server actions); `/sign-in` still not built. See `docs/SPEC.md` §Authentication.
- [ ] **Tutor dashboard** — api ready (`GET /lessons`). Web page (`/dashboard`) is a stub (auth-loop landing: greeting via `/auth/me` + sign-out); the full dashboard (lesson list, sidebar, pagination, empty state) is not built. See `docs/SPEC.md` §Tutor dashboard.
- [ ] **Lesson creation** — api endpoint built (`POST /lessons`). Web form (`/lesson/new`) not built. See `docs/SPEC.md` §Lesson creation.
- [ ] **Lesson canvas** — api endpoints built (`/lessons/:id`, `/lessons/:id/snapshot`, `/liveblocks/auth`). Canvas UI, toolbar, presence, snapshot loop not built. See `docs/SPEC.md` §Lesson canvas.
- [ ] **Student join** — api endpoint built (`POST /sessions/student`). Web page (`/join/[inviteCode]`) not built. See `docs/SPEC.md` §Student join.
- [ ] **Image upload** — api endpoint built (`POST /upload`). Canvas-tool integration not built. See `docs/SPEC.md` §Image upload.
- [ ] **AI lesson summary** — api endpoint built (`POST /lessons/:id/summary`). End-lesson trigger not wired. See `docs/SPEC.md` §AI lesson summary.
- [ ] **Summary page & export** — web page + PDF/Text/Copy/Email controls not built. See `docs/SPEC.md` §Summary page & export.
- [ ] **Session history / replay** — see `docs/SPEC.md` §Session history / replay.

### Build state

- **Done:** monorepo + tooling; `apps/web` (Next 16 marketing landing, Edge `proxy.ts` JWT gate via `jose`, `auth/callback` + `auth/signout` route handlers, typed `api-client`, `session.ts` / `session-server.ts`, the `/sign-up` + `/verify` screens and a `/dashboard` stub built on shared `Input`/`Card`/`AuthShell` primitives, following the folder-per-component convention); `apps/api` (every endpoint from `docs/SPEC.md` §API routes, plus env-validated config, `@Global` CommonModule with `JwtAuthGuard` + `JwtModule`, `@Session()`/`@CurrentTutor()` decorators, `ZodValidationPipe`, `ApiError`-shaped exception filter, four Mongoose schemas); `packages/shared` (domain types + per-endpoint Zod schemas, builds to `dist`).
- **Verified:** `tsc --noEmit` and production builds pass for all three workspaces; both `apps/web` and `apps/api` have their own ESLint configs and lint clean.
- **Not verified:** nothing has been run against live Mongo/Resend/Liveblocks/Anthropic — those need real env values.
- **Cross-cutting remaining:** the rest of the web screens (`/sign-in`, full dashboard, lesson creation, lesson canvas, summary, student join — consuming the existing endpoints), Sentry on both apps, and tests.

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
- All Anthropic calls go through `apps/api/src/summary/summary.service.ts` (dynamic-imports the ESM-only `ai`/`@ai-sdk/anthropic`) — single point of configuration.
- All Liveblocks **server** calls go through `apps/api/src/liveblocks/` — never `@liveblocks/node` in web.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, etc.). Scope by app where useful: `feat(api): add lessons module`, `feat(web): wire api-client`.

---

_End of v1 implementation requirements._
