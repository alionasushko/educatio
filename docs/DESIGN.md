# Educatio — Design Reference

Derived from `files/Studio-v1-Design-Brief.md`. Tokens and motion are already wired in `src/app/globals.css` + `src/components/motion/`. This file is the **intent and the screen specs** — read it when implementing any screen.

## Mission

Build the first online tutoring whiteboard that _feels designed_, not engineered. The category is dominated by utilitarian, dated tools (BitPaper, Ziteboard, Liveboard). Educatio's design should make a tutor's first reaction "oh, finally" — like Linear or Notion or Figma did for their categories.

## Principles

1. **Calm, not playful.** Tutoring is focused work. Avoid kid-coded design (rounded everything, bright primary colors, cartoon mascots). Audience is adult professionals — treat them like adults.
2. **Whitespace as a feature.** Generous spacing throughout. The UI recedes so the lesson takes center stage.
3. **Single accent color, used sparingly.** One brand color signals action and presence. Most of the interface is neutral grayscale.
4. **Soft motion.** Subtle, purposeful animation. No bouncy, attention-grabbing motion.
5. **Mobile is view-only.** Don't over-design small screens for v1.

**Mood keywords:** focused, modern, warm, calm, considered, design-led, professional but not corporate.

**Reference tone:** Linear (clarity, calm density), Notion (warm professionalism), Figma (canvas-first), Arc (subtle personality), Vercel (clean type-led marketing).

**Avoid:** chalkboards/apples/pencils/classroom imagery, bright primary colors (especially red and electric blue), cartoon illustrations, stock photos of students, glowing AI gradients/particles.

## Visual system (already in `globals.css`)

|                                         | Token / value                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background (warm off-white)             | `--bg` `#FAFAF9`                                                                                                                                   |
| Surface (white)                         | `--surface` `#FFFFFF`                                                                                                                              |
| Borders                                 | `--border-subtle` `#E7E5E4`, `--border-medium` `#D6D3D1`                                                                                           |
| Text                                    | `--text-primary` `#1C1917`, `--text-secondary` `#57534E`, `--text-tertiary` `#A8A29E`                                                              |
| **Accent (Indigo)**                     | `--accent-brand` `#4338CA` + `--accent-soft`, `--accent-soft-border`, `--accent-tint`                                                              |
| Sticky-note palette (muted/pastel only) | `--sticky-yellow/pink/blue/green/purple`                                                                                                           |
| Functional                              | `--success` `#16A34A`, `--warning` `#D97706`, `--destructive` `#DC2626`                                                                            |
| Radii                                   | sm 8px, md 12px, lg 16px, pill full                                                                                                                |
| Shadows                                 | `--shadow-subtle`, `--shadow-medium`, `--shadow-large` (soft, layered, no harsh drop)                                                              |
| Fonts                                   | Inter (UI), JetBrains Mono (code), Caveat (handwriting), Fraunces (display alt) — exposed as `font-sans`, `font-mono`, `font-hand`, `font-display` |

Spacing: 8px base scale (4, 8, 12, 16, 24, 32, 48, 64, 96). Type hierarchy: Display 56–72 / H1 40 / H2 28 / H3 20 / Body-lg 18 / Body 16 / Small 14 / Caption 12. Weights: 400 body, 500 emphasis/buttons, 600 headings, 700 sparingly.

## The 9 screens

### 1. Marketing landing (`/`) — **DONE**

Nav (logo + Sign in + Get started) · Hero (headline "_The whiteboard your **students** deserve._" + subhead + Get started free CTA + sample lesson link + microcopy + tilted product preview) · Features (3 cards: real-time collab, AI summaries, video-tool friendly) · How it works (3 steps: create / share / teach) · FAQ accordion (5–6 questions) · Footer.

### 2. Sign-in (`/sign-in`)

Single centered card. Logo. Heading "Sign in to Educatio". Subtext: "Welcome back — sign in with your password." Email + password inputs, "Sign in" button. Below it, a subtle text button "Forgot your password? Email me a magic link" — the passwordless fallback, which doubles as the password-recovery path.

### 2b. Tutor sign-up (`/sign-up`)

Layout follows the shared `AuthShell`: wordmark top-left, single centered card (width 400), footer link below. Mount-time `CascadeUp` (delay 60, y 18).

**Card** (`Card padding={32}`, accent-tint not used inside the card):

