# Phase 6 Validation — AI Classification API

Implementation is complete and ready for release-phase review only when every applicable item below passes. Leave items unchecked until supported by current evidence.

## Automated quality gates

- [ ] `npm run format:check` exits 0.
- [ ] `npm run lint` exits 0 with no warnings.
- [ ] `npm run typecheck` exits 0 with no type errors.
- [ ] `npm test` exits 0 with no failures and no network access to OpenRouter.
- [ ] `npm run build-storybook` exits 0 without AI configuration or provider requests.
- [ ] `npm run build` exits 0 without exposing server-only AI configuration to client output.

## Dependencies and configuration

- [ ] Runtime dependencies include `ai`, `@openrouter/ai-sdk-provider`, and the existing `zod`; no redundant AI, schema, HTTP, retry, or agent dependency was added.
- [ ] Exact dependency versions are recorded in `package.json` and the lockfile.
- [ ] `OPENROUTER_API_KEY` and `OPEN_ROUTER_MODEL` are validated only when classification is used.
- [ ] The accepted model is `google/gemma-4-26b-a4b-it:free` and cannot be selected by a browser request.
- [ ] Missing AI configuration does not break session, category, expense-query, Storybook, or provider-mocked test paths.
- [ ] `.env.example` contains safe placeholders and no committed file contains a usable provider key.

## Expense extractor module

- [ ] Exactly one provider integration module owns the OpenRouter provider, Vercel AI SDK call, system prompt, structured Zod schema, extractor types, and extractor error.
- [ ] `ExpenseExtractorInput` contains only prompt, locale, and category names.
- [ ] The structured output schema is passed directly to the SDK and bounds the candidate array to at most 100 items.
- [ ] `ExpenseExtractionOutput` is inferred from the Zod schema rather than duplicated as a handwritten provider-result type.
- [ ] `extractExpenses` returns only provider-neutral `{ description, amountMinor, categoryName }` candidates in extraction order.
- [ ] The extractor does not import HTTP, cookie, Redis, API-response, rat-dialogue, or React concerns.
- [ ] The provider call is non-streaming and has finite timeout, output, and retry bounds.
- [ ] A schema-valid empty array returns normally.
- [ ] Structurally valid but domain-invalid candidate values return for independent application validation.
- [ ] One typed `ExpenseExtractorError` discriminator covers configuration, timeout, provider, and invalid-output failures without unnecessary subclasses.
- [ ] Original provider errors are retained only as server-side causes and safe exception messages contain no visitor or secret data.

## Prompt and privacy boundary

- [ ] The provider receives only the exact validated prompt, active locale, and literal real-category names.
- [ ] The provider receives no session/category/expense IDs, category colors, totals, existing expenses, timestamps, cookies, Redis keys, credentials, or logs.
- [ ] System instructions distinguish untrusted prompt/category data from instructions and request only structured expense extraction.
- [ ] Category names cannot trigger tools, URL fetching, secret disclosure, alternate response formats, or other behavior outside extraction.
- [ ] The model has no tools, memory, application access, or prior-request context.
- [ ] Raw prompts, raw output, extracted descriptions, session IDs, cookies, authorization values, and provider bodies are absent from logs.
- [ ] Only validated `ExpenseDto` records are retained in the existing expiring Redis session.

## Extraction and domain behavior

- [ ] One English prompt can produce one or several ordered expenses.
- [ ] One Spanish prompt can produce one or several ordered expenses.
- [ ] Decimal-point and Spanish decimal-comma amounts become positive integer minor units.
- [ ] Missing, zero, negative, fractional-minor-unit, non-finite, and unsafe amounts are never persisted.
- [ ] Descriptions remain concise and recognizable from the source without unnecessary translation or invented purchases.
- [ ] Current category names resolve case-insensitively to opaque IDs.
- [ ] Null, blank, unknown, ambiguous, stale, and fallback category labels become `categoryId: null`.
- [ ] A session with no real categories accepts valid expenses as Unclassified.
- [ ] A category removed between extraction and persistence cannot leave a dangling reference.
- [ ] Candidate-level validation continues after an invalid candidate and preserves accepted extraction order.

