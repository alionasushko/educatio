---
name: nextjs-16
description: Use when writing or editing anything in apps/web — pages, layouts, route handlers, proxy.ts, server/client components, data fetching, caching. Next 16 diverges sharply from older Next in training data (Middleware renamed to Proxy, async cookies/params, fetch uncached by default, Cache Components). Encodes the version-accurate conventions for this repo.
---

# Next.js 16 conventions (this repo)

Your training data is stale on Next 16. **Before writing non-trivial Next code, read the version-accurate docs in `node_modules/next/dist/docs/01-app/`** (per AGENTS.md) — especially `01-getting-started/{05-server-and-client-components,06-fetching-data,08-caching,16-proxy}.md`.

## The deltas that bite

- **Middleware is now `proxy.ts`** (root or `src/`, one per project). Export a `proxy` function + `config.matcher`. Proxy is for _optimistic_ checks only — **not** session management, **not** authorization, **not** slow data fetching. `fetch` cache options have no effect inside it. In this repo `proxy.ts` does only the JWT _signature_ gate; real authz is the api's `JwtAuthGuard`.
- **Runtime APIs are async** — `await cookies()`, `await headers()`; `params` and `searchParams` are Promises: `const { id } = await params`. Forgetting the `await` is the #1 Next 16 bug.
- **`fetch` is NOT cached by default** and blocks rendering until it resolves. (The old "fetch = static by default" mental model is wrong.) To cache, use the `use cache` directive; to keep fresh without blocking the page, wrap the fetching component in `<Suspense>` and stream. Identical fetches in one render tree are memoized.
- **Server Components by default** (repo rule). Add `"use client"` only for genuine interactivity (canvas, toolbar, forms, motion). Fetch data server-side; the browser never calls the api cross-origin — web→api goes through `apps/web/src/lib/api-client.ts`.

## Caching depends on config — check first

Read `next.config.ts` for `cacheComponents`:

- **`cacheComponents: true`** → the new model: `use cache` + `cacheLife`/`cacheTag`/`updateTag`, PPR is the default. Any uncached async data, runtime API, or non-deterministic op **must** be under `<Suspense>` or marked `use cache`, or you get the `Uncached data was accessed outside of <Suspense>` build error. Non-deterministic ops (`Date.now()`, `Math.random()`, `crypto.randomUUID()`) need `await connection()` first (or be cached).
- **off** → the previous caching/revalidating model (`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`).

## Don't

- Don't trust a Next pattern from memory without checking it against the installed version's docs.
- Don't put auth/data logic in `proxy.ts` beyond the optimistic JWT check.
- Don't hard-code design values — tokens per `docs/DESIGN.md`.
