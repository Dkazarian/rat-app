# Phase 7 Validation — Public Demo Release

Leave items unchecked until supported by current evidence.

## Automated gates

- [x] `npm run format:check` passes.
- [x] `npm run lint` passes with no warnings.
- [x] `npm run typecheck` passes.
- [x] `npm test` passes without Redis or OpenAI network access.
- [x] `npm run build-storybook` passes.
- [x] `npm run build` passes without exposing server secrets.

## Redis rate limiting

- [x] `POST /api/v1/expenses/prompt` allows 5 requests per session per 60 seconds and rejects request 6.
- [x] One session allows 50 lifetime requests and rejects request 51.
- [x] All sessions together allow 30 requests per 60 seconds and reject request 31.
- [x] Session-burst keys use `${RATAPP_REDIS_KEY_PREFIX}:ratelimit:ai:burst:{<sessionId>}`.
- [x] Global-burst key uses `${RATAPP_REDIS_KEY_PREFIX}:ratelimit:ai:global`.
- [x] Lifetime count uses `aiRequestCount` in `${RATAPP_REDIS_KEY_PREFIX}:session:v1:{<sessionId>}:meta` and survives TTL renewal.
- [x] Burst counters reset after expiry; lifetime count disappears with session metadata.
- [x] Different sessions have isolated burst and lifetime counts while sharing the global count.
- [x] Concurrent requests cannot exceed a limit or partially increment counters.
- [x] Denied requests change no counter, call neither OpenAI nor persistence, and load no categories or expenses.
- [x] Redis failure returns safe `503 service_unavailable`, not `429`.

## HTTP contract

- [x] Rate-limit denial returns `429`, `rate_limited`, `Retry-After`, and `Cache-Control: no-store`.
- [x] The response reveals no Redis key, count, session ID, or limiting scope.
- [x] Session resolution happens before rate limiting; rate limiting happens before body parsing.
- [x] A session expiring during limiter execution maps to `401 session_not_found`.
- [x] Existing invalid-request, expense-capacity, provider, and persistence behavior remains unchanged.

## Input safety and normalization

- [x] Category request bodies reject unexpected fields; names are trimmed, normalized to Unicode NFC, and retain the existing length, reserved-name, duplicate, and capacity checks.
- [x] Category names containing line breaks or Unicode control/formatting characters are rejected safely.
- [x] Prompts retain the non-empty and 500-character checks without fragile phrase blacklists.
- [x] Prompts and category names remain JSON-encoded, explicitly untrusted AI data.
- [x] AI output rejects descriptions over 120 characters and non-null category names over `CATEGORY_NAME_MAX_LENGTH`.
- [x] Accepted descriptions are trimmed and capitalized before Redis persistence; only the first Unicode letter changes, preceding punctuation stays intact, and the remainder is preserved exactly.
- [x] API responses and the expense list use the same persisted capitalized description; capitalization is not delegated to OpenAI or CSS.

## Logging and privacy

- [x] One server-only helper exports thin `logger.info`, `logger.warn`, and `logger.error` console wrappers.
- [x] Logging context contains only selected operational metadata.
- [x] Runtime and seeder logs contain no prompts, names, session IDs, cookies, Redis keys, credentials, provider bodies, raw IPs, or arbitrary error objects.
- [x] Root `README.md` states what data OpenAI processes, that accepted expenses are temporarily stored in Redis, and that visitors should avoid sensitive or identifying information.
- [x] Documentation makes no unverified OpenAI retention or training claim.

## Client and mascot

- [x] `rate_limited` parses as a typed client error and maps to a dedicated urgent rat state.
- [x] English shows **AI is tired** and **Try again later.**
- [x] Spanish shows **La IA está cansada** and **Probá más tarde.**
- [x] Rate-limit failure preserves the exact draft and performs no data refresh or session recovery.
- [x] The state uses `public/assets/rat-mascot-tired.png` with localized alt text and genuine transparency.
- [x] Storybook includes a deterministic rate-limit state.
- [ ] Desktop and narrow layouts remain usable with keyboard control, visible focus, and correct alert announcement in both languages.

## Production smoke test

- [ ] Session, category, expense query, and successful classification workflows pass.
- [ ] Per-session burst, session lifetime, and global burst limits behave as specified across separate sessions.
- [ ] Browser and server output expose no credential or internal limiter data.
- [ ] Blocked requests do not reach OpenAI or create expenses.

## Sign-off

Validated on: 2026-09-08

Environment: local Windows worktree; mocked Redis/OpenAI for automated tests

Evidence: all automated gates passed; 131 tests passed; PNG inspected as 32-bit ARGB with a transparent corner and opaque center

Accepted differences: production smoke testing and manual responsive, keyboard, focus, and bilingual visual checks remain pending