## Capacity and partial success

- [ ] A session already at its configured expense limit returns `409 expense_limit_reached` before calling the extractor.
- [ ] When `n` slots remain and `n + y` candidates are valid, exactly the first `n` persist and the response reports `rejectedCount: y`.
- [ ] Domain-invalid candidates and capacity overflow both contribute to `rejectedCount`.
- [ ] At least one persisted expense produces `200 OK`, including partial success.
- [ ] Partial success persists and returns only accepted expenses; rejected candidates are not stored.
- [ ] Full and partial success with the same accepted count produce identical visible and accessible rat feedback.
- [ ] The rat does not display or announce `rejectedCount` or skipped-expense copy.
- [ ] A valid empty extraction or an all-rejected extraction returns `422 no_expenses_extracted` and writes nothing.

## API response contract

- [ ] A `200` response validates against `promptMutationResponseSchema`.
- [ ] Every returned expense has a canonical UUID, non-empty description, positive safe-integer `amountMinor`, nullable canonical category UUID, and non-negative safe-integer `createdAt`.
- [ ] A success response contains at least one newly persisted expense and a non-negative safe-integer `rejectedCount`.
- [ ] Returned success expenses are in extraction order and exclude pre-existing session expenses.
- [ ] The response contains no provider metadata, token usage, model name, session identity, totals, raw output, or extra top-level fields.
- [ ] The browser API client rejects a malformed success response rather than casting it to a trusted DTO.
- [ ] Every error uses the shared `{ error: { code, message, field? } }` envelope and `Cache-Control: no-store` behavior.

## Endpoint error mapping

- [ ] Malformed JSON, invalid prompt, and invalid locale return `400 invalid_request`.
- [ ] Missing, invalid, or expired sessions return `401 session_not_found` without a provider call.
- [ ] A full session returns `409 expense_limit_reached` without a provider call.
- [ ] No accepted expense returns `422 no_expenses_extracted`.
- [ ] Extractor configuration failure returns `500 internal_error`.
- [ ] Extractor timeout, provider, and invalid-output failures return `503 service_unavailable`.
- [ ] Redis operational failure returns `503 service_unavailable`.
- [ ] Unexpected application failure returns `500 internal_error`.
- [ ] The Phase 5 deliberate `501 classification_unavailable` path is absent.
- [ ] Exception mapping uses class/discriminator checks and never error-message matching.
- [ ] Provider, request, session, capacity, extraction, validation, and persistence failures leave Redis unchanged.
- [ ] Public error responses contain no provider status body, exception name, raw validation output, prompt, ID, credential, stack trace, or Redis detail.

## Frontend outcome mapper

- [ ] One pure function maps a discriminated prompt API outcome to rat presentation data.
- [ ] Successful outcomes map from accepted `expenses.length`, not `rejectedCount`.
- [ ] `invalid_request` and `no_expenses_extracted` map to extraction-failure presentation.
- [ ] `session_not_found`, `expense_limit_reached`, `service_unavailable`, and `internal_error` map to the correct provider-error presentation key.
- [ ] Unknown/network failures map to the generic provider-error presentation.
- [ ] The mapper returns no raw API error, HTTP status, API code, server message, exception, or provider detail.
- [ ] Loading is selected before the request and is not represented as a completed mapper outcome.
- [ ] The mapper performs no input, refresh, focus, session, network, or logging side effect.
- [ ] A table-driven unit test covers every outcome and proves full/partial success equivalence.

## Client workflow and accessibility

