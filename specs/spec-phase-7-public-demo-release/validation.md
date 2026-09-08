# Phase 7 Validation — Public Demo Release

Leave items unchecked until supported by current evidence.

## Automated gates

- [ ] `npm run format:check` passes.
- [ ] `npm run lint` passes with no warnings.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes without Redis or OpenAI network access.
- [ ] `npm run build-storybook` passes.
- [ ] `npm run build` passes without exposing server secrets.

## Redis rate limiting

- [ ] `POST /api/v1/expenses/prompt` allows 5 requests per session per 60 seconds and rejects request 6.
- [ ] One session allows 50 lifetime requests and rejects request 51.
- [ ] All sessions together allow 30 requests per 60 seconds and reject request 31.
- [ ] Session-burst keys use `${RATAPP_REDIS_KEY_PREFIX}:ratelimit:ai:burst:{<sessionId>}`.
- [ ] Global-burst key uses `${RATAPP_REDIS_KEY_PREFIX}:ratelimit:ai:global`.
- [ ] Lifetime count uses `aiRequestCount` in `${RATAPP_REDIS_KEY_PREFIX}:session:v1:{<sessionId>}:meta` and survives TTL renewal.
- [ ] Burst counters reset after expiry; lifetime count disappears with session metadata.
- [ ] Different sessions have isolated burst and lifetime counts while sharing the global count.
- [ ] Concurrent requests cannot exceed a limit or partially increment counters.
- [ ] Denied requests change no counter, call neither OpenAI nor persistence, and load no categories or expenses.
- [ ] Redis failure returns safe `503 service_unavailable`, not `429`.

## HTTP contract

- [ ] Rate-limit denial returns `429`, `rate_limited`, `Retry-After`, and `Cache-Control: no-store`.
- [ ] The response reveals no Redis key, count, session ID, or limiting scope.
- [ ] Session resolution happens before rate limiting; rate limiting happens before body parsing.
- [ ] A session expiring during limiter execution maps to `401 session_not_found`.
- [ ] Existing invalid-request, expense-capacity, provider, and persistence behavior remains unchanged.

## Logging and privacy

- [ ] One server-only helper exports thin `logger.info`, `logger.warn`, and `logger.error` console wrappers.
- [ ] Logging context contains only selected operational metadata.
- [ ] Runtime and seeder logs contain no prompts, names, session IDs, cookies, Redis keys, credentials, provider bodies, raw IPs, or arbitrary error objects.
- [ ] Root `README.md` states what data OpenAI processes, that accepted expenses are temporarily stored in Redis, and that visitors should avoid sensitive or identifying information.
- [ ] Documentation makes no unverified OpenAI retention or training claim.

## Client and mascot

- [ ] `rate_limited` parses as a typed client error and maps to a dedicated urgent rat state.
- [ ] English shows **AI is tired** and **Try again later.**
- [ ] Spanish shows **La IA está cansada** and **Probá más tarde.**
- [ ] Rate-limit failure preserves the exact draft and performs no data refresh or session recovery.
- [ ] The state uses `public/assets/rat-mascot-tired.png` with localized alt text and genuine transparency.
- [ ] Storybook includes a deterministic rate-limit state.
- [ ] Desktop and narrow layouts remain usable with keyboard control, visible focus, and correct alert announcement in both languages.

## Production smoke test

- [ ] Session, category, expense query, and successful classification workflows pass.
- [ ] Per-session burst, session lifetime, and global burst limits behave as specified across separate sessions.
- [ ] Browser and server output expose no credential or internal limiter data.
- [ ] Blocked requests do not reach OpenAI or create expenses.

## Sign-off

Validated on:

Environment:

Evidence:

Accepted differences:
