---
name: nestjs-api
description: Use when writing or editing anything in apps/api — controllers, services, Mongoose schemas, guards, pipes, the exception filter, env config, or the contract test. Encodes this repo's api conventions and the traps that fail silently rather than loudly.
---

# NestJS api conventions (this repo)

Fastify adapter, Mongoose, Zod at the boundary. `apps/api` owns data, auth, AI, Liveblocks tokens, blob and email — `apps/web` owns none of it.

## The traps that bite

- **`SchemaTypes.ObjectId`, never `Types.ObjectId`, in `@Prop`.** `mongoose.Types.ObjectId` is the value constructor, not a schema type; `@nestjs/mongoose` does not recognise it and the path silently becomes **Mixed**. A Mixed path does no casting, so `findOne({ lessonId })` with a hex string matches nothing — no error, no warning, an empty result. This shipped once and made the AI summary read an empty canvas for weeks. Keep the TS annotation as `Types.ObjectId`; only the `type:` option changes.
- **Nest answers POST with 201.** Where the contract in `docs/SPEC.md` says 200, add `@HttpCode(200)` — the contract test asserts status, so a mismatch fails there rather than in review.
- **Mongoose builds indexes on connect**, so connecting is already a write. Never point a test at a real database; go through `test/harness.ts`, which verifies the resolved `MONGODB_URI` _before_ anything connects.
- **`ai` / `@ai-sdk/google` are ESM-only** and must stay dynamically imported inside `summary.service.ts`. A top-level import breaks the CommonJS build.

## Contracts, not DTOs

Request _and_ response shapes live in `@educatio/shared/api/*` as Zod schemas. Validate requests with `ZodValidationPipe`; never hand-roll a DTO class. Paths come from the shared constants (`LESSONS_PATH`, `lessonSnapshotPath`) so a typo is a compile error, not a 404.

**Changing a response shape is a three-file change:** the service, the shared schema, and `test/api-contract.spec.ts`. Skip the schema and web parses against a stale contract at runtime; skip the test and nothing notices.

## Auth and access

- `JwtAuthGuard` accepts **either** kind. `@CurrentTutor()` narrows to a tutor and rejects a student; `@Session()` takes either — then scope it yourself with `lessonsService.assertCanRead(lesson, session)`.
- **Someone else's row answers exactly like a missing one.** Ownership failures on a lesson (and its snapshot, summary and room) throw `not_found`, never `forbidden` — an id that exists for another tutor and an id that exists for nobody are indistinguishable, so the api cannot be used to enumerate real ids. Auth endpoints follow the same rule with one generic `invalid_credentials`. If you add an endpoint addressed by an id someone might not own, reject it the same way; `forbidden` is for a caller who may know the row exists.
- Errors carry a **code from the closed enum** in `@educatio/shared/api/errors`. Throw with `{ code, message }`; `AllExceptionsFilter` shapes the envelope. A new code means editing the enum in shared first — web keys its user-facing copy off it.

## Config

Env is validated at boot in `config/env.schema.ts`. Feature secrets (`LIVEBLOCKS_SECRET_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`) are **optional**, and their services answer `503 service_unavailable` when unset — the app boots and everything unrelated keeps working. Keep that shape when adding a service: fail at the request, not at startup.

## Don't

- Don't import an api-only package into `apps/web` to avoid writing an endpoint.
- Don't add a raw driver query — all DB access goes through the Mongoose models in `src/schemas/`.
- Don't return a Mongoose document from a controller; map to the DTO the shared schema describes (`toDTO`).
- Don't log secrets, tokens, or magic-link values.