- [ ] Capture submits the exact draft and active locale through the existing mutation gate.
- [ ] Capture and conflicting mutation controls remain disabled while classification is pending.
- [ ] Loading and final feedback are announced through the existing rat live region.
- [ ] Full and partial success clear the draft, use ordinary singular/plural accepted-count copy, and refresh categories and expenses.
- [ ] Every failure preserves the exact draft for correction or retry.
- [ ] Session expiry preserves the draft, shows localized recovery feedback, creates a replacement session, and re-enables capture afterward.
- [ ] Empty and overlength client validation stays attached to the input and prevents a request.
- [ ] No visible or accessibility-only content includes an HTTP status, API code, exception name, raw fallback message, or rejected count.
- [ ] English and Spanish titles/details remain natural, localized UI copy stored in typed i18next dictionaries.
- [ ] The obsolete automatic-classification-unavailable and skipped-expense copy is removed when unused.
- [ ] Keyboard focus remains visible and predictable through validation, loading, success, failure, and retry.

## Component, route, and integration coverage

- [ ] Extractor tests cover valid output, empty output, malformed output, configuration, timeout, provider failure, and safe causes/messages.
- [ ] Prompt-construction tests prove inclusion of allowed data and exclusion of forbidden data.
- [ ] Route tests cover full success, partial success, no real categories, unknown categories, invalid candidates, empty output, all rejected, and exact capacity.
- [ ] Route tests cover every documented status/code mapping and verify failed calls do not mutate Redis.
- [ ] Persistence tests prove returned DTOs receive server IDs/timestamps and can be queried with consistent totals afterward.
- [ ] Browser API tests cover valid success parsing, malformed success rejection, every stable error code, and network failure.
- [ ] Rat mapper tests cover every mapping row without rendering raw transport data.
- [ ] Dashboard tests cover draft behavior, accepted-count feedback, refresh coordination, session recovery, and stale-query protection.
- [ ] English and Spanish component tests cover singular success, plural success, extraction failure, limit, service failure, internal/unknown failure, and session recovery.
- [ ] Storybook uses deterministic fixture states and never imports or calls the extractor.

## Manual live-provider checks

- [ ] With a non-production key, one English expense is extracted, persisted, and displayed correctly.
- [ ] Several English expenses in one prompt remain in source order and update totals/chart.
- [ ] One and several Spanish expenses, including a decimal comma, are extracted and displayed correctly.
- [ ] Known category names resolve correctly and uncertain/unknown classifications appear as localized Unclassified.
- [ ] A session with no categories can capture expenses into Unclassified.
- [ ] Limited remaining capacity produces `200` partial success, stores only the first fitting candidates, and shows ordinary success copy without a skipped count.
- [ ] A no-expense prompt preserves the draft and shows extraction-failure copy.
- [ ] A simulated unavailable provider preserves the draft and shows generic recoverable service copy.
- [ ] Refresh after success reads the persisted expenses and authoritative totals from the API.
- [ ] Desktop and 390 px layouts remain usable with keyboard-only interaction and visible focus.
- [ ] Browser Network inspection shows the documented status/error contracts while the rendered rat UI contains only localized human messages.

## Architecture and scope audit

- [ ] New behavior is limited to one extractor module, the existing prompt route/persistence adjustment, and one pure frontend mapper plus necessary tests/contracts.
- [ ] No generic AI interface, provider registry, use-case/service layer, controller wrapper, factory, manager, repository wrapper, dependency-injection container, agent framework, or global-state library was introduced.
- [ ] The route calls the extractor and existing domain/Redis functions directly.
- [ ] The extractor output type and public API success type remain intentionally different.
- [ ] Provider types do not escape the extractor and HTTP/API types do not enter it.
- [ ] Rat presentation types contain no transport or provider errors.
- [ ] Redis schema, cookie transport, category behavior, query ownership, mutation serialization, and refresh coordination remain unchanged except where partial batch persistence requires a focused adjustment.
- [ ] No expense editing, reclassification, deletion, currency conversion, category descriptions, accounts, durable history, rate limiting, bot protection, deployment, or unrelated redesign was added.

## Definition of done

All automated gates pass; all applicable manual, accessibility, privacy, and architecture checks are confirmed; a non-production live-provider smoke test succeeds; and no debug code, ignored failure, real credential, unnecessary abstraction, or unrelated feature work remains.

Validated on:

Environment:

Live model:

Accepted differences:
