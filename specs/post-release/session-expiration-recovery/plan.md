# Session Expiration Recovery — Implementation Plan

## Objective

Implement `spec.md` without changing the application's lazy-session model.

An expired cookie must behave as no active session. Reads return empty state and
remain stateless. The next visitor-initiated category creation or prompt
submission creates one fresh session and completes normally. If expiration is
detected after a mutation has started, the client shows accurate feedback,
preserves correctable input, refreshes stale dashboard data, and waits for the
visitor to retry.

The existing server architecture already provides the main behavior:

- `withOptionalSession()` resolves reads without creating a session;
- `withLazySession()` creates and issues a session only when resolution finds no
  live session;
- delete routes use `requireSessionId()` and may return `session_not_found`;
- `issueSessionCookie()` emits a cookie only for a newly created session.

Keep those production paths unless focused tests expose a defect. Most server
work for this feature is explicit expiration coverage; the functional change is
the client recovery message and consistent mutation recovery.

## 1. Lock down session resolution semantics

Extend `src/server/session/resolve-session.test.ts`.

Split the current combined invalid/expired case into explicit cases:

1. A malformed cookie creates a new session without querying Redis.
2. A canonical cookie whose metadata lookup returns `null` creates one new
   session with a different ID.
3. A canonical live cookie is reused and never calls `saveSessionId()`.

For the expired-cookie case, assert that:

- `getSessionId()` receives the expired ID once;
- `saveSessionId()` receives the replacement ID once;
- the result is `{ sessionId: replacementId, created: true }`;
- no code attempts to copy, renew, or save the expired ID.

Do not add a recovery/bootstrap endpoint, eager resolution on page load, or a
client session store.

## 2. Prove expired reads remain empty and stateless

Extend both read route suites:

- `src/app/api/v1/categories/route.test.ts`
- `src/app/api/v1/expenses/route.test.ts`

Use a valid UUID cookie and make `getSessionId()` return `null` to represent an
expired Redis metadata key. This must be distinct from the existing no-cookie
coverage.

For each GET, assert:

- the response is `200` with the route's exact empty payload;
- `getSessionId()` checks the cookie ID;
- category/expense repository reads are not called;
- `saveSessionId()` is not called where that mock is present;
- no `Set-Cookie` header is emitted.

This is the server-authoritative state used by the client refresh after a race.
Do not change GET routes to return `401` or create a replacement session.

## 3. Prove lazy replacement on stateful requests

### Category creation

Extend `src/app/api/v1/categories/route.test.ts` with an expired-cookie case.
Send a canonical expired cookie, make its lookup return `null`, and submit a
valid category name.

Assert that the route:

- creates exactly one replacement ID;
- calls `createCategory()` with the replacement ID, never the expired ID;
- returns the ordinary `201` payload;
- issues the replacement cookie with the configured fixed `Max-Age`;
- does not attempt a second session creation or mutation call.

Retain the existing valid-session test proving that a live ID is reused and no
cookie is reissued.

### Prompt submission

Replace or complement the malformed-cookie recovery case in
`src/app/api/v1/expenses/prompt/route.test.ts` with a canonical expired-cookie
case.

Assert that the replacement ID is used consistently for:

- rate-limit consumption;
- category and current-expense reads;
- expense persistence.

The old ID must not be passed to any session-scoped dependency. The request must
call the extractor only once, return the ordinary successful prompt response,
and issue one replacement cookie.

Keep a separate live-session assertion proving that no replacement is saved and
no cookie is emitted. Tests must mock Redis and the extractor; do not contact
live services.

## 4. Cover the post-resolution expiration race

Add a focused prompt route test in
`src/app/api/v1/expenses/prompt/route.test.ts` for a live session that disappears
after initial resolution. Make the rate limiter or later persistence boundary
throw the existing `session_not_found` application error after
`getSessionId()` has accepted the cookie.

Assert that:

- the response is the ordinary `401 session_not_found` envelope;
- the failed request is not retried inside the route;
- the extractor and persistence calls occur no more than their expected single
  pass for the selected failure point;
- no replacement is created and no replacement cookie is claimed for that
  already-started request.

Then issue a second, explicit request with the same old cookie after making its
lookup return `null`. Assert that this visitor-initiated request follows the
ordinary lazy path, creates one replacement, and succeeds.

Do not automatically replay the first prompt. An AI call or persistence result
can be ambiguous, so only a new visitor action may retry it.

## 5. Keep delete expiration non-creating

Extend:

- `src/app/api/v1/categories/[categoryId]/route.test.ts`
- `src/app/api/v1/expenses/[expenseId]/route.test.ts`

For a canonical expired cookie, make `getSessionId()` return `null` and assert:

- the route returns `401 session_not_found`;
- the delete repository function is not called;
- no session is created and no cookie is emitted.

Do not convert deletes to `withLazySession()`. Their old targets belong to the
expired session and cannot exist in the fresh one. Recovery happens through the
dashboard refresh and a later supported create/prompt action.

## 6. Centralize client recovery feedback

Update
`src/features/dashboard/components/dashboard-page/dashboard-page.tsx` so every
`session_not_found` mutation uses one recovery callback.

That callback must do exactly two things:

1. Set urgent rat feedback to `provider-error` with
   `apiErrorSessionNotFound`.
2. Increment the existing `refreshCounter` through `notifyDataChanged()`.

Use the callback for:

- prompt submission failures;
- category create/delete failures forwarded by `DashboardResults`;
- expense delete failures;
- the existing session-expired query notification path.

Keep non-session failures on their current localized feedback paths. Keep the
existing `runMutation()` guard and `isMutating` state.