- Eyebrow (accent color): **"For tutors"**
- Heading (24/600, letter-spacing −0.02em): **"Create your tutor account"**
- Subhead (14, text-secondary, line-height 1.5): _"Free for solo tutors — unlimited lessons, no card needed. Setup takes 30 seconds."_
- Three stacked inputs (gap 14, margin-bottom 18):
  1. **Your name** — placeholder `Sara Martínez`, `autoFocus`
  2. **Email** (type=email) — placeholder `you@school.com`, helper _"We'll send a link to confirm it's you."_
  3. **What do you teach?** — placeholder `Spanish, GCSE Maths, piano…`, helper _"Optional. Helps us tailor your lesson templates."_

(No password field — sign-up is passwordless; a password is set after verification on `/set-password`.)

- Primary button, full-width, size `lg`: **"Create account"**
- Fine print (12, text-tertiary, centered, margin-top 16): "By creating an account you agree to our [Terms] and [Privacy Policy]."

**Reassurance callout** (sits _outside_ the card, margin-top 18, padding `14px 16px`, `--accent-tint` background, `--accent-soft-border`, radius 10, flex row gap 12):

- 32px circular indigo badge (`--accent` fill, white check icon).
- Text (13, text-secondary, line-height 1.5): **"Are you a student?"** (text-primary, weight 500) _"You don't need an account — just open the lesson link your tutor sent."_

**Footer link** (AuthShell footer, replacing the default Privacy · Terms): _"Already have an account?"_ + indigo **Sign in** link → `/sign-in`.

The sibling `/sign-in` screen's footer reciprocates with "New to Educatio? Create a tutor account" → `/sign-up`.

### 3. Verify-email (`/verify`)

Single centered card. "Check your email" heading. Subtext: "We sent a magic link to {email}. Click it to sign in." A "Resend" link. Since sign-in never reveals whether an email is registered, the card handles a mistyped or unregistered address in-place — nudging the user to re-check the spelling, then offering a "Create a tutor account" → `/sign-up` link.

### 4. Dashboard (`/dashboard`)

Collapsible sidebar (logo top, "Lessons" + "Settings" nav items, avatar + sign-out at bottom). Main: page header with "Lessons" title + "Start new lesson" primary CTA. Lesson list — table-like rows: title · student name · date · duration · status badge (Active/Ended). Each row clickable. Empty state: centered illustration + "Create your first lesson" CTA. Pagination if >20.

### 5. Create new lesson (`/lesson/new`)

