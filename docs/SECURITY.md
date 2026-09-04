# Security

A whole-app review ran before the first deploy — every controller, the request layer, the canvas write path, the AI pipeline, the realtime layer and the dependency tree. Confirmed findings were fixed in the commits leading up to the deploy. This file records what was **deliberately not fixed**, and the condition that makes each one required.

The deferrals are all justified by the deployment being a portfolio demo: per-visitor demo tenants that expire in 24h, no real tutor passwords, and no domain so real sign-up cannot complete. Each condition below is the point at which that justification stops holding.

## Deferred

**Atomic lockout gate on password sign-in.** `signinWithPassword` computes the lockout decision from a document read, then acts on it only after a ~250 ms `bcrypt.compare`. Every request landing inside that window sees `lockedUntil: null`, so K concurrent requests buy K guesses per lockout round instead of one. The lockout is the only per-account control that survives an attacker rotating IPs — the comment in `auth.service.ts` says exactly that. The fix is to reserve the attempt in the same write that reads it (`findOneAndUpdate` with a `lockedUntil` predicate and `$inc`), keeping the dummy compare so the constant-time property survives.

> **Required when:** a real person sets a password. Today `demoLogin` mints a session without one and `ENABLE_DEMO_LOGIN` is the entry path, so no password exists to spray. Buying a domain and enabling real sign-up is the trigger.

**Per-requester magic-link quota.** The 5-per-hour cap is charged to the recipient, not the requester, so ~6 requests an hour from a stranger silently suppress a known tutor's own sign-in links while the endpoint still answers `{ sent: true }`. The window self-resets hourly and each suppression logs a warning, so the exposure is bounded and loud. An honest fix needs a captcha or proof-of-work plus a truthful "we already sent one recently" response, and bounding _consecutive unclicked_ links rather than all sends.

> **Required when:** email sign-in is live. Dormant without `RESEND_API_KEY`.

**Sign-in timing oracle.** `signin()` does two writes and a live Resend round trip for a known address and returns immediately for an unknown one. Status and body are identical by design; latency is not, so it is a single-request "does this person have an account" oracle. It becomes nearly free to fix once the send moves off the request path — answer first, deliver on a detached task.

> **Required when:** email sign-in is live, and worth doing at the same time as the quota fix.

**Full DTO projection.** `GET /lessons/:id` now withholds `studentEmail` from student sessions, but `inviteCode`, `tutorId` and `videoCallUrl` are still broader than a student needs. There is also no way to rotate an invite code, `createStudentSession` has no lesson-status check, and `JwtAuthGuard` checks `tokenVersion` only for tutors — so a student token is unrevocable for its full 7 days and a fresh one can be minted after a lesson ends.

> **Required when:** real students join real lessons. The demo's per-visitor tenants expire in 24h, which bounds this; a real tutor's lesson does not.

**Prompt-injection hardening.** Canvas text and `studentName` are interpolated into one flat Gemini prompt with no system/user split, no fencing and no escaping, and the first output is cached as the permanent summary with no regeneration path. `studentName` alone makes an empty board steerable. Payload size is now bounded by the canvas element schema, and `disallowedElements` on the summary markdown removes the on-screen phishing surface, so what remains is content integrity: a forged lesson record. The fix needs a design — system/user split, an unguessable fence with that delimiter stripped from content, and a tutor-facing regenerate or discard.

> **Required when:** a summary is shown to anyone whose judgement of the product depends on it, or when the summary is treated as a record rather than a demo artifact.

**Client-direct upload to Vercel Blob.** The multipart limits now bound field count and size, but moving to a client-direct upload with a server-minted token would delete the multipart path entirely rather than fencing it, and would remove the 4.5 MB ceiling that blocks running the api on Vercel. Strictly better; not needed on Cloud Run, whose 32 MB request limit clears our 5 MB `MAX_UPLOAD_BYTES`.

> **Required when:** the api moves to a platform with a request-body limit below `MAX_UPLOAD_BYTES`.

## Reviewed and consciously accepted

**`'unsafe-inline'` in the production `script-src`.** Real, and it means CSP is not an XSS control here. Accepted because there is no HTML-injection sink: no `rehype-raw`, no `dangerouslySetInnerHTML` anywhere in the app, and `remark-gfm` is not installed at all, so bare URLs stay inert text. Recheck the first time anything renders raw HTML.

**Dependency findings.** `bcrypt`'s install script, the nested `postcss`, `sharp`, and the `shadcn` production dependency were each examined and refused on today's reachability. That is a statement about today, not next month — re-run `npm audit` before each deploy.

**Atlas allowlisting `0.0.0.0/0`.** Forced by Cloud Run's dynamic egress; a static IP needs Cloud NAT, which costs more than the hosting. Credentials and TLS carry the weight. Revisit if the api moves somewhere with a stable egress IP.

## Verify on every deploy

- `NODE_ENV=production` is actually set. It is required at boot now, so a miss fails loudly rather than logging magic links — but confirm it rather than assume.
- `req.ip` resolves to a real client address, not a Cloud Run infrastructure address. Nothing tests this, and getting it wrong makes the anonymous rate limits global. See `docs/ARCHITECTURE.md` §Deployment for the `TRUST_PROXY` value and why.
- `npm audit` is clean, or its findings are consciously accepted.
