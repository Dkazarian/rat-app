# Phase 6 Plan — AI Classification API

Status: complete; validated against the accepted single-model OpenAI implementation on 2026-09-08.

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

- [x] Use the existing `zod` dependency and native server `fetch`; do not add a redundant AI SDK, provider adapter, HTTP, retry, or agent package.
- [x] Keep dependency versions recorded in `package.json` and resolved in the lockfile.
- [x] Validate `OPENAI_API_KEY` and `OPENAI_MODEL` lazily in the extractor path so missing AI configuration does not break non-AI routes, builds, tests, or Storybook.
- [x] Trim `OPENAI_MODEL`, reject a blank value, and keep the configured single model browser-inaccessible.
- [x] Use `gpt-4.1-nano` as the Phase 6 acceptance model while allowing a server-only model override.
- [x] Retain safe placeholders in `.env.example` and real values only in `.env.development.local` or the deployment environment.
- [x] Add an exact Zod schema for `PromptMutationResponse` to the existing shared contract module, including nested `ExpenseDto` constraints and non-negative safe-integer `rejectedCount`.
- [x] Infer the public response type from that schema where practical instead of maintaining a second handwritten shape.
- [x] Validate successful prompt responses in the browser API client before treating them as trusted application data.
- [x] Keep the existing shared API error envelope and stable error-code union; remove `classification_unavailable` only after every Phase 5 runtime and presentation reference is gone.

## Group 2 — Implement the expense extractor module

Create `src/server/ai/expense-extractor.ts`. Keep its schema, types, error, prompt construction, provider setup, and extraction function together because they form one small provider boundary.

- [x] Export `ExpenseExtractorInput` with only `prompt`, `locale`, and `categoryNames`.
- [x] Define and export the Zod structured-output schema, send its matching strict JSON Schema to OpenAI, and validate the parsed response with Zod. Its result contains a bounded `expenses` array of `{ description, amountMinor, categoryName }`.
- [x] Infer `ExpenseExtractionOutput` from that Zod schema.
- [x] Export `extractExpenses(input): Promise<ExpenseExtractionOutput>`.
- [x] Make one non-streaming OpenAI Chat Completions request with strict structured output.
- [x] Treat timeout, provider/model availability, network, and invalid-output failures as terminal extraction failures.
- [x] Give the request a finite timeout and bounded output tokens; do not retry, switch models/providers, or make a repair request.
- [x] Build separate system instructions and user data. Supply only the exact prompt, locale, and literal category names.
- [x] Instruct the model to extract purchases in source order, convert decimal values to integer minor units, preserve recognizable descriptions, and return a supplied category name only when clearly applicable.
- [x] Treat category names and prompt text as untrusted data, not instructions. Give the model no tools, URLs, prior expenses, IDs, totals, session data, or secrets.
- [x] Add one `ExpenseExtractorError` class with a typed `kind` discriminator: `configuration`, `timeout`, `provider`, or `invalid_output`. Do not add four subclasses when one typed exception carries the required distinction.
- [x] Translate terminal provider errors into `ExpenseExtractorError`, retaining the original only as `cause` and using a safe generic public message.
- [x] Return a schema-valid empty array normally. Do not turn “no expenses” into an extractor exception or HTTP-aware application error.
- [x] Keep domain validation, category-ID resolution, capacity, persistence, IDs, timestamps, HTTP responses, and rat feedback out of this module.

## Group 3 — Complete endpoint orchestration and persistence

Update the existing `src/app/api/v1/expenses/prompt/route.ts`; do not create another controller or application-service wrapper.

- [x] Require the cookie session and validate `{ prompt, locale }` with the existing request schema before calling AI.
- [x] Read current real categories and current expenses through existing server functions.
- [x] Return `409 expense_limit_reached` without calling the extractor when the session is already full.
- [x] Pass only the validated prompt, locale, and category names to `extractExpenses`.
- [x] Resolve returned category names against the pre-call category snapshot using the server's existing case-insensitive normalization; map missing, blank, unknown, ambiguous, or fallback labels to `categoryId: null`.
- [x] Independently validate each structural candidate with existing expense domain rules. Continue after a candidate-level validation failure.
- [x] Calculate the remaining capacity, keep valid candidates in extraction order, take only the first `n` when `n` slots remain, and include validation plus overflow omissions in `rejectedCount`.
- [x] Return `422 no_expenses_extracted` without writing when the extractor returns no candidates or no candidate survives domain validation/capacity handling.
- [x] Pass the accepted provider-neutral candidates to the existing Redis expense-creation function so it generates UUIDs and `createdAt`, revalidates category references, and persists the batch.
- [x] Adjust the existing expense-creation function only as needed for partial-capacity behavior and one bounded batch write; do not add a new persistence abstraction.
- [x] Return `200 PromptMutationResponse` containing only the newly persisted `ExpenseDto` values in extraction order and `rejectedCount`.
- [x] Preserve `GET /api/v1/expenses` ordering independently: newest `createdAt`, then ID.
- [x] Map extractor `configuration` to `500 internal_error`; map `timeout`, `provider`, and `invalid_output` to `503 service_unavailable`.
- [x] Preserve existing mappings for request validation (`400`), missing session (`401`), full session (`409`), no accepted expenses (`422`), Redis unavailability (`503`), and unknown failures (`500`).
- [x] Narrow exceptions by class and discriminator, never by matching message text.
- [x] Ensure provider, validation, session, capacity, and persistence failures write no expenses.
- [x] Retire the deliberate `501 classification_unavailable` response.