It is acceptable to retain the `onSessionExpired` prop seam between
`DashboardPage`, `DashboardResults`, and `ApiExpenseList`, but it must point to
the new feedback-plus-refresh callback instead of directly to
`notifyDataChanged()`. Avoid a broader component or query-state refactor.

The refresh must continue to drive both `useCategoryQuery()` and
`useExpenseQuery()`. Do not clear client data manually, mutate cached arrays,
add React Query, or issue a session-creation request. The follow-up GETs will
resolve the expired cookie as no session and return empty collections.

## 7. Preserve drafts and require explicit retry

Extend
`src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`
with recovery-focused tests.

### Prompt race

Start with populated category/expense responses, reject the prompt once with
`SessionApiError("session_not_found", ...)`, and make the subsequent GETs return
empty state.

Verify that:

- the exact textarea value, including whitespace and punctuation, remains;
- the expiration feedback is rendered as an alert;
- category and expense reads each run again;
- stale categories, expenses, and totals disappear after those reads resolve;
- `submitPrompt()` was called exactly once without waiting for a second user
  action.

Then click submit again explicitly with a successful mock response. Verify that
this second user action is the only retry and that ordinary success behavior
resumes.

### Category creation

Reject category creation once with `session_not_found`. Verify that the category
form stays open with its exact draft, the urgent expiration feedback appears,
and both dashboard resources refresh to empty. A second click may then succeed
through the ordinary create path; there must be no automatic retry.

### Delete recovery

Cover expired category and expense deletes, using focused tests or a
parameterized arrangement. Each failure must:

- show the same urgent expiration feedback;
- refresh both server-authoritative resources;
- remove stale dashboard data when the empty responses resolve;
- call the failed delete only once;
- leave a later category create or prompt submission usable.

Do not assert that the deleted object is restored. All data from the expired
anonymous session is permanently unavailable.

## 8. Correct and synchronize localized copy

Update:

- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`

Set `apiErrorSessionNotFound` exactly to:

- English: `Session expired. Continue to start fresh.`
- Spanish: `La sesión venció. Continuá para empezar de nuevo.`

Do not say that a new session is already starting. The replacement is created
only by the next supported stateful request.

Extend `src/features/dashboard/components/capture-panel/rat-dialogue.test.tsx`
to render this feedback in both locales. Assert the complete visible text and
the existing urgent `role="alert"` semantics. The typed translation setup in
`src/i18n/index.ts` must continue to enforce matching dictionary keys.

Do not add a new rat-dialogue state: session expiration remains a
`provider-error` with a specific detail key.

## 9. Add deterministic Storybook coverage

Update
`src/features/dashboard/components/capture-panel/capture-panel.stories.tsx`
with a session-expired story that passes:

```ts
{ state: "provider-error", detailKey: "apiErrorSessionNotFound" }
```

Provide deterministic English and Spanish coverage through story args/globals
without duplicating the translation string in the story. Keep the production
`RatDialogue` rendering path and existing mascot/accessibility behavior.

This story also serves the Capture Panel Layout Stability work: verify that the
new copy fits at supported desktop and narrow widths without clipping or page
overflow.

## 10. Verification

Run in this order:

1. `npm test`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format:check`
5. `npm run build-storybook`
6. `npm run build`

Verify from automated tests that:

- expired reads are empty, stateless, and cookie-free;
- expired category/prompt mutations each create exactly one fresh session and
  complete against only that session;
- valid sessions are reused without TTL or cookie renewal;
- race failures are not automatically replayed;
- prompt and category drafts survive recoverable failures;
- expired deletes clear stale UI state but do not create a session;
- a later visitor-initiated category create or prompt can recover normally;
- English and Spanish copy are exact and urgent dialogue semantics remain
  accessible;
- no test contacts live Redis or the AI provider.

Manually verify the expired-session story in English and Spanish at the normal
desktop canvas and the existing narrow viewport.

## File inventory

### Create

- `specs/post-release/session-expiration-recovery/plan.md`

### Edit

- `src/server/session/resolve-session.test.ts`
- `src/app/api/v1/categories/route.test.ts`
- `src/app/api/v1/expenses/route.test.ts`
- `src/app/api/v1/expenses/prompt/route.test.ts`
- `src/app/api/v1/categories/[categoryId]/route.test.ts`
- `src/app/api/v1/expenses/[expenseId]/route.test.ts`
- `src/features/dashboard/components/dashboard-page/dashboard-page.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`
- `src/features/dashboard/components/capture-panel/rat-dialogue.test.tsx`
- `src/features/dashboard/components/capture-panel/capture-panel.stories.tsx`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`

### Reference without planned production edits

- `src/server/session/resolve-session.ts`
- `src/server/session/session-handler.ts`
- `src/server/session/session-cookie.ts`
- `src/server/session/session-id.ts`
- `src/app/api/v1/categories/route.ts`
- `src/app/api/v1/expenses/route.ts`
- `src/app/api/v1/expenses/prompt/route.ts`
- `src/app/api/v1/categories/[categoryId]/route.ts`
- `src/app/api/v1/expenses/[expenseId]/route.ts`
- `src/features/dashboard/components/dashboard-page/dashboard-results.tsx`
- `src/features/expenses/components/api-expense-list.tsx`
- `src/features/categories/hooks/use-category-query.ts`
- `src/features/expenses/hooks/use-expense-query.ts`

## Constraints

Do not:

- restore or copy expired anonymous data;
- add eager session creation, a bootstrap call, or a client session store;
- change the fixed TTL or introduce sliding expiration;
- automatically retry AI calls or mutations;
- create sessions for GET or DELETE requests;
- add optimistic recovery state or manually rewrite query results;
- change API error envelopes or add a new rat state;
- refactor unrelated session, dashboard, or persistence code.

Use the existing
`visitor action → lazy session resolution → mutation → shared refreshCounter`
flow.
