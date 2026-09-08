# Phase 6 Plan — AI Classification API

Status: implementation complete; final repository and live-provider verification remain.

This is the single execution record for Phase 6. It consolidates the original
implementation plan, the review decisions that refined it, and the accepted
OpenAI implementation. It describes the resulting design rather than narrating
superseded implementation steps.

## Outcome

Add a live, server-side expense-classification path to the Phase 5 prompt
endpoint. A validated English or Spanish prompt can produce several expenses,
which are independently validated, matched to the current session's categories,
persisted in Redis, and returned through the existing prompt-mutation contract.

The browser remains provider-agnostic. Redis remains authoritative, and the
session, category, expense-query, mutation-gate, refresh, and rat-feedback
architecture from Phase 5 remains intact.

## Consolidated decisions

### Final provider decision

- Use the OpenAI Chat Completions API directly at
  `https://api.openai.com/v1/chat/completions`.
- Configure it lazily with the server-only `OPENAI_API_KEY` and `OPENAI_MODEL`
  environment variables.
- Deploy with `OPENAI_MODEL=gpt-4.1-nano`; do not hard-code a browser-selectable
  model.
- Use one configured model per request, with no model fallback chain.
- Use the platform `fetch` implementation for this narrow request boundary and
  Zod for runtime validation; do not add an AI SDK dependency.
- An OpenAI API key and API billing are separate from a ChatGPT subscription.

### Boundaries retained from plan review

- Keep one provider-specific, function-based adapter in
  `src/server/ai/expense-extractor.ts`; do not add provider registries, generic
  AI abstractions, repositories, dependency-injection containers, agents, or
  chat history.
- Keep route orchestration, category resolution, candidate validation, session
  capacity, IDs, timestamps, persistence, HTTP mapping, and UI feedback outside
  the provider adapter.
- Send only the exact validated prompt, locale, and literal category names to
  OpenAI. Never send session/category IDs, colors, totals, existing expenses,
  Redis data, cookies, logs, or configuration.
- Treat visitor text and category names as untrusted data and keep system
  instructions separate from user content.
- Make one non-streaming request with a strict JSON Schema response format, a
  15-second timeout, and a bounded output-token budget.
- Validate the parsed response with the existing Zod schema before returning a
  provider-neutral result. Never persist raw provider output.
- Translate configuration, timeout, provider, and invalid-output failures into
  the narrow `ExpenseExtractorError` taxonomy with safe messages.
- Keep default automated tests and Storybook provider-free. The explicit live
  test is opt-in and must never log credentials or raw provider responses.

## Completed implementation

### 1. Configuration and provider adapter

- [x] Add lazily validated `OPENAI_API_KEY` and `OPENAI_MODEL` settings.
- [x] Reject missing, blank, or placeholder credentials and missing/blank model
      identifiers without breaking routes that do not classify expenses.
- [x] Keep the package manifest and lockfile free of unnecessary AI SDK and
      provider-adapter dependencies.
- [x] Build separate system instructions and structurally delimited user data.
- [x] Request strict JSON Schema output containing at most 100
      `{ description, amountMinor, categoryName }` candidates.
- [x] Parse assistant content as JSON and validate the complete result with Zod.
- [x] Bound the request with `AbortSignal.timeout(15_000)` and
      `max_completion_tokens: 1200`.
- [x] Map failures to `configuration`, `timeout`, `provider`, or
      `invalid_output` without exposing response bodies or credentials.

### 2. Existing Phase 6 application behavior

- [x] Resolve the cookie session and validate `{ prompt, locale }` before
      classification.
- [x] Avoid a provider call when the session is already at its expense limit.
- [x] Pass only prompt, locale, and current real-category names to the extractor.
- [x] Resolve returned category names against the server snapshot; normalize
      missing, blank, unknown, ambiguous, stale, or fallback labels to
      `categoryId: null`.
- [x] Validate structural candidates independently, preserve source order, and
      accept only the candidates that fit the remaining session capacity.
- [x] Count domain-invalid and over-capacity candidates in `rejectedCount`.
- [x] Generate expense UUIDs and timestamps on the server and persist accepted
      expenses through one bounded Redis mutation.
- [x] Return `200` only when at least one expense is persisted; preserve the
      established `400`, `401`, `409`, `422`, `500`, and `503` mappings otherwise.
- [x] Keep all failure paths free of provisional expense writes.
- [x] Retire the deliberate Phase 5 `501 classification_unavailable` response.

### 3. Client behavior

- [x] Validate successful prompt responses before treating them as application
      data.
- [x] Map stable API outcomes to localized rat feedback without rendering HTTP
      statuses, API codes, provider details, raw errors, or `rejectedCount`.
- [x] Present full and partial successes identically for the same accepted count.
- [x] Preserve the exact draft on failure; clear it and refresh category and
      expense queries after every success.
- [x] Keep loading, focus, session recovery, and refresh side effects outside the
      pure feedback mapper.

### 4. Tests and documentation

- [x] Update configuration tests for the OpenAI variables and singular model.
- [x] Mock `fetch` in extractor tests and assert URL, bearer authentication,
      configured model, message separation, strict response schema, timeout signal,
      token bound, response parsing, and safe error translation.
- [x] Keep route, persistence, browser-client, feedback, and component coverage
      for success, partial success, invalid candidates, capacity, session recovery,
      localization, focus, and query refresh.
- [x] Gate the live extractor test on valid `OPENAI_API_KEY` and `OPENAI_MODEL`
      values and keep it outside the default suite.
- [x] Document OpenAI `gpt-4.1-nano` in the root/source documentation, technology
      notes, and dashboard model label.

## Remaining verification

- [ ] Run Prettier checking, ESLint, strict TypeScript, the complete Vitest suite,
      Storybook build, and the production Next.js build in a fully provisioned
      environment.
- [ ] Run `npm run test:ai:live` with a funded OpenAI API key and
      `OPENAI_MODEL=gpt-4.1-nano`; confirm `Coffee $1.25` produces one schema-valid
      expense with `amountMinor: 125` and a non-empty description.
- [ ] Perform non-production smoke tests for English and Spanish prompts,
      multiple expenses, category matching, Unclassified fallback, partial
      capacity, empty extraction, provider failure, and synchronized dashboard data.
- [ ] Inspect browser bundles, HTML, responses, server logs, and the Network panel
      for accidental secrets, session identifiers, raw prompts, or raw-provider-data
      exposure.
- [ ] Reconcile `requirements.md` and `validation.md` with the accepted OpenAI
      provider amendment before declaring the entire phase/release complete.

## Vercel deployment

1. Add `OPENAI_API_KEY` and `OPENAI_MODEL` in **Project Settings → Environment
   Variables** for the intended Preview and Production environments.
2. Set `OPENAI_MODEL` to `gpt-4.1-nano`.
3. Do not prefix either setting with `NEXT_PUBLIC_`.
4. Redeploy so the deployment receives the new settings, then run the smoke
   checks above.

## Completion handoff

After the remaining verification is recorded, Phase 6 hands Phase 7 a live,
single-model OpenAI classification path behind the existing HTTP/Redis boundary,
with safe errors, deterministic UI feedback, provider-free default tests, and no
browser-visible AI credentials.