Modal (designer's choice — feels lighter than full page). Fields: lesson title (required) · student name (optional, helper: "Will be set when student joins if left blank") · video call link (optional, helper: "Paste a Zoom, Meet, or any video link — students can join from inside Educatio"). Actions: Cancel link · Create lesson primary.

### 6. Active lesson canvas (`/lesson/[id]`) — **the centerpiece**

Slim top bar (~56px): lesson title (editable inline) + student name secondary · presence stack (max 5 avatars) · Join video / Share / End lesson (right). Floating toolbar (bottom-center on desktop, left-side on tablet): Select / Pen / Text / Sticky / Shape / Image / Code · contextual color + stroke pickers · Undo / Redo. Active tool: accent background + white icon. Canvas: full remaining viewport, infinite, faint dot grid on hover/active. Live cursors: colored, name pill fades after 2s of no movement, cursor fades after 30s idle.

**Modals:** _Share_ (heading "Invite your student" + copyable invite link + helper) · _End lesson_ (heading "End this lesson?" + body "We'll generate a summary you can share with your student." + Cancel/End lesson actions).

### 7. Student join (`/join/[code]`)

Single centered card. Lesson title at top. "Joining {tutor name}'s lesson" subtext. Name input. "Join lesson" primary button. Helper: "By joining, you'll be able to draw, write, and collaborate on the lesson canvas." Invalid code → clean error state + "Back to home" link.

### 8. Lesson summary (`/lesson/[id]/summary`)

Centered column (max-width ~720px, comfortable reading width). Header (title · date · duration · student · status badge). Sticky action bar: Download PDF (primary) · Download as text · Copy to clipboard · Email to student (tutor only). Summary content (markdown rendered, h2 sections + bullets + prose). Collapsible "View canvas" — expanded shows final canvas state as static image with pan/zoom. Failed state: "Summary couldn't be generated" + Regenerate. Loading state: shimmer skeleton + "Generating summary…".

### 9. 404 / error pages

Calm, on-brand. Simple illustration, short message, link back to dashboard.

## Component inventory

Forms: Input · Button (primary/secondary/ghost/destructive) · Modal/Dialog · Toast · Sidebar · Top nav bar · Badge · Avatar (initials fallback) · Empty state · Loading skeleton · Floating toolbar · Tool button (active state) · Color picker · Stroke width selector · Live cursor (with name pill) · Selection box · Sticky note (5 colors) · Code block (syntax highlighted) · Hero · Feature card · FAQ accordion · Footer.

## Key interactions

- **Tool selection:** click in toolbar → accent background, white icon; canvas cursor changes (crosshair for shape, pen icon for pen, etc.).
- **Adding a sticky:** click sticky tool → click canvas → sticky appears with gentle scale-in, focused for typing; color picker nearby.
- **Live cursor presence:** other user's cursor shows with name pill; pill fades after 2s; cursor itself fades after 30s idle.
- **User joins:** toast at top "Sarah joined the lesson"; avatar slides into presence stack.
- **Ending a lesson:** End button → confirmation → loading "Generating summary…" → summary page with skeleton.
- **Drag-drop image:** drag over canvas → drop-zone overlay with "Drop to add image" → upload progress → appears at drop position.
- **Hover micro:** Wordmark's paper plane glides forward on hover (already in `Wordmark`); cards lift `translateY(-2px)` via `.edu-hover`.

## UX conventions

Cross-cutting interaction rules for the interactive screens (dashboard onward — the landing page is the only one built today, so treat these as the target). Where a per-screen spec above is more specific, it wins; otherwise default to these so new screens stay consistent.

- **Feedback & latency — match the indicator to the wait.** Under ~300ms (local state, canvas edits): apply instantly, no indicator. 300ms–1s (form submit, save): in-button spinner + disabled button, label may shift to present tense ("Creating…", "Sending…"). Over ~1s with a known layout (page/section data): skeleton shimmer (`edu-shimmer`) — never a blank screen or full-page spinner. Canvas edits are **optimistic**: render locally first, sync via Liveblocks in the background; never block the canvas on a network round-trip.
- **Loading states.** Skeletons for content with a predictable shape (dashboard rows, summary body). In-button spinners for actions. No full-screen spinners — after first paint the app never goes fully blank.
- **Skeleton vs dim — decided by whether there's anything worth keeping.** A _cold_ arrival has nothing on screen, so it gets the skeleton (`loading.tsx`, mirroring the real layout so rows don't shift). A _re-query of something already shown_ — changing a filter, searching, paging — keeps the previous results visible and de-emphasises them (`opacity-60`, `pointer-events-none`, `aria-busy`); replacing them with a skeleton would throw away results that are still meaningful along with the user's scroll position. One status slot reports it (the result count becomes "Updating…"), not a spinner per control: a spinner on a chip answers "this control is working" when the question is "do these rows match what I asked for", and it doesn't scale past a couple of filters. Reveal the indicator on a delay (~120ms, `edu-pending`) so a fast change surfaces nothing at all, and announce it politely — `role="status"` — since a dimmed list is invisible to a screen reader.
- **Empty states.** Always friendly and actionable: one short line + a primary CTA (illustration optional), never a bare empty table/list. Dashboard's "Create your first lesson" is the reference.
- **Errors — route by recoverability.** _Field/validation_ → inline, directly below the field, `--destructive` text, naming the specific fix; never a toast. _Transient action_ (network, 5xx) → toast with a Retry affordance, non-blocking, preserve the user's input. _Generation/processing failure_ (e.g. summary) → in-place message + Regenerate, as specced on screen 8. _Fatal/route_ → the calm on-brand error page (screen 9), one link back to safety. Microcopy stays plain and human: no status codes or stack traces shown to end users, and never blame the user.
- **Toasts.** Top-center, soft fade, auto-dismiss ~5s, max ~3 stacked. Reserved for presence events ("Sarah joined the lesson"), background success ("Summary emailed to Sara"), and transient errors with Retry. Not for field validation, and not for anything that needs a decision (use inline text or a dialog).
- **Confirmation.** Only for destructive or irreversible actions. Use a dialog (`edu-modal-in`) whose confirm button names the verb ("End lesson", not "OK"); Cancel is the ghost/secondary option and holds default focus. Reversible canvas actions (add/move/delete an element) are **not** confirmed — they're undoable via Cmd+Z instead.
- **Forms.** Validate on submit, plus on blur for fields already touched — not on every keystroke. On a failed submit, move focus to the first invalid field. Don't pre-emptively disable the submit button to enforce validation; let the user submit and surface inline errors. Disable submit only while the request is in flight (prevents double-submit). Autofocus the first field on single-purpose forms (sign-in / sign-up).
- **Realtime & connection.** Presence is always visible (avatar stack + named live cursors). On connection loss: an unobtrusive "Reconnecting…" indicator, keep the canvas interactive (queue local edits), reconcile on reconnect. User work is never lost to a dropped connection — the 30s MongoDB snapshot is the backstop.
- **Copy & silent-action feedback.** Copy actions (invite link, summary) confirm immediately — the button label flips to "Copied" for ~2s, or a brief toast. Any action with no other visible result must acknowledge itself.
- **Focus & keyboard.** Visible 2px accent focus ring on every interactive element (see Accessibility). Dialogs trap focus, close on Esc, and return focus to their trigger. Canvas keyboard shortcuts are listed under Accessibility.
- **Microcopy tone.** Warm, plain, professional; address the user directly ("you", "your student"). No edtech clichés, no jargon, no exclamation-heavy enthusiasm — extends the mission's voice to every string.

