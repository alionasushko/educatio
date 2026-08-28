---
description: Plan a large, multi-stream feature contract-first — before any code
argument-hint: "<feature, e.g. the lesson canvas>"
---

Plan the feature **$ARGUMENTS** as parallel streams that agree on a contract before anyone builds. Produce a **plan, not code** — present it and stop for approval. The goal is to fix the seams between the parts up front so the halves don't integrate wrong.

If `$ARGUMENTS` is empty, ask which feature to orchestrate and stop. If the feature is small enough to be a single stream against an already-built endpoint, say so and recommend skipping this — orchestration is for genuinely multi-stream work, not one screen or a refactor.

## 1. Pin the contract (always first)

State the exact interface the streams will share. Two cases:

- **Contract already exists** (the common case — the api is built and `docs/SPEC.md` documents every route): quote the relevant Zod schema(s) from `@educatio/shared/api/*` and the domain types from `packages/shared`, and treat them as frozen.
- **New full-stack feature** (no endpoint yet): the FIRST stream is to define the contract in `packages/shared` — the Zod schema + types — and get it approved before either side builds against it. This is the boundary rule expressed as a build order.

Write it as a block:

```
CONTRACT
  Route:     <METHOD> <path>          (or "existing — docs/SPEC.md §API routes")
  Request:   <@educatio/shared/api/… schema>
  Response:  <shape / shared type>
  Auth:      tutor | student | none
  Errors:    <ApiError codes>
  Realtime:  <Liveblocks Storage + Presence shape, if any — docs/SPEC.md §Liveblocks room state>
```

## 2. Decompose into streams

List the independent units that can run in parallel once the contract is frozen. Typical streams: **shared** (the contract, only if new) · **api** (controller + service + Mongoose schema) · **web** (screen/components, consuming the api via `api-client`) · **realtime** (Liveblocks room/presence — canvas only). For each, give: deliverable · files it touches · which contract surface it depends on.

## 3. Sequencing

Mark what's parallel vs blocked:

```
PHASE 1 (contract)    shared/…              — must land first (skip if contract exists)
PHASE 2 (parallel)    api/…   |   web/…     — both build against the frozen contract
PHASE 3 (integrate)   realtime + wire-up    — depends on api + web
```

## 4. Integration checkpoint

The concrete end-to-end check that proves the streams fit together, run before "done":

- **Canvas:** two browser sessions in one room — cursors render, an element created by one appears for the other, the 30s snapshot persists and reloads.
- **Auth:** sign-in → magic-link callback sets the cookie → `proxy.ts` admits `/dashboard` → an `api-client` call to `/auth/me` succeeds.

## 5. Forbidden patterns

- Never start integration before the contract in §1 is frozen.
- Never cross the web↔api boundary: no `mongoose`/`mongodb`, `@liveblocks/node`, `@ai-sdk/google`, `ai`, `@vercel/blob`, or `resend` in `apps/web`. Need data on the web? It's an api endpoint.
- Web → api only through `apps/web/src/lib/api-client.ts`; api validates only through `@educatio/shared/api/*` Zod schemas.
- Design tokens, not hard-coded hex (`docs/DESIGN.md`).

## 6. Output

Present, in order: the CONTRACT block · the stream list · the sequencing · the integration checkpoint · the forbidden-patterns reminder. Then **stop and wait for approval** before writing any code. Don't commit anything unless explicitly asked.
