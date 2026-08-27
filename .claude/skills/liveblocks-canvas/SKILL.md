---
name: liveblocks-canvas
description: Use when building or editing the realtime collaborative canvas — anything under apps/web/src/components/canvas/, Liveblocks rooms/storage/presence, live cursors, or the canvas snapshot loop. Encodes this repo's room shape, token flow, and the realtime pitfalls the model gets wrong by default.
---

# Liveblocks realtime canvas (this repo)

The canvas is the riskiest surface in the app. Get the contract and the token flow right first; the rest is rendering.

**Verify hook APIs against the installed `@liveblocks/react` version's docs** before relying on signatures — this skill is the architecture, not an API reference.

## Boundary (hard)

- **Client SDKs only in web:** `@liveblocks/react`, `@liveblocks/client`, under `apps/web/src/components/canvas/`.
- **Server SDK (`@liveblocks/node`) is api-only** — never imported in web. Tokens come from the api.

## Token flow

The client never holds the Liveblocks secret. Point the room's `authEndpoint` at your api's `POST /liveblocks/auth` (through `api-client`, forwarding the session cookie). The api mints the room token from the JWT: a **tutor** gets read+write on any room they own; a **student** gets read+write on **only** the `lessonId` baked into their token. One room per `lesson.liveblocksRoomId`.

## Room shape (the contract — `docs/SPEC.md` §Liveblocks room state)

- **Storage:** `elements: LiveMap<elementId, CanvasElement>` (keyed by `element.id`) + `metadata: LiveObject<{ lastEditedAt, elementCount }>`.
- **Presence:** `{ cursor, name, role, color, selection, tool, draft }`. `draft` is the stroke in progress — live drawing goes through presence, never through storage, so it creates no ops, no undo steps, and clears itself if the drawer disconnects.
- `CanvasElement` (+ variants) is defined in `@educatio/shared` (`canvas.ts`) — that's the source of truth; don't redefine it in web.

## Patterns

- Read storage with `useStorage` + narrow selectors; **write with `useMutation`** that mutates the `LiveMap` (`.set(id, el)` / `.delete(id)`) — never replace the whole map (that clobbers concurrent peer edits and breaks conflict resolution).
- Presence via `useMyPresence` / `useOthers`. **Throttle cursor updates** — raw mousemove floods the room.
- Edits are optimistic; Liveblocks resolves concurrent map ops. Keep each edit a discrete element set/delete.
- **Snapshot loop:** every ~30s while the lesson is active, serialize storage and `POST /lessons/:id/snapshot { canvasState }`. Liveblocks holds live state; the snapshot is the persistent backup for replay/history.

## Pitfalls (cross-check the `systematic-debugging` skill)

- Stale closures inside `useMutation`/effects capturing old state.
- Whole-map writes overwriting peers' concurrent changes.
- Un-throttled cursor/selection presence updates.
- Treat all canvas content as **untrusted** on render (no raw HTML).
- Perf targets (`docs/SPEC.md` §Performance): smooth at 100+ elements, <100ms sync — memoize per-element renderers; don't re-render every element when one changes.
