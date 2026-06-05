# Educatio

A collaborative whiteboard for one-on-one online tutoring. Tutors create a lesson, share an invite link, work with a student on a real-time canvas alongside their own video call, and end the lesson with an AI-generated summary they can export.

## Repo layout

`npm` workspaces monorepo:

| Path              | What                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| `apps/web`        | Next 16 / React 19 / Tailwind v4 frontend (shadcn `base-nova`).                    |
| `apps/api`        | NestJS + Fastify backend — owns data, auth, AI, Liveblocks tokens, uploads, email. |
| `packages/shared` | `@educatio/shared` — domain types + Zod schemas shared by both apps.               |
| `docs/`           | Architecture, spec, design, and implementation plan.                               |

> **Status:** the api owns every endpoint (auth, lessons, sessions, snapshot, summary, liveblocks, upload); web is UI-only and authenticates via a JWT cookie. The marketing landing page is built; the auth/dashboard/lesson/summary **screens are the remaining work** (see [docs/SPEC.md](docs/SPEC.md) §Features for behavior, [docs/implementation-plan.md](docs/implementation-plan.md) §7 for status). Everything compiles and builds, but hasn't been run against live Mongo/Resend/Liveblocks/Anthropic.

## Prerequisites

- Node **22.22.2** (pinned in `.nvmrc`). Run `nvm use` before anything — Next 16 refuses to start on <20.9.
- A MongoDB connection string, plus keys for Resend, Liveblocks, Anthropic, and Vercel Blob (see the `.env` examples below).

## Setup

```bash
nvm use
npm install                  # installs all workspaces

# env files (copy and fill in):
cp apps/api/.env.example apps/api/.env
# apps/web uses apps/web/.env.local — see docs/implementation-plan.md §Environment Variables
```

## Commands

Run from the repo root:

```bash
npm run dev            # web dev server on :3000
npm run dev:api        # api dev server on :3001 (nest --watch)
npm run build          # build all workspaces
npm run lint           # lint all workspaces
npm run typecheck      # tsc --noEmit across all workspaces
npm run format         # prettier --write across the repo
npm run check          # one-shot gate: format:check + lint + typecheck (run before committing)
```

Scope to one workspace with `-w`, e.g. `npm run dev -w @educatio/web`.

## Documentation

Start with [CLAUDE.md](CLAUDE.md) (orientation + conventions), then:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — repo shape, web↔api boundary, auth flow, deployment.
- [docs/SPEC.md](docs/SPEC.md) — feature task list, API contracts, data shapes, the summary prompt.
- [docs/DESIGN.md](docs/DESIGN.md) — per-screen visual specs, design tokens, motion, UX conventions.
- [docs/implementation-plan.md](docs/implementation-plan.md) — tech stack, env vars, project tree, build status.
