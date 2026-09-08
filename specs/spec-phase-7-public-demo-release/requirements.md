# Phase 7 Requirements — Public Demo Release

## Objective

Prepare the existing bilingual classification flow for safe public use without changing its product behavior.

## AI rate limiting

- Protect only `POST /api/v1/expenses/prompt`; existing category, expense, prompt-length, and session limits remain domain validation, not rate limits.
- After resolving the session and before parsing the body or calling OpenAI, atomically enforce Redis-backed limits shared by all Vercel instances:
  - 5 admitted requests per session per 60 seconds;
  - 50 admitted requests over one session's lifetime;
  - 30 admitted requests globally per 60 seconds.
- Use these environment-prefixed Redis keys for the burst counters:
  - `${RATAPP_REDIS_KEY_PREFIX}:ratelimit:ai:burst:{<sessionId>}`;
  - `${RATAPP_REDIS_KEY_PREFIX}:ratelimit:ai:global`.
- Store the lifetime count as `aiRequestCount` in the existing `${RATAPP_REDIS_KEY_PREFIX}:session:v1:{<sessionId>}:meta` hash. Treat a missing field as zero, increment it only for an admitted request, and let it expire with the session.
- Expire burst counters after 60 seconds.
- Increment all applicable counters only when every limit admits the request. Do not use in-memory counters or expose keys, counts, session IDs, or the limiting scope.
- A denied request returns `429` with `rate_limited`, `Retry-After`, and `Cache-Control: no-store`; it calls neither OpenAI nor persistence. Limiter/Redis failure returns the existing safe `503 service_unavailable` response.

## Client feedback

- Add `rate_limited` to the shared API contracts and map it to a dedicated urgent rat state.
- Preserve the exact draft and show:
  - English: **AI is tired** — **Try again later.**
  - Spanish: **La IA está cansada** — **Probá más tarde.**
- Use `public/assets/rat-mascot-tired.png` for this state. Do not reveal which limit was reached.

## Logging

- Add one server-only helper exporting `logger.info`, `logger.warn`, and `logger.error` as thin `console` wrappers accepting an optional `Record<string, unknown>` context.
- Log only selected operational metadata. Never log prompts, expense or category text, session IDs, cookies, Redis keys, credentials, provider bodies, raw IP addresses, or arbitrary error objects.

## Privacy documentation

- Add a concise root README notice that prompts, locale, and current category names are sent to OpenAI; OpenAI processes the input and produces classification output; accepted expenses remain temporarily in the anonymous Redis session; and visitors should not submit sensitive or identifying information.
- Do not claim specific OpenAI retention or training behavior unless verified for the deployed API account.

## Verification

- Test each limit and exact boundary, burst expiry/reset, session isolation, global sharing, lifetime-count preservation across session renewal, removal on session expiry, atomic concurrent admission, and Redis failure.
- Prove denied requests do not call OpenAI or persist expenses and that `429`, `Retry-After`, safe logging, bilingual feedback, tired mascot, and draft preservation work as specified.
- Run formatting, lint, type checking, provider-free tests, Storybook build, production build, and responsive bilingual keyboard/accessibility review.

## Completion

Phase 7 is complete when the public flow passes all checks, rate limiting works across serverless instances, privacy and logging boundaries are documented and verified, and production smoke tests succeed.
