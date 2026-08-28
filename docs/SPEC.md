# Educatio — Implementation Spec

This file is the **task list with acceptance criteria, API contracts, data shapes, and the AI prompt**. Read it before starting any task.

Architecture-level companions:

- `docs/ARCHITECTURE.md` — repo shape, web↔api boundary, auth flow, deployment.
- `docs/implementation-plan.md` — tech-stack table, env vars, full project tree, build status.
- `docs/DESIGN.md` — per-screen visual specs, design tokens, and cross-cutting UX conventions.

Where this spec says "API route", the route lives in `apps/api` (NestJS controller); where it says "page" or "client", it lives in `apps/web`. The §API routes section uses the api host as the base (`EDUCATIO_API_URL`, e.g. `https://api.educatio.app`) — the web host has no `/api/*` surface.

## Done definition (v1 ships when)

- A tutor can sign up → create a lesson → share the invite link → work with a student on the canvas → end the lesson → view the AI summary → export as PDF — without errors and without leaving Educatio (except to open their separate video call).
- A student can join via invite link without an account, contribute to the canvas, and download the summary after the lesson.
- Landing page communicates the product clearly and converts visitors to signups.
- All routes responsive at 1280px and 768px (mobile editing out of scope; viewing still renders).
- Deployed to Vercel with custom domain. Sentry receiving error events. No `any` types in committed code (strict TypeScript).

## Features

The behavior contract for each feature, organized by screen/concern. Implementation status is tracked in `docs/implementation-plan.md` §7 — this section describes _what the system must do_, not _what's built yet_.

### Marketing landing (`/`)

Sections: hero · 3 feature highlights · how-it-works · FAQ · footer. CTA "Get started free" → `/sign-up`. Fully responsive. Lighthouse target >90.

### Authentication

Auth lives in `apps/api` (NestJS, `auth/` module). `apps/web` only renders forms, stores the `educatio_session` httpOnly cookie issued by api, and gates routes by verifying that cookie's JWT in `proxy.ts`. See `docs/ARCHITECTURE.md` §Auth flow for the full sequence.

**Web pages** (`apps/web/src/app/`):

- `/sign-in`: email + password → `POST {EDUCATIO_API_URL}/auth/signin/password`; on success the server action sets the session cookie and redirects to `/dashboard` (honoring `callbackUrl`). A "Forgot your password? Email me a magic link" action falls back to `POST /auth/signin` → `/verify` (also the recovery path). Footer: "New to Educatio? Create a tutor account" → `/sign-up`.
- `/sign-up`: tutor account creation form.
  - Eyebrow "For tutors" + heading "Create your tutor account"
  - Subhead: "Free for solo tutors — unlimited lessons, no card needed. Setup takes 30 seconds."
  - Fields:
    - **Your name** (required) — placeholder "Sara Martínez", autofocus. Sent as `name`.
    - **Email** (required, valid email) — placeholder "you@school.com", helper "We'll send a link to confirm it's you."
    - **What do you teach?** (optional, free text) — placeholder "Spanish, GCSE Maths, piano…", helper "Optional. Helps us tailor your lesson templates." Sent as `teaches`.
  - Primary CTA "Create account" (full-width, size lg) → `POST {EDUCATIO_API_URL}/auth/signup { name, email, teaches? }` → renders `/verify`. No password field — a password is set later, post-verification (see `/set-password`).
  - Below the CTA: small terms/privacy line — "By creating an account you agree to our Terms and Privacy Policy."
  - Below the card: callout (accent-tint background, check icon) — "Are you a student? You don't need an account — just open the lesson link your tutor sent."
  - Footer link: "Already have an account? Sign in" → `/sign-in`.