## Group 4 — Add the frontend rat-feedback mapper

Add one small pure module beside the capture-panel presentation, such as `src/features/dashboard/components/capture-panel/prompt-feedback.ts`.

- [x] Define a minimal discriminated `PromptApiOutcome`: successful `PromptMutationResponse`, known API error code, or unknown/network failure.
- [x] Export one `mapPromptOutcomeToRatFeedback` function that returns the existing rat presentation type or its smallest necessary revision.
- [x] Map a successful outcome from `response.expenses.length` to the ordinary success state.
- [x] Make partial and full success with the same accepted count return identical rat feedback; do not read `rejectedCount` when choosing visible or accessible copy.
- [x] Map `invalid_request` and `no_expenses_extracted` to the extraction-failure state and corresponding localization key.
- [x] Map `session_not_found`, `expense_limit_reached`, `service_unavailable`, `internal_error`, and unknown/network failures to the provider-error state with the corresponding user-facing localization key.
- [x] Keep `classification_unavailable` unreachable rather than adding another UI branch.
- [x] Return UI state, accepted count, and localization keys only. Do not put raw errors, status numbers, API codes, server fallback messages, or provider details into rat feedback.
- [x] Keep loading outside the completed-outcome mapper; Dashboard Page selects it before awaiting the request.
- [x] Keep draft clearing/preservation, query refresh, focus, and session recovery in Dashboard Page rather than putting side effects in the mapper.
- [x] Remove the unused `skippedExpenses` translations after partial success uses ordinary success copy.
- [x] Preserve exact drafts on all failures, including session recovery; clear and refresh after every full or partial success.

## Group 5 — Test each boundary

- [x] Unit-test AI configuration parsing for a single model, whitespace trimming, blank-value rejection, and absence of secrets from returned/public values.
- [x] Add mocked OpenAI request tests for success, provider failure, and timeout.
- [x] Add malformed/empty structured-output tests and prove failed extraction never reaches persistence.
- [x] Unit-test the extractor's Zod schema, inferred result, prompt construction, English/Spanish input, decimal point/comma instructions, bounded output, empty output, and each error kind.
- [x] Prove extractor prompts omit session IDs, category IDs, colors, totals, existing expenses, Redis data, and credentials.
- [x] Route-test success, partial success, invalid candidates, unknown categories, no categories, empty extraction, malformed structured output, every extractor error kind, malformed requests, expired sessions, full capacity, limited capacity, Redis failure, and unknown failure.
- [x] Prove a full session causes no extractor call and every failed request leaves Redis unchanged.
- [x] Prove `n` remaining slots plus `n + y` valid extracted candidates persists and returns the first `n` with `rejectedCount: y`.
- [x] Prove extractor output is transformed into server-generated `ExpenseDto` values rather than returned directly.
- [x] Test the browser client against valid and invalid prompt-response schemas.
- [x] Table-test every rat mapper outcome, including identical feedback for full and partial success with the same accepted count.
- [x] Component-test loading, clearing after success, preservation after errors, session recovery, query refresh, localization, focus, and live-region announcements.
- [x] Prove no rendered or accessibility-only text contains an HTTP status, API code, exception name, provider detail, or `rejectedCount`.
- [x] Keep Storybook deterministic with fixture-only rat states and no AI configuration.
- [x] Add a separately invoked live OpenAI integration test, excluded from the default suite and CI, that submits exactly one prompt (`Coffee $1.25`, locale `en`) through the configured extraction chain and asserts one schema-valid expense with `amountMinor: 125` and a non-empty description.
- [x] Gate the live test behind an explicit command or opt-in flag plus valid server-only credentials; skip clearly when either is absent, and never log the key or raw provider response.

## Group 6 — Documentation and final verification

- [x] Update root and source documentation to describe live classification instead of the Phase 5 placeholder.
- [x] Document the two server-only AI settings and local setup without committing a real key.
- [x] Document how to invoke the one-prompt live-provider test and that it contacts OpenAI and may consume quota.
- [x] Update the roadmap only after all validation evidence is complete.
- [x] Run formatting, lint, strict TypeScript, all tests, Storybook build, and production build.
- [x] Perform a non-production live smoke test for English and Spanish single/multiple expenses, category matching, Unclassified fallback, partial capacity, no-result recovery, provider failure, and synchronized dashboard data.
- [x] Inspect browser bundles, HTML, responses, logs, and the Network panel for accidental secret or raw-provider-data exposure.
- [x] Reconcile every requirement and validation item with implementation evidence and record accepted differences before marking Phase 6 complete.

## Completion handoff

Phase 6 hands Phase 7 a live, server-side classification path with one narrow provider module, the existing HTTP/Redis architecture, stable safe errors, deterministic UI feedback mapping, and provider-free automated tests. Phase 7 remains responsible for public-release safeguards and deployment verification.
