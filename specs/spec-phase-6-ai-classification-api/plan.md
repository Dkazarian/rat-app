# Phase 6 Plan — AI Classification API

Status: single-model implementation complete; ordered OpenRouter model fallback, repository-wide formatting, and live-provider/release validation remain pending.

## Execution rules

- Treat [requirements.md](requirements.md) as authoritative. Update the requirement, plan, tests, and affected documentation together when an accepted contract changes.
- Implement only three new behavior boundaries:
  1. one server `expense-extractor` module;
  2. the existing prompt route as HTTP orchestrator; and
  3. one pure frontend API-outcome-to-rat-feedback mapper.
- Reuse the existing contracts, server validation, domain rules, Redis functions, browser API client, mutation gate, refresh signal, and rat dialogue.
- Do not introduce a use-case/service layer between the route and existing functions, a generic AI-provider interface, provider registry, factory, manager, repository wrapper, dependency-injection container, agent framework, or new global state.
- Keep the default automated suite and Storybook provider-free. Mock the extractor boundary or model calls there; isolate the explicitly invoked live-provider integration test from normal test and CI commands.
- Keep HTTP details out of the rat UI. Statuses and stable error codes remain visible in the network response and are converted to localized presentation data before rendering.
- Preserve the exact input on every failure. Clear it and refresh both dashboard queries after any success, including partial success.

## Group 1 — Add dependencies, configuration, and wire schemas

- [ ] Add runtime dependencies `ai` and `@openrouter/ai-sdk-provider`; continue using the existing `zod` dependency.
- [ ] Keep exact versions in `package.json` and the lockfile without adding another AI, schema, retry, or HTTP package.
- [ ] Validate `OPENROUTER_API_KEY` and `OPEN_ROUTER_MODEL` lazily in the extractor path so missing AI configuration does not break non-AI routes, builds, tests, or Storybook.
- [ ] Parse `OPEN_ROUTER_MODEL` as an ordered comma-separated list: trim identifiers, reject blank entries, require at least one model, and continue accepting a single identifier.
- [ ] Require `google/gemma-4-26b-a4b-it:free` as the primary Phase 6 acceptance model while keeping the complete ordered model list browser-inaccessible.
- [ ] Retain safe placeholders in `.env.example` and real values only in `.env.development.local` or the deployment environment.
- [ ] Add an exact Zod schema for `PromptMutationResponse` to the existing shared contract module, including nested `ExpenseDto` constraints and non-negative safe-integer `rejectedCount`.
- [ ] Infer the public response type from that schema where practical instead of maintaining a second handwritten shape.
- [ ] Validate successful prompt responses in the browser API client before treating them as trusted application data.
- [ ] Keep the existing shared API error envelope and stable error-code union; remove `classification_unavailable` only after every Phase 5 runtime and presentation reference is gone.

## Group 2 — Implement the expense extractor module

Create `src/server/ai/expense-extractor.ts`. Keep its schema, types, error, prompt construction, provider setup, and extraction function together because they form one small provider boundary.

- [ ] Export `ExpenseExtractorInput` with only `prompt`, `locale`, and `categoryNames`.
- [ ] Define and export the Zod structured-output schema passed directly to Vercel AI SDK. Its result contains a bounded `expenses` array of `{ description, amountMinor, categoryName }`.
- [ ] Infer `ExpenseExtractionOutput` from that Zod schema.
- [ ] Export `extractExpenses(input): Promise<ExpenseExtractionOutput>`.
- [ ] Use `generateText` with `Output.object` and the OpenRouter provider for each configured model attempted in left-to-right order.
- [ ] Make at most one non-streaming generation per configured model. Stop on the first schema-valid result; on timeout, provider/model availability, network/SDK, or invalid-output failure, advance to the next model.
- [ ] Give every attempt and the complete fallback sequence finite timeouts, bounded output tokens, and bounded SDK retry behavior. Never retry an earlier model or make a separate repair request.
- [ ] Build separate system instructions and user data. Supply only the exact prompt, locale, and literal category names.
- [ ] Instruct the model to extract purchases in source order, convert decimal values to integer minor units, preserve recognizable descriptions, and return a supplied category name only when clearly applicable.
- [ ] Treat category names and prompt text as untrusted data, not instructions. Give the model no tools, URLs, prior expenses, IDs, totals, session data, or secrets.
- [ ] Add one `ExpenseExtractorError` class with a typed `kind` discriminator: `configuration`, `timeout`, `provider`, or `invalid_output`. Do not add four subclasses when one typed exception carries the required distinction.
- [ ] Keep individual attempt failures inside the extractor while fallback models remain. After the list is exhausted, translate the terminal SDK/provider error into `ExpenseExtractorError`, retaining the original only as `cause` and using a safe generic public message.
- [ ] Return a schema-valid empty array normally. Do not turn “no expenses” into an extractor exception or HTTP-aware application error.
- [ ] Keep domain validation, category-ID resolution, capacity, persistence, IDs, timestamps, HTTP responses, and rat feedback out of this module.