- `/verify`: informational ("Check your email"). No form submit; the magic link does the work.
- `/set-password`: authenticated; shown after magic-link verification (the callback's default landing when there's no stashed deep-link). Sets/replaces the password via `POST {EDUCATIO_API_URL}/auth/password` (authenticated — the only way a password is ever set). "Skip for now" → `/dashboard`. **Interim home:** when the profile/settings screen is built, move password set/change there and drop this standalone page (or redirect it).
- `auth/callback/route.ts` (server route, not a page): receives the magic-link URL (`?token=…`) → calls `POST {EDUCATIO_API_URL}/auth/callback { token }` → on success, sets `educatio_session` httpOnly cookie (`SameSite=Lax`, `Secure` in prod, path `/`) from the returned JWT → redirects to `/dashboard`. On failure, redirects to `/sign-in?error=invalid-token`.
- `proxy.ts`: Edge runtime, verifies the `educatio_session` JWT (HS256, `AUTH_JWT_SECRET`) on every request to `/dashboard`, `/lesson/*`, `/settings`, `/set-password`. No DB calls, no api calls. Unauthenticated → redirect to `/sign-in?callbackUrl=…`. It also checks the token's `kind`: a student may reach only `/lesson/<their own lessonId>` plus an allowlist of subpaths under it (currently `summary`); anywhere else in the matcher redirects them to their own lesson room.
- Sign-out: web clears the cookie, calls `POST {EDUCATIO_API_URL}/auth/signout`, redirects to `/`.

**Api endpoints** (`apps/api/src/auth/`):