## Motion system (already implemented)

- `<CascadeUp delay y>` for mount-time fade-ups (above-the-fold).
- `<FadeUp delay y>` for scroll-triggered fade-ups.
- Keyframes available: `edu-float` (gentle continuous lift), `edu-pulse-soft` (status dots), `edu-pop-in` (sticky notes), `edu-modal-in` (dialogs), `edu-fade-in`, `edu-shimmer`.
- `.edu-hover` for card lift.
- `prefers-reduced-motion` is enforced globally in `globals.css`.

## Accessibility (must hit)

- WCAG 2.1 AA contrast minimums (4.5:1 body, 3:1 UI components)
- All interactive elements keyboard-focusable with visible focus ring (accent outline, 2px)
- Icon-only buttons have `aria-label` and tooltips
- Color is never the only differentiator (active tool: icon weight + color change, not just color)
- Sticky-note colors paired with subtle pattern/icon for color-blind users
- Text scales correctly with browser zoom
- Every image has descriptive `alt` text (or `alt=""` if purely decorative)
- Headings nest in order (h1 → h2 → h3); no skipped levels
- Every form input has an associated `<label>`; validation errors are linked to their input via `aria-describedby`
- Keyboard paths are complete: logical Tab order, Enter activates the focused control, Esc closes dialogs and menus
- Live-cursor presence has screen-reader announcements ("Sarah joined the lesson")
- Canvas tools have keyboard shortcuts: **P** pen, **T** text, **S** sticky, **R** shape, **I** image, **C** code, **V** select, **Cmd+Z** undo, **Cmd+Shift+Z** redo, **Esc** deselect, **Backspace** delete, **Space+drag** pan, **Cmd+scroll** zoom

## Responsive

- **Desktop ≥1024px:** full experience.
- **Tablet 768–1024px:** canvas fully functional; toolbar may move to side; top bar collapses controls into a menu.
- **Mobile <768px:** marketing/auth/dashboard/summary fully responsive (table → card list, export buttons stack). **Active lesson canvas is read-only** with friendly message: "Educatio works best on a laptop or tablet for live lessons. You can view this lesson here, but to draw and edit, switch to a larger screen."
- **Test at:** 320 · 375 · 768 · 1024 · 1280 · 1920px.
- **Common gotchas:** truncating text in a flex row needs `min-w-0` on the child; images use `object-fit: cover` in a fixed aspect-ratio wrapper; touch targets ≥ 44px; modals cap at `max-h-[90dvh]` with `overflow-y-auto`.

## PDF export

A4. Margins 40pt. Inter (or system sans fallback). Page 1 layout:

1. Top color bar (accent, ~40pt tall) with white Educatio wordmark
2. Title block: "Lesson Summary" (large heading)
3. Metadata block (subtle background tint): lesson title · student · date · duration
4. Horizontal divider
5. Summary content (markdown rendered with hierarchy)
6. Footer (every page): "Generated by Educatio · {date}" small text, accent color

Multi-page: header repeats minimally (just wordmark), footer always present.

## Scope guard for v1 (intentionally NOT designed)

Pricing page · settings page (only sign-out exists) · tutor profile · student dashboard · parent view · calendar/booking · subject-specific tools (math equation editor, code execution panel, vocab cards) · mobile editing experience for canvas.

## Notes worth holding the line on

- Don't slip into edtech clichés. The audience is adult professional tutors.
- The canvas screen is the centerpiece. Spend most craft there.
- Use real lesson content in mockups (math problems, sticky notes, code) — never Lorem Ipsum.
- Design for daily use, not screenshots. The canvas should look great in a screenshot AND feel right after 60 minutes of focused tutoring.
