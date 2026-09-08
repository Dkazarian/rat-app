# Phase 7 Plan — Public Demo Release

## References

- `specs/spec-phase-7-public-demo-release/requirements.md`
- `specs/mission.md`, `specs/roadmap.md`, and `specs/techstack.md`
- `specs/spec-phase-6-ai-classification-api/requirements.md` and `validation.md`
- `src/server/redis/client.ts`, `repository-helpers.ts`, `session-repository.ts`, and `keys.ts`
- `src/app/api/v1/expenses/prompt/route.ts`
- `src/contracts/session-api.ts`
- `package.json`

## 1. Redis rate limiter

- Extend `src/server/redis/keys.ts` with builders for the session-burst and global-burst keys; cover their exact environment-prefixed forms in `keys.test.ts`.
- Create `src/server/redis/ai-rate-limiter.ts` with fixed server-only limits of 5/session/minute, 50/session lifetime, and 30/global/minute.
- Export only:

```ts
export type AiRateLimitDecision =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; retryAfterSeconds: number }>;

export async function consumeAiRateLimit(
  sessionId: string,
): Promise<AiRateLimitDecision>;
```

- Use one Redis script to confirm the session metadata exists, read `aiRequestCount` as zero when absent, check all limits, and increment the metadata field and both burst counters only when every limit admits the request.
- Give new burst counters a 60-second TTL. Let `aiRequestCount` inherit the session metadata lifecycle; do not add a separate lifetime key or modify session renewal.
- Return the longest applicable retry time when blocked. Map expired-session races to `session_not_found` and Redis failures through the existing repository error boundary.
- Create `src/server/redis/ai-rate-limiter.test.ts` covering exact boundaries, TTL reset, session isolation, global sharing, session renewal/expiry behavior, atomic concurrent admission, no partial increments, and Redis failure.

## 2. HTTP integration

- Add `rate_limited` to `src/contracts/session-api.ts` and its prompt-error schema.
- Extend `ApplicationError` in `src/server/domain/errors.ts` with optional retry metadata and add `applicationErrors.rateLimited()`.
- Update `src/server/http/responses.ts` to emit `Retry-After` only for rate limits while preserving `Cache-Control: no-store`; extend `responses.test.ts`.
- Update the prompt route to resolve the session, consume the limiter, then parse the body and continue with the existing capacity, OpenAI, and persistence flow.
- Extend `src/app/api/v1/expenses/prompt/route.test.ts` to prove `429` behavior, ordering, headers, and absence of body parsing, OpenAI calls, reads, and writes after denial.
- Extend `src/features/dashboard/api/session-api-client.test.ts` to prove `rate_limited` remains a typed client error. No production change is expected in `session-api-client.ts`.

## 3. Minimal logging

- Create `src/server/logger.ts` with the agreed thin `logger.info`, `logger.warn`, and `logger.error` console wrappers; create `logger.test.ts` for forwarding and default empty context.
- Use the logger only with selected safe operational fields in the limiter and prompt route. Never pass prompts, names, identifiers, keys, credentials, provider bodies, raw IPs, or arbitrary error objects.
- Update `src/server/seed/seed-redis.ts` to use the helper without printing the session ID or raw error details.

## 4. Rat feedback and asset

- Add a dedicated `rate-limited` feedback state in `prompt-feedback.ts` and `rat-dialogue.tsx`; update their tests.
- Add the new state to `dashboard-page.tsx`, preserving the exact draft and avoiding refresh/recovery side effects; extend `dashboard-page.test.tsx`.
- Map the state to `public/assets/rat-mascot-tired.png` in `mascot.tsx` and create `mascot.test.tsx` for its source and localized alt text.
- Add English `AI is tired` / `Try again later.` and Spanish `La IA está cansada` / `Probá más tarde.` strings and tired-mascot alt text to both translation JSON files.
- Update `error-messages.ts`, `capture-panel.stories.tsx`, `dashboard-view-fixtures.ts`, and `dashboard-view-fixtures.test.ts` for exhaustive typed state coverage and a deterministic rate-limit story.

## 5. Privacy and documentation

- Add the agreed OpenAI processing, temporary Redis storage, and sensitive-information notice to the root `README.md`.
- Update `src/README.md` and `specs/techstack.md` with the limiter and logger placement and remove the obsolete statement that rate limiting is outside the initial release.
- Create `specs/spec-phase-7-public-demo-release/validation.md` for automated, manual, privacy, logging, responsive, bilingual, keyboard, and accessibility evidence.
- Update `specs/roadmap.md` only after validation succeeds.

## 6. Verification

- Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build-storybook`, and `npm run build` without Redis or OpenAI network access.
- Manually verify English and Spanish rate-limit feedback, exact draft preservation, tired mascot rendering, keyboard/focus behavior, narrow and desktop layouts, and safe `429` responses.
- In production, smoke-test the three limits across separate sessions and confirm blocked requests never reach OpenAI or expense persistence.

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
