---
name: testing
description: Use when writing, structuring, or running tests for this repo — unit, component, or end-to-end. Encodes the test stack, the critical flows to cover, and the project-specific hard parts (realtime two-session, async Server Components, Nest endpoints, magic-link auth). Nothing is set up yet, so first use also wires the harness.
---

# Testing (this repo)

Nothing is wired yet — no `npm test` script, no config. First real use sets up Vitest, Playwright, MSW, and a test Mongo. Target (`docs/implementation-plan.md` §12): **70% coverage on `lib/`, smoke E2E on critical paths** — not 100% everywhere.

## Stack

- **Unit / component:** Vitest + Testing Library. Mock api calls with **MSW** (web tests never import api code — that's the boundary).
- **E2E:** Playwright (the `playwright` MCP is already wired in `.mcp.json`).
- **Api:** test against the Nest/Fastify app with its real Zod validation + `JwtAuthGuard`; use a **test Mongo instance**, not mocks, where DB behavior matters.

## Critical flows to cover (`docs/SPEC.md` §Features, §Testing)

1. Tutor: sign up → create lesson → share invite → canvas → end → summary → export PDF.
2. Student: join via invite link (no account) → contribute to canvas.
3. Summary export downloads a PDF.

## Project-specific hard parts (where the real value is)

- **Realtime / two-session:** drive the canvas with **two Playwright browser contexts** in one room — assert a cursor and an element created by one appear for the other, and that the 30s snapshot persists and reloads. This is the test that catches "works solo, desyncs with two users."
- **Server Components / async:** prefer route-level or E2E tests over unit-testing async Server Components; don't mock Next internals or `await cookies()/params`.
- **Nest endpoints:** exercise both auth kinds (`tutor` and `student` JWT) and the Zod-rejected paths; verify `JwtAuthGuard` blocks unauthenticated access.
- **Magic-link auth:** token is one-time, sha256-hashed, 10-min TTL — test issue → `/auth/callback` → cookie set → `proxy.ts` admits a protected route → `/auth/me`.

## Forbidden patterns

- Don't test implementation details — assert behavior/output.
- Don't assert exact error strings from third-party libs (they change).
- Use **fake timers**, never real `setTimeout`, in tests.
- No `any` in test code either (strict TS applies).
