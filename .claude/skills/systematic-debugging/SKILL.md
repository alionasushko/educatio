---
name: systematic-debugging
description: Use when diagnosing a bug, a failing test, unexpected runtime behavior, or a stack trace — a falsifiable OBSERVE→HYPOTHESIZE→PREDICT→TEST→CONCLUDE loop, plus the bug archetypes most common in this Next/React + Nest/Mongoose + Zod stack. Not for building new features or routine edits.
---

# Systematic debugging

Don't guess-and-patch. Run a falsifiable loop and stop the moment a test contradicts the hypothesis.

1. **OBSERVE** — reproduce reliably; write down the exact inputs, environment, and observed vs expected behavior.
2. **HYPOTHESIZE** — form the _simplest_ explanation consistent with the symptom.
3. **PREDICT** — state something that must be true if the hypothesis holds.
4. **TEST** — run the smallest experiment designed to _falsify_ it (a log, a breakpoint, a unit test), not to confirm it.
5. **CONCLUDE** — if falsified, refine and repeat; if confirmed, fix the root cause (not the symptom) and add a regression test.

## Bug archetypes (check these first)

| Symptom                                             | Likely root cause                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Function returns a `Promise` instead of a value     | Missing `await` on an async call                                                                                                     |
| Async work in `.forEach` runs fire-and-forget       | `forEach` ignores returned promises — use `for...of` or `Promise.all`                                                                |
| A value is stale inside a closure, timer, or effect | Closure captured an old value; missing/empty React dep array — use the updater form `setX(prev => …)`                                |
| Concurrent requests corrupt a shared document       | Read-modify-write without atomicity — in Mongoose use atomic operators (`$inc`, `$set`, `findOneAndUpdate`), not read-then-`.save()` |
| Runtime crash despite "valid" TypeScript            | An `as` assertion hid a `null`/`undefined` — validate at the boundary with the `@educatio/shared/api/*` Zod schema                   |
| `null` vs `undefined` mismatch across web↔api       | Declared `null` but got `undefined` (or vice versa) — align the shared type / Zod schema, don't paper over with `?.`                 |

When the bug is at a system boundary (web↔api, api↔Mongo/Liveblocks/Gemini, browser↔Edge `proxy.ts`), check the contract on _both_ sides before blaming either.
