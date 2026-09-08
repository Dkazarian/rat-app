# Phase 7 Plan — Public Demo Release

## References

- `specs/spec-phase-7-public-demo-release/requirements.md`
- `specs/mission.md`, `specs/roadmap.md`, and `specs/techstack.md`
- `specs/spec-phase-6-ai-classification-api/requirements.md` and `validation.md`
- `src/server/redis/client.ts`, `repository-helpers.ts`, `session-repository.ts`, and `keys.ts`
- `src/app/api/v1/expenses/prompt/route.ts`
- `src/contracts/session-api.ts`
- `src/server/validation.ts`, `domain/category-rules.ts`, `domain/expense-rules.ts`, and `ai/expense-extractor.ts`
- `package.json`

Status: `[x]` completed, `[ ]` pending external or manual validation.

## 1. Redis rate limiter

- [x] Extend `src/server/redis/keys.ts` with builders for the session-burst and global-burst keys; cover their exact environment-prefixed forms in `keys.test.ts`.
- [x] Create `src/server/redis/ai-rate-limiter.ts` with fixed server-only limits of 5/session/minute, 50/session lifetime, and 60/global/minute.
- [x] Export only:

```ts
export type AiRateLimitDecision =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; retryAfterSeconds: number }>;

export async function consumeAiRateLimit(
  sessionId: string,
): Promise<AiRateLimitDecision>;
```

- [x] Use one Redis script to confirm the session metadata exists, read `aiRequestCount` as zero when absent, check all limits, and increment the metadata field and both burst counters only when every limit admits the request.
- [x] Give new burst counters a 60-second TTL. Let `aiRequestCount` inherit the session metadata lifecycle; do not add a separate lifetime key or modify session renewal.
- [x] Return the longest applicable retry time when blocked. Map expired-session races to `session_not_found` and Redis failures through the existing repository error boundary.
- [x] Create `src/server/redis/ai-rate-limiter.test.ts` covering exact boundaries, TTL reset, session isolation, global sharing, session renewal/expiry behavior, atomic concurrent admission, no partial increments, and Redis failure.

## 2. HTTP integration

- [x] Add `rate_limited` to `src/contracts/session-api.ts` and its prompt-error schema.
- [x] Extend `ApplicationError` in `src/server/domain/errors.ts` with optional retry metadata and add `applicationErrors.rateLimited()`.
- [x] Update `src/server/http/responses.ts` to emit `Retry-After` only for rate limits while preserving `Cache-Control: no-store`; extend `responses.test.ts`.
- [x] Update the prompt route to resolve the session, consume the limiter, then parse the body and continue with the existing capacity, OpenAI, and persistence flow.
- [x] Extend `src/app/api/v1/expenses/prompt/route.test.ts` to prove `429` behavior, ordering, headers, and absence of body parsing, OpenAI calls, reads, and writes after denial.
- [x] Extend `src/features/dashboard/api/session-api-client.test.ts` to prove `rate_limited` remains a typed client error. No production change is expected in `session-api-client.ts`.

## 3. Input safety and expense normalization

- [x] Add a shared 120-character expense-description limit in `src/contracts/session-api.ts`.
- [x] Make `categoryNameBodySchema` strict in `src/server/validation.ts`; cover unexpected-field rejection in the category route test. Update `src/server/domain/category-rules.ts` to normalize names to Unicode NFC after trimming and reject line breaks plus Unicode control and formatting characters. Preserve the existing length, reserved-name, duplicate, and session-capacity rules; extend `category-rules.test.ts`.
- [x] Keep `promptBodySchema` free-form and retain its existing non-empty and 500-character validation. Do not add prompt-injection phrase filtering.
- [x] Tighten `expenseExtractionOutputSchema` in `src/server/ai/expense-extractor.ts` so descriptions and non-null category names have explicit maximum lengths; extend `expense-extractor.test.ts`.
- [x] Add deterministic description normalization to `src/server/domain/expense-rules.ts`: trim, capitalize the first Unicode letter while preserving any preceding punctuation, and preserve all other text exactly. Apply it through the existing pre-persistence validation path and extend `expense-rules.test.ts` and the prompt route test.
- [x] Keep React rendering escaped and unchanged; do not delegate capitalization to OpenAI or implement display-only capitalization in `expense-list-item.tsx`.

## 4. Minimal logging

- [x] Create `src/server/logger.ts` with the agreed thin `logger.info`, `logger.warn`, and `logger.error` console wrappers; create `logger.test.ts` for forwarding and default empty context.
- [x] Use the logger only with selected safe operational fields in the limiter and prompt route. Never pass prompts, names, identifiers, keys, credentials, provider bodies, raw IPs, or arbitrary error objects.
- [x] Update `src/server/seed/seed-redis.ts` to use the helper without printing the session ID or raw error details.