## Group 3 — Complete endpoint orchestration and persistence

Update the existing `src/app/api/v1/expenses/prompt/route.ts`; do not create another controller or application-service wrapper.

- [ ] Require the cookie session and validate `{ prompt, locale }` with the existing request schema before calling AI.
- [ ] Read current real categories and current expenses through existing server functions.
- [ ] Return `409 expense_limit_reached` without calling the extractor when the session is already full.
- [ ] Pass only the validated prompt, locale, and category names to `extractExpenses`.
- [ ] Resolve returned category names against the pre-call category snapshot using the server's existing case-insensitive normalization; map missing, blank, unknown, ambiguous, or fallback labels to `categoryId: null`.
- [ ] Independently validate each structural candidate with existing expense domain rules. Continue after a candidate-level validation failure.
- [ ] Calculate the remaining capacity, keep valid candidates in extraction order, take only the first `n` when `n` slots remain, and include validation plus overflow omissions in `rejectedCount`.
- [ ] Return `422 no_expenses_extracted` without writing when the extractor returns no candidates or no candidate survives domain validation/capacity handling.
- [ ] Pass the accepted provider-neutral candidates to the existing Redis expense-creation function so it generates UUIDs and `createdAt`, revalidates category references, and persists the batch.
- [ ] Adjust the existing expense-creation function only as needed for partial-capacity behavior and one bounded batch write; do not add a new persistence abstraction.
- [ ] Return `200 PromptMutationResponse` containing only the newly persisted `ExpenseDto` values in extraction order and `rejectedCount`.
- [ ] Preserve `GET /api/v1/expenses` ordering independently: newest `createdAt`, then ID.
- [ ] Map extractor `configuration` to `500 internal_error`; map `timeout`, `provider`, and `invalid_output` to `503 service_unavailable`.
- [ ] Preserve existing mappings for request validation (`400`), missing session (`401`), full session (`409`), no accepted expenses (`422`), Redis unavailability (`503`), and unknown failures (`500`).
- [ ] Narrow exceptions by class and discriminator, never by matching message text.
- [ ] Ensure provider, validation, session, capacity, and persistence failures write no expenses.
- [ ] Retire the deliberate `501 classification_unavailable` response.

## Group 4 — Add the frontend rat-feedback mapper

Add one small pure module beside the capture-panel presentation, such as `src/features/dashboard/components/capture-panel/prompt-feedback.ts`.

- [ ] Define a minimal discriminated `PromptApiOutcome`: successful `PromptMutationResponse`, known API error code, or unknown/network failure.
- [ ] Export one `mapPromptOutcomeToRatFeedback` function that returns the existing rat presentation type or its smallest necessary revision.
- [ ] Map a successful outcome from `response.expenses.length` to the ordinary success state.
- [ ] Make partial and full success with the same accepted count return identical rat feedback; do not read `rejectedCount` when choosing visible or accessible copy.
- [ ] Map `invalid_request` and `no_expenses_extracted` to the extraction-failure state and corresponding localization key.
- [ ] Map `session_not_found`, `expense_limit_reached`, `service_unavailable`, `internal_error`, and unknown/network failures to the provider-error state with the corresponding user-facing localization key.
- [ ] Keep `classification_unavailable` unreachable rather than adding another UI branch.
- [ ] Return UI state, accepted count, and localization keys only. Do not put raw errors, status numbers, API codes, server fallback messages, or provider details into rat feedback.
- [ ] Keep loading outside the completed-outcome mapper; Dashboard Page selects it before awaiting the request.
- [ ] Keep draft clearing/preservation, query refresh, focus, and session recovery in Dashboard Page rather than putting side effects in the mapper.
- [ ] Remove the unused `skippedExpenses` translations after partial success uses ordinary success copy.
- [ ] Preserve exact drafts on all failures, including session recovery; clear and refresh after every full or partial success.