- `POST /auth/signup` — body `{ name, email, teaches? }`. Creates the (unverified) User (idempotent on email — re-sends the verification link if the user already exists). No password is set here. Mints a one-time link token (`crypto.randomBytes(32).toString('base64url')`) with 10-min expiry, stores `{ tokenHash, userId, expiresAt }` in a `magic_links` collection. Sends email via Resend with link → `{WEB_ORIGIN}/auth/callback?token={raw}`. Returns `{ sent: true }`.
- `POST /auth/signin` — body `{ email }`. Same flow as signup, but does NOT create a user if missing — still returns `{ sent: true }` (no user enumeration). Real send only happens for existing users.
- `POST /auth/signin/password` — body `{ email, password }`. Verifies the bcrypt hash (against a dummy hash when the account/password is absent, so timing doesn't leak existence). ALL failure modes — unknown email, no password set, wrong password, unverified, or a live lockout — return the same generic `401 { code: 'invalid_credentials' }` (no account-existence or credential-validity oracle). Per-account lockout after 10 consecutive failures for 15 min (magic-link sign-in still works). Success → `{ sessionJwt }` (HS256, `{ kind: 'tutor', sub, email }`, 30-day exp). The demo account is rejected here. Throttled 10/min.
- `POST /auth/password` — **authenticated** (`JwtAuthGuard`, tutor session); body `{ password }` (min 8, ≤72 bytes). bcrypt-hashes and sets/replaces the caller's own `passwordHash`, keyed on the session `sub`. This is the ONLY way a password is ever set, so it can't be planted on an account before its email is verified; it's also the recovery path (sign in via magic link, then set a new one). The demo account is rejected. Returns `{ ok: true }`. Throttled 10/min.
- `POST /auth/callback` — body `{ token }`. Atomically consumes the link (`findOneAndUpdate` matching an unused, unexpired `tokenHash` and setting `usedAt`, so it can't be replayed under concurrency), marks `User.emailVerified=now`, mints a session JWT (HS256, payload `{ kind: 'tutor', sub: userId, email, iat, exp: +30d }`), returns `{ sessionJwt }`.
- `POST /auth/signout` — placeholder for future revocation; v1 returns `{ ok: true }` immediately (the web simply clears the cookie).
- `GET /auth/me` — auth required; returns `{ user: { id, email, name, image?, teaches?, hasPassword } }` (`hasPassword` drives the set-vs-change label; the hash itself is never returned).
- `POST /auth/demo` — no body; gated by `ENABLE_DEMO_LOGIN` (returns `403` when unset). Upserts a shared, reserved demo tutor (`demo@educatio.app`, never reachable via the signup/signin magic-link flow) and returns a short-lived (`1d`) `{ sessionJwt }`. Powers the one-click "Try demo" button.

### Tutor dashboard

- Route: `/dashboard`
- Past lessons (newest first): title · student · date · duration · status
- Row click → summary page (ended) or active lesson (active)
- Primary CTA "Start new lesson" → `/lesson/new`
- Empty state: friendly illustration + "Create your first lesson" CTA
- Pagination if >20 lessons

### Lesson creation

- Route: `/lesson/new`
- Fields: title (required) · studentName (optional, auto-fills from invite if blank) · videoCallUrl (optional, must be valid URL)
- Submit: create `Lesson` doc, generate a 10-char URL-safe `inviteCode`, create Liveblocks room, redirect to `/lesson/[lessonId]`

### Lesson canvas

The centerpiece of the app.

- Route: `/lesson/[lessonId]`
- Header bar: title (editable inline) · Share · End lesson · Join video (only if `videoCallUrl` set)
- **Share modal:** invite link (`/join/[inviteCode]`) + copy button
- **Video call button:** opens URL in new tab
- **End lesson:** confirmation dialog → set `status='ended'`, `endedAt=now` → trigger summary generation → redirect to `/lesson/[lessonId]/summary`
- Canvas: full remaining viewport, edge-to-edge
- Toolbar (bottom-center): tool selector + color picker (for pen/text) + zoom controls
- All canvas element types renderable + editable (see Canvas types section)
- Real-time sync via Liveblocks (multi-user collaborative editing)
- Live cursors with names
- Pan: space+drag or middle-click+drag · Zoom: cmd/ctrl + scroll
- Undo/redo per-user (cmd+z / cmd+shift+z)
- Periodic snapshot to MongoDB every 30s while canvas is active

### Student join (no auth)

- Route: `/join/[inviteCode]`
- Invalid code → the join form reports it inline on submit (`invalid_invite`). Deliberately not checked before submit: a pre-submit check would confirm whether a code exists to anyone probing.
- A visitor already signed in as a tutor is warned before joining, since a student session replaces their tutor cookie on that device.
- Valid: form with "Your name" + "Join lesson" button
- Submit: `POST /sessions/student { inviteCode, name }` on api → web stores returned student JWT in an httpOnly cookie · redirect to lesson with `?role=student`
- Student sees same canvas as tutor but **cannot** see End lesson or Share controls. Can use all canvas tools.

### Image upload

- Image tool + click canvas (or drag image file) → `POST /upload` to api (multipart `file`); api proxies to Vercel Blob.
- Returns public URL → create `ImageElement` at click position
- Max 5MB. Types: PNG, JPG, WEBP, GIF
- Loading indicator during upload

### AI lesson summary

- Trigger: ending a lesson only sets `status: ended` (`PATCH /lessons/:id`); the tutor is then sent to the summary page, which fires `POST /lessons/:id/summary` on arrival when the lesson has no summary yet. Generation takes 15-30s, so doing it inside the End action blocked the tutor on a spinner and delayed everyone else finding out.
- Ending broadcasts a `lesson-ended` Liveblocks room event. The lesson's status is read server-side, so without it a student keeps a live canvas until they reload.
- Serialize all canvas elements into structured text (e.g. `Sticky note: "Quadratic formula"`, `Text block: "Solve for x"`, `Code block (Python): ...`).
- Send to Google Gemini (`gemini-3.5-flash` via `GOOGLE_GENERATIVE_AI_API_KEY` — the newest Flash models shed free-tier traffic under load, so this deliberately isn't the latest, streaming **disabled** — we want the full response saved at once). The api's single point of configuration is `apps/api/src/summary/summary.service.ts`. Unset key → 503 `service_unavailable`, and the summary page offers Generate. **Gemini's free tier trains on submitted content** — move to a paid tier before real student data runs through it.
- Save markdown to `lesson.summary.text`.
- On error: surface a failure to the caller; the page offers Regenerate.
- **Prompt template:**

  ```
  You are summarizing a tutoring lesson based on the contents of a collaborative whiteboard.

  Lesson title: {title}
  Student: {studentName}
  Duration: {durationMinutes} minutes

  Canvas contents (in spatial order, top-to-bottom, left-to-right):
  {serializedElements}

  Generate a concise lesson summary in markdown format with these sections:
  - **Topics covered** (bullet list of main topics, inferred from canvas content)
  - **Key concepts** (3–5 main ideas or formulas discussed)
  - **Examples worked through** (problems or examples explored, if identifiable)
  - **Suggested next steps** (2–3 specific things the student should review or practice before the next lesson)

  Keep the summary under 400 words. Use a warm, professional tone — this will be sent to the student.

  Write plain markdown only: headings, bullet lists, numbered lists, and bold. No LaTeX or mathematical notation, no code fences, and no tables — the summary is also sent as plain-text email, where that markup shows up as raw symbols.
  ```

### Summary page & export

- Route: `/lesson/[lessonId]/summary`
- Accessible to: lesson tutor (always) + student who joined (valid for 7 days after lesson ends)
- Displays: title · date · duration · markdown summary (render with `react-markdown`)
- **Export controls:**
  - **Download as PDF** — client-side via `@react-pdf/renderer`; Educatio brand header + metadata + summary content (layout in `docs/DESIGN.md` §PDF export)
  - **Download as Text (.txt)** — markdown stripped
  - **Copy to clipboard** — markdown
  - **Email to student** (tutor only) — via Resend to a specified email
- Failed-summary state: "Regenerate" button (re-runs `POST /lessons/:id/summary`).
- Thumbnail of final canvas state (rendered from snapshot)

### Session history / replay (read-only)

- Ended lesson opened from dashboard → `/lesson/[lessonId]/summary`
- "View canvas" toggle shows final snapshot (read-only, pan/zoom enabled, no editing)

## Data models (Mongoose; schemas live in `apps/api/src/schemas/`, **api only**)

- **`User`** — `email` (unique) · `name` · `image?` · `emailVerified` (Date) · `teaches?` (free-text, captured at sign-up) · timestamps.
- **`Lesson`** — `tutorId` (ref User) · `title` · `studentName?` · `videoCallUrl?` · `inviteCode` (unique) · `status: 'scheduled' | 'active' | 'ended'` · `startedAt?` · `endedAt?` · `durationSeconds?` · `liveblocksRoomId` (unique) · `summary?: { text, generatedAt }` · timestamps.
- **`LessonSnapshot`** — `lessonId` (ref) · `canvasState` (Mixed JSON) · `snapshotAt`. Liveblocks holds live state; this is the persistent backup for replay.
- **`MagicLink`** — `userId` (ref) · `tokenHash` (sha256 of the raw token) · `expiresAt` (TTL index, 10 min) · `usedAt?`. One-time tokens for the email magic-link flow.

The TypeScript types consumed by `apps/web` (`Lesson`, `LessonStatus`, `LessonSummary`, `CanvasElement`, etc.) live in `packages/shared` — not derived from Mongoose. Schemas in api use these shared types as the source of truth for non-DB-only fields.

## Canvas element types (`packages/shared/src/canvas.ts`)

All extend `BaseElement` (`id` nanoid · `type` · `x` · `y` · `rotation` · `zIndex` · `createdBy` · `createdAt` ms).

| `type`   | Extra fields                                                                   |
| -------- | ------------------------------------------------------------------------------ |
| `text`   | width · height · content · fontSize · fontWeight · fontStyle · color           |
| `sticky` | width · height · content · color (yellow/pink/blue/green/purple)               |
| `shape`  | shape (rectangle/circle/arrow) · width · height · stroke · strokeWidth · fill? |
| `path`   | points (flat `[x1,y1,x2,y2,...]`) · stroke · strokeWidth                       |
| `image`  | width · height · src (Vercel Blob URL)                                         |
| `code`   | width · height · language · content                                            |

## Liveblocks room state

One room per `lesson.liveblocksRoomId`.

**Storage (persistent shared state):**

```ts
{
  elements: LiveMap<string, CanvasElement>,    // keyed by element.id
  metadata: LiveObject<{ lastEditedAt: number, elementCount: number }>
}
```

**Presence (per-user ephemeral state):**

```ts
{
  cursor: { x: number, y: number } | null,
  name: string,                  // "Maria" or "Sarah"
  role: 'tutor' | 'student',
  color: string,                 // assigned cursor color
  selection: string[] | null,
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'image' | 'code',
  draft: { x, y, points: number[], stroke: string, strokeWidth: number } | null,
  transforming: { id, x, y, rotation, scaleX, scaleY } | null
}
```

`draft` carries the stroke a person is currently drawing, so the other side sees
the line form instead of waiting for the pen to lift. It belongs in presence
rather than storage: an in-progress stroke is ephemeral, should create no undo
steps, and must vanish by itself if that person disconnects mid-stroke — all of
which presence gives and a storage write does not. It holds the colour as a
design-token name, so the peer resolves it against their own palette.

`transforming` does the same for a resize or rotation in progress: the other
side follows the gesture instead of seeing the element jump when the handle is
released. It cannot be a storage write, because the element is mid-gesture and
Konva is still applying its own scale to that node — writing the derived size
back would fight it. Peers render the element with these values in place of the
stored ones until the field clears.

**Server auth (`POST /liveblocks/auth` on api):** the `JwtAuthGuard` accepts either a tutor JWT (`kind: 'tutor'`, read+write any room they own) or a student session JWT (`kind: 'student'`, read+write **only** the `lessonId` baked into the token). The controller then calls `liveblocks.identifyUser` / `prepareSession` from `@liveblocks/node` and returns the issued token JSON.

## API routes

All routes live on the **api service** (NestJS, base URL `EDUCATIO_API_URL`). Auth: bearer JWT in `Authorization: Bearer <jwt>` verified by `JwtAuthGuard` — either tutor session or student session, indicated by the `kind` claim. Request/response shapes have matching Zod schemas in `@educatio/shared/api/*`.

**A row you don't own answers exactly like a row that doesn't exist** — `404 not_found`, never `403 forbidden`, for a lesson and everything addressed through it (snapshot, summary, Liveblocks room). Otherwise the difference between the two answers tells a caller which ids are real, and `apps/web` collapsing them at the page would only hide that from its own users, not from anyone calling api directly.

| Route                   | Method | Auth                                             | Notes                                                                                          |
| ----------------------- | ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `/auth/signup`          | POST   | none                                             | body `{ name, email, teaches? }` → `{ sent: true }`                                            |
| `/auth/signin`          | POST   | none                                             | body `{ email }` → `{ sent: true }` (no enumeration)                                           |
| `/auth/callback`        | POST   | none                                             | body `{ token }` → `{ sessionJwt }`                                                            |
| `/auth/signout`         | POST   | tutor                                            | → `{ ok: true }`                                                                               |
| `/auth/me`              | GET    | tutor                                            | → `{ user }`                                                                                   |
| `/auth/demo`            | POST   | none                                             | gated by `ENABLE_DEMO_LOGIN` (403 when off) → `{ sessionJwt }` (shared demo tutor, exp +1d)    |
| `/sessions/student`     | POST   | none                                             | body `{ inviteCode, name }` → `{ sessionJwt }` (kind=student, exp +7d)                         |
| `/lessons`              | POST   | tutor                                            | body `{ title, studentName?, videoCallUrl? }` → `{ id, inviteCode, liveblocksRoomId }`         |
| `/lessons`              | GET    | tutor                                            | query `?page=1&limit=20&status=all\|active\|ended` → `{ lessons, total, page, totalPages }`    |
| `/lessons/:id`          | GET    | tutor (owner) OR student session for this lesson | returns full `Lesson`                                                                          |
| `/lessons/:id`          | PATCH  | tutor                                            | body `{ status?, studentName?, videoCallUrl?, title? }` → updated lesson                       |
| `/lessons/:id/summary`  | POST   | tutor                                            | generates + saves AI summary. Idempotent (re-run overwrites)                                   |
| `/lessons/:id/snapshot` | POST   | tutor OR student session                         | body `{ canvasState }` → `{ ok: true }`                                                        |
| `/lessons/:id/snapshot` | GET    | tutor (owner) OR student session for this lesson | → `{ snapshot: { canvasState, snapshotAt } \| null }` — latest only; canvas cold-load + replay |
| `/liveblocks/auth`      | POST   | tutor OR student session                         | body `{ room }` → Liveblocks token                                                             |
| `/upload`               | POST   | tutor OR student session                         | `multipart/form-data` `file` → `{ url }`                                                       |

No `/api/*` surface exists on the web host. The only server-side web routes are page handlers and the thin proxies that exist because the session cookie is `httpOnly` and the browser cannot read it: the magic-link landing (`apps/web/src/app/auth/callback/route.ts`), which proxies to `/auth/callback` and sets the cookie, and `apps/web/src/app/liveblocks-auth/route.ts`, which the canvas client uses as its Liveblocks `authEndpoint` — it forwards `{ room }` to `POST /liveblocks/auth` and relays the token. Neither decides anything; authorization stays in api.

## Performance targets

- Lighthouse >90 on landing and dashboard
- First Contentful Paint <1.5s on landing
- Canvas smooth with 100+ elements
- Real-time sync latency <100ms (depends on Liveblocks region)
- Image uploads <3s for files up to 5MB

## Testing (when added)

- **Unit (Vitest):** utility functions, data transformations, canvas element factories
- **Component (Vitest + RTL):** forms, toolbar, modals, summary viewer
- **E2E (Playwright):** tutor creates lesson → joins → ends → sees summary; student joins via invite → contributes; summary export downloads PDF
- Target: 70% coverage on `lib/`, smoke E2E on critical paths

## Implementation conventions (binding)

- **Boundary discipline.** `apps/web` is UI; `apps/api` owns data, auth, AI, Liveblocks server SDK, blob, and email. Web never imports `mongoose`, `@liveblocks/node`, `@ai-sdk/google`, `@vercel/blob`, or `resend`. If you need one of those, add the endpoint to api.
- **Server components by default** in `apps/web`. Client only where interactive (canvas, toolbar, forms, motion wrappers, accordion).
- **Component style.** Prefer initializing React components as an arrow function assigned to a `const` and exporting them as the file's `export default` at the bottom — `const Section = ({ ... }: Props) => { ... }; export default Section;`. For component props, **start with an `interface`** (`interface Props { ... }`) — it signals an object shape and is open to extension. Reach for a **`type`** only when the shape needs intricate type manipulation — unions, intersections, mapped/conditional types (e.g. `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`). Non-components keep **named** exports — hooks (`usePrefersReducedMotion`), `cva` variant helpers (`buttonVariants`), types, and constants. **Prefer arrow-function expressions for every function, not just components** — module utilities and lib helpers too (`export const safeInternalPath = (…) => { … }`). Reach for a `function` declaration only where the language requires it: call-before-definition hoisting, TypeScript overload signatures, or generators (`function*`) — plus one convention exception: the HTTP method exports in a `route.ts` (`export async function POST(req: NextRequest)`) keep Next's documented form. Nothing in our code calls them; the framework does, by name, and route files are what we paste from Next's docs and upgrade guides. Next itself is indifferent — its generated validator only checks `typeof import(...)`, which is identical either way — so this is about matching the idiom, not correctness. A page's `export default` is _not_ an exception: the component rule above governs it.
- **Component structure is folder-per-component.** Each feature component lives in its own kebab-case **folder** with an `index.tsx` holding the component. Co-located non-component code goes in a `helpers/` subfolder — `types.ts`, `constants.ts`, `enums.ts`, `helpers.ts` (only the files that are needed); child components go in a nested `components/` folder (each its own folder, recursively); tests go in `__tests__/`. Example: `components/auth/sign-up-form/{index.tsx, helpers/{types,constants,helpers}.ts}`. The shadcn `base-nova` primitives under `components/ui/` are the exception — they keep their **flat** single-file style (`button.tsx`, `input.tsx`). Existing flat feature components predate this convention and migrate to the folder shape over time.
- **File and folder naming is kebab-case** across both apps (`sign-up-form/index.tsx`, `faq-section.tsx`, `jwt-auth.guard.ts`), while the exported component identifier stays PascalCase (`sign-up-form/index.tsx` → `SignUpForm`). Matches shadcn, the Next route files, and NestJS so the whole monorepo has one rule.
- **Styling uses design tokens, applied via Tailwind utilities first.** Prefer the token-mapped utility class (`text-accent-brand`, `bg-surface`) over inline `style={{ color: "var(--accent-brand)" }}`. Inline `var()` (or an arbitrary class like `shadow-[var(--shadow-medium)]`) is the escape hatch — use it only for tokens with no mapped utility (e.g. shadows) or dynamic/computed values (a prop-driven `fontSize`). Never hard-code hex.
- **Icons come from `lucide-react`** (the `*Icon` named exports — `UsersIcon`, `ArrowRightIcon`, `ChevronDownIcon`). Size with a `size-*` utility and pass `strokeWidth`/`aria-hidden` as props; they inherit `currentColor`. Reserve inline `<svg>` for the brand mark (`EducatioMark`) and bespoke illustrations (the product-preview mock, the how-it-works step illos) — don't hand-author glyphs lucide already ships.
- **All web→api calls** go through `apps/web/src/lib/api-client.ts` (typed fetch over `EDUCATIO_API_URL` that forwards the `educatio_session` cookie as a bearer token).
- **All api request/response validation** via Zod schemas in `@educatio/shared/api/*` + Nest's `ZodValidationPipe`. No hand-rolled DTO classes.
- **`@educatio/shared` holds contract types only** — domain entities, API DTOs (Zod), JWT claim shapes, `ApiError`. Not a junk drawer: utilities, UI helpers, AI prompts, Mongoose schemas, and hooks live in the app that owns them, duplicated rather than shared if a second app needs something similar. The test: _does it define the web↔api contract?_ If not, it doesn't go in shared. (Rationale in `docs/ARCHITECTURE.md` §Scope discipline.)
- **All DB access in api** through Mongoose models in `apps/api/src/schemas/` — no raw queries.
- **All AI calls** through `apps/api/src/summary/summary.service.ts` (dynamic-imports the ESM-only `ai`/`@ai-sdk/google`) — single point of configuration.
- **Liveblocks split:** server SDK (`@liveblocks/node`) lives only in `apps/api/src/liveblocks/`; client SDKs (`@liveblocks/react`, `@liveblocks/client`) live only in `apps/web/src/components/canvas/`.
- **No `any`** in committed code (strict TypeScript on both apps and the shared package) without an inline justification comment.
- **Secrets & input safety.** Secrets live only in `apps/api` env (validated in `config/env.schema.ts`), never in the web bundle beyond `NEXT_PUBLIC_*`, and are never committed (`.env*` gitignored). Validate input with Zod at the api boundary **and** sanitize user/AI-generated output: render summary markdown without raw HTML (no `rehype-raw`), never pass untrusted strings to `dangerouslySetInnerHTML`, treat canvas content as untrusted.
- **Dependencies.** Prefer existing shadcn (`base-nova`) components over a new UI library; minimize external deps (especially for the MVP); each dependency belongs to exactly one workspace (respect the boundary).
- **Run `npm run lint` and `npm run typecheck`** before committing.
- **Conventional commits** with app scope where useful (`feat(api): …`, `feat(web): …`, `feat(shared): …`, `chore: …`).
- When a technical decision is ambiguous, prefer the simpler option and document the choice in a code comment.

(Security, code-quality, and dependency policies are also summarized in `CLAUDE.md` §Constraints & policies for at-a-glance reference.)