## 5. Rat feedback and asset

- [x] Add a dedicated `rate-limited` feedback state in `prompt-feedback.ts` and `rat-dialogue.tsx`; update their tests.
- [x] Add the new state to `dashboard-page.tsx`, preserving the exact draft and avoiding refresh/recovery side effects; extend `dashboard-page.test.tsx`.
- [x] Map the state to `public/assets/rat-mascot-tired.png` in `mascot.tsx` and create `mascot.test.tsx` for its source and localized alt text.
- [x] Add English `AI is tired` / `Try again later.` and Spanish `La IA está cansada` / `Probá más tarde.` strings and tired-mascot alt text to both translation JSON files.
- [x] Update `error-messages.ts`, `capture-panel.stories.tsx`, `dashboard-view-fixtures.ts`, and `dashboard-view-fixtures.test.ts` for exhaustive typed state coverage and a deterministic rate-limit story.

## 6. Privacy and documentation

- [x] Add the agreed OpenAI processing, temporary Redis storage, and sensitive-information notice to the root `README.md`.
- [x] Update `src/README.md` and `specs/techstack.md` with the limiter and logger placement and remove the obsolete statement that rate limiting is outside the initial release.
- [x] Create `specs/spec-phase-7-public-demo-release/validation.md` for automated, manual, privacy, logging, responsive, bilingual, keyboard, and accessibility evidence.
- [ ] Update `specs/roadmap.md` only after validation succeeds.

## 7. Verification

- [x] Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build-storybook`, and `npm run build` without Redis or OpenAI network access.
- [ ] Manually verify English and Spanish rate-limit feedback, exact draft preservation, tired mascot rendering, keyboard/focus behavior, narrow and desktop layouts, and safe `429` responses.
- [x] Verify category normalization/rejection, strict AI-output bounds, and persisted expense capitalization without altering the rest of each description.
- [ ] In production, smoke-test the three limits across separate sessions and confirm blocked requests never reach OpenAI or expense persistence.

## File inventory

### Create

- `specs/spec-phase-7-public-demo-release/plan.md`
- `specs/spec-phase-7-public-demo-release/validation.md`
- `src/server/redis/ai-rate-limiter.ts`
- `src/server/redis/ai-rate-limiter.test.ts`
- `src/server/logger.ts`
- `src/server/logger.test.ts`
- `src/features/dashboard/components/capture-panel/mascot.test.tsx`
- `public/assets/rat-mascot-tired.png` (already generated)

### Edit

- `README.md`
- `specs/roadmap.md`
- `specs/techstack.md`
- `src/README.md`
- `src/contracts/session-api.ts`
- `src/server/validation.ts`
- `src/server/domain/category-rules.ts`
- `src/server/domain/category-rules.test.ts`
- `src/server/domain/expense-rules.ts`
- `src/server/domain/expense-rules.test.ts`
- `src/server/ai/expense-extractor.ts`
- `src/server/ai/expense-extractor.test.ts`
- `src/server/domain/errors.ts`
- `src/server/http/responses.ts`
- `src/server/http/responses.test.ts`
- `src/server/redis/keys.ts`
- `src/server/redis/keys.test.ts`
- `src/server/seed/seed-redis.ts`
- `src/app/api/v1/expenses/prompt/route.ts`
- `src/app/api/v1/expenses/prompt/route.test.ts`
- `src/features/dashboard/api/error-messages.ts`
- `src/features/dashboard/api/session-api-client.test.ts`
- `src/features/dashboard/components/capture-panel/prompt-feedback.ts`
- `src/features/dashboard/components/capture-panel/prompt-feedback.test.ts`
- `src/features/dashboard/components/capture-panel/rat-dialogue.tsx`
- `src/features/dashboard/components/capture-panel/rat-dialogue.test.tsx`
- `src/features/dashboard/components/capture-panel/mascot.tsx`
- `src/features/dashboard/components/capture-panel/capture-panel.stories.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-page.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`
- `src/features/dashboard/fixtures/dashboard-view-fixtures.ts`
- `src/features/dashboard/fixtures/dashboard-view-fixtures.test.ts`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`

### Reference without planned edits

- `specs/spec-phase-7-public-demo-release/requirements.md`
- `specs/mission.md`
- `specs/spec-phase-6-ai-classification-api/requirements.md`
- `specs/spec-phase-6-ai-classification-api/validation.md`
- `src/server/config.ts`
- `src/server/redis/client.ts`
- `src/server/redis/repository-helpers.ts`
- `src/server/redis/session-repository.ts`
- `src/server/session/session-id.ts`
- `src/features/dashboard/api/session-api-client.ts`
- `package.json`