## Group 5 — Test each boundary

- [ ] Unit-test AI configuration parsing for a single model, ordered comma-separated models, whitespace trimming, blank-entry rejection, and absence of secrets from returned/public values.
- [ ] Add a mocked ordered-fallback unit test: make the first model fail and the second return a valid structured result; assert left-to-right model IDs, identical validated input, no call to later models, and no persistence from the failed attempt.
- [ ] Add a mocked fallback-exhaustion test: make every configured model fail, assert each is attempted exactly once in order, and expect one terminal extractor error with no persistence.
- [ ] Unit-test the extractor's Zod schema, inferred result, prompt construction, English/Spanish input, decimal point/comma instructions, bounded output, empty output, and each error kind.
- [ ] Prove extractor prompts omit session IDs, category IDs, colors, totals, existing expenses, Redis data, and credentials.
- [ ] Route-test success, partial success, invalid candidates, unknown categories, no categories, empty extraction, malformed structured output, every extractor error kind, malformed requests, expired sessions, full capacity, limited capacity, Redis failure, and unknown failure.
- [ ] Prove a full session causes no extractor call and every failed request leaves Redis unchanged.
- [ ] Prove `n` remaining slots plus `n + y` valid extracted candidates persists and returns the first `n` with `rejectedCount: y`.
- [ ] Prove extractor output is transformed into server-generated `ExpenseDto` values rather than returned directly.
- [ ] Test the browser client against valid and invalid prompt-response schemas.
- [ ] Table-test every rat mapper outcome, including identical feedback for full and partial success with the same accepted count.
- [ ] Component-test loading, clearing after success, preservation after errors, session recovery, query refresh, localization, focus, and live-region announcements.
- [ ] Prove no rendered or accessibility-only text contains an HTTP status, API code, exception name, provider detail, or `rejectedCount`.
- [ ] Keep Storybook deterministic with fixture-only rat states and no AI configuration.
- [ ] Add a separately invoked live OpenRouter integration test, excluded from the default suite and CI, that submits exactly one prompt (`Coffee $1.25`, locale `en`) through the configured extraction chain and asserts one schema-valid expense with `amountMinor: 125` and a non-empty description.
- [ ] Gate the live test behind an explicit command or opt-in flag plus valid server-only credentials; skip clearly when either is absent, and never log the key or raw provider response.

## Group 6 — Documentation and final verification

- [ ] Update root and source documentation to describe live classification instead of the Phase 5 placeholder.
- [ ] Document the two server-only AI settings and local setup without committing a real key.
- [ ] Document how to invoke the one-prompt live-provider test and that it contacts OpenRouter and may consume quota.
- [ ] Update the roadmap only after all validation evidence is complete.
- [ ] Run formatting, lint, strict TypeScript, all tests, Storybook build, and production build.
- [ ] Perform a non-production live smoke test for English and Spanish single/multiple expenses, category matching, Unclassified fallback, ordered model fallback, fallback exhaustion, partial capacity, no-result recovery, provider failure, and synchronized dashboard data.
- [ ] Inspect browser bundles, HTML, responses, logs, and the Network panel for accidental secret or raw-provider-data exposure.
- [ ] Reconcile every requirement and validation item with implementation evidence and record accepted differences before marking Phase 6 complete.

## Completion handoff

Phase 6 hands Phase 7 a live, server-side classification path with one narrow provider module, the existing HTTP/Redis architecture, stable safe errors, deterministic UI feedback mapping, and provider-free automated tests. Phase 7 remains responsible for public-release safeguards and deployment verification.
