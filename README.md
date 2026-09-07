# Educatio

A collaborative whiteboard for one-on-one online tutoring. A tutor creates a lesson, shares an invite link, works with a student on a real-time canvas alongside their own video call, and ends the lesson with an AI-written summary they can export as PDF or text.

**[▶ Try the live demo](https://educatio-web.vercel.app)** — one click, no sign-up, no email needed.

## Quick preview

https://github.com/user-attachments/assets/9b87395f-5baf-4c97-8a49-18177901fa47

A quick 24-second pass over the tutor's side of a lesson — dashboard through to the AI summary.

## What it does

- **Real-time canvas** — pen, text, sticky notes, shapes, images, with live cursors, presence and peer selection. Pan/zoom by wheel, a fixed zoom ladder, pinch and two-finger pan on touch. Undo/redo, selection, transform and rotate.
- **Student join without an account** — the student opens the invite link, adds a name and email, and is in. No password, no signup.
- **AI lesson summary** — on ending a lesson, Google Gemini reads whatever was left on the canvas and writes it up. Exportable as PDF or plain text, or handed to the student by email.
- **Tutor dashboard** — lesson list with search, status filters and pagination; create, share and delete.
- **Two ways in for tutors** — email + password, or a magic link. A password can only be set after the email is verified, so it can never be planted on an account the caller doesn't control.
- **Read-only on phones** — below 768px the canvas genuinely stops accepting edits rather than just saying so.

## Stack

|          |                                                                            |
| -------- | -------------------------------------------------------------------------- |
| Web      | Next 16 (App Router) · React 19 · Tailwind v4 · shadcn `base-nova` · Konva |
| Api      | NestJS · Fastify · Mongoose · Zod                                          |
| Realtime | Liveblocks (`LiveMap` storage + presence)                                  |
| AI       | Google Gemini via the Vercel AI SDK                                        |
| Data     | MongoDB Atlas · Vercel Blob for images                                     |
| Hosting  | Vercel (web) · Google Cloud Run, scale-to-zero (api)                       |

## Tests

```bash
npm run check      # format + lint + typecheck + unit/integration, one shot
npm run test:e2e   # Playwright (needs live Liveblocks + Blob and a local Mongo)
```

| Suite            | Count             | Notes                                                                          |
| ---------------- | ----------------- | ------------------------------------------------------------------------------ |
| api (Vitest)     | 84                | includes a contract test booting the real Nest app against an ephemeral mongod |
| web (Vitest)     | 143               | request layer, the `proxy.ts` session gate, copy and form behaviour            |
| e2e (Playwright) | 57 across 7 specs | chromium + webkit, against **live** Liveblocks and Vercel Blob                 |

CI runs `npm run check` plus a production build of all three workspaces.

## Running locally

Node **22.22.2** is pinned in `.nvmrc`; Next 16 refuses to start below 20.9.

```bash
nvm use
npm install                              # all workspaces

cp apps/api/.env.example apps/api/.env   # fill in
cp apps/web/.env.example apps/web/.env.local
```

`AUTH_JWT_SECRET` must be **identical** in both files — web verifies the JWT the api signs, so a mismatch sends every authenticated request back to sign-in. The api boots with only `MONGODB_URI`, `AUTH_JWT_SECRET`, `WEB_ORIGIN` and `NODE_ENV`; without a Liveblocks, Gemini or Blob key the matching feature answers `503` and everything else still works.

```bash
npm run dev        # web on :3000
npm run dev:api    # api on :3001
```

After editing `packages/shared`, run `npm run build -w @educatio/shared` — its exports map points at `dist`, so a new export otherwise arrives as `undefined` at runtime while typecheck still passes.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — repo shape, the web↔api boundary, auth flow and deployment.
- [docs/SPEC.md](docs/SPEC.md) — feature contracts, API routes, data shapes, the summary prompt.
- [docs/DESIGN.md](docs/DESIGN.md) — per-screen visual specs, design tokens, motion, UX conventions.
- [docs/implementation-plan.md](docs/implementation-plan.md) — tech stack, env vars, project tree, build status and the deploy runbook.
- [docs/SECURITY.md](docs/SECURITY.md) — what the pre-deploy security review fixed, what it deliberately left for later, and the condition that reopens each.
- [CLAUDE.md](CLAUDE.md) — orientation and the conventions this repo actually holds to.
