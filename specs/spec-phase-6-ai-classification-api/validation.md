# Phase 6 Validation — AI Classification API

Implementation is complete and ready for release-phase review only when every applicable item below passes. Leave items unchecked until supported by current evidence.

## Automated quality gates

- [x] `npm run format:check` exits 0.
- [x] `npm run lint` exits 0 with no warnings.
- [x] `npm run typecheck` exits 0 with no type errors.
- [x] `npm test` exits 0 with no failures and no network access to OpenAI.
- [x] `npm run build-storybook` exits 0 without AI configuration or provider requests.
- [x] `npm run build` exits 0 without exposing server-only AI configuration to client output.

## Dependencies and configuration

- [x] Runtime dependencies continue using the existing `zod` and native server `fetch`; no redundant AI, provider-adapter, schema, HTTP, retry, or agent dependency was added.
- [x] Dependency versions are recorded in `package.json` and resolved in the lockfile.
- [x] `OPENAI_API_KEY` and `OPENAI_MODEL` are validated only when classification is used.
- [x] The accepted model is `gpt-4.1-nano` and cannot be selected by a browser request.
- [x] Missing AI configuration does not break session, category, expense-query, Storybook, or provider-mocked test paths.
- [x] `.env.example` contains safe placeholders and no committed file contains a usable provider key.

## Expense extractor module

- [x] Exactly one provider integration module owns the OpenAI call, system prompt, strict JSON Schema, Zod validation schema, extractor types, and extractor error.
- [x] `ExpenseExtractorInput` contains only prompt, locale, and category names.
- [x] The strict JSON Schema sent to OpenAI matches the Zod validation schema and bounds the candidate array to at most 100 items.
- [x] `ExpenseExtractionOutput` is inferred from the Zod schema rather than duplicated as a handwritten provider-result type.
- [x] `extractExpenses` returns only provider-neutral `{ description, amountMinor, categoryName }` candidates in extraction order.
- [x] The extractor does not import HTTP, cookie, Redis, API-response, rat-dialogue, or React concerns.
- [x] The provider call is non-streaming and has finite timeout, output, and retry bounds.
- [x] A schema-valid empty array returns normally.
- [x] Structurally valid but domain-invalid candidate values return for independent application validation.
- [x] One typed `ExpenseExtractorError` discriminator covers configuration, timeout, provider, and invalid-output failures without unnecessary subclasses.
- [x] Original provider errors are retained only as server-side causes and safe exception messages contain no visitor or secret data.

## Prompt and privacy boundary

- [x] The provider receives only the exact validated prompt, active locale, and literal real-category names.
- [x] The provider receives no session/category/expense IDs, category colors, totals, existing expenses, timestamps, cookies, Redis keys, credentials, or logs.
- [x] System instructions distinguish untrusted prompt/category data from instructions and request only structured expense extraction.
- [x] Category names cannot trigger tools, URL fetching, secret disclosure, alternate response formats, or other behavior outside extraction.
- [x] The model has no tools, memory, application access, or prior-request context.
- [x] Raw prompts, raw output, extracted descriptions, session IDs, cookies, authorization values, and provider bodies are absent from logs.
- [x] Only validated `ExpenseDto` records are retained in the existing expiring Redis session.

## Extraction and domain behavior

- [x] One English prompt can produce one or several ordered expenses.
- [x] One Spanish prompt can produce one or several ordered expenses.
- [x] Decimal-point and Spanish decimal-comma amounts become positive integer minor units.
- [x] Missing, zero, negative, fractional-minor-unit, non-finite, and unsafe amounts are never persisted.
- [x] Descriptions remain concise and recognizable from the source without unnecessary translation or invented purchases.
- [x] Current category names resolve case-insensitively to opaque IDs.
- [x] Null, blank, unknown, ambiguous, stale, and fallback category labels become `categoryId: null`.
- [x] A session with no real categories accepts valid expenses as Unclassified.
- [x] A category removed between extraction and persistence cannot leave a dangling reference.
- [x] Candidate-level validation continues after an invalid candidate and preserves accepted extraction order.

## Capacity and partial success

- [x] A session already at its configured expense limit returns `409 expense_limit_reached` before calling the extractor.
- [x] When `n` slots remain and `n + y` candidates are valid, exactly the first `n` persist and the response reports `rejectedCount: y`.
- [x] Domain-invalid candidates and capacity overflow both contribute to `rejectedCount`.
- [x] At least one persisted expense produces `200 OK`, including partial success.
- [x] Partial success persists and returns only accepted expenses; rejected candidates are not stored.
- [x] Full and partial success with the same accepted count produce identical visible and accessible rat feedback.
- [x] The rat does not display or announce `rejectedCount` or skipped-expense copy.
- [x] A valid empty extraction or an all-rejected extraction returns `422 no_expenses_extracted` and writes nothing.

## API response contract

- [x] A `200` response validates against `promptMutationResponseSchema`.
- [x] Every returned expense has a canonical UUID, non-empty description, positive safe-integer `amountMinor`, nullable canonical category UUID, and non-negative safe-integer `createdAt`.
- [x] A success response contains at least one newly persisted expense and a non-negative safe-integer `rejectedCount`.
- [x] Returned success expenses are in extraction order and exclude pre-existing session expenses.
- [x] The response contains no provider metadata, token usage, model name, session identity, totals, raw output, or extra top-level fields.
- [x] The browser API client rejects a malformed success response rather than casting it to a trusted DTO.
- [x] Every error uses the shared `{ error: { code, message, field? } }` envelope and `Cache-Control: no-store` behavior.

## Endpoint error mapping

- [x] Malformed JSON, invalid prompt, and invalid locale return `400 invalid_request`.
- [x] Missing, invalid, or expired sessions return `401 session_not_found` without a provider call.
- [x] A full session returns `409 expense_limit_reached` without a provider call.
- [x] No accepted expense returns `422 no_expenses_extracted`.
- [x] Extractor configuration failure returns `500 internal_error`.
- [x] Extractor timeout, provider, and invalid-output failures return `503 service_unavailable`.
- [x] Redis operational failure returns `503 service_unavailable`.
- [x] Unexpected application failure returns `500 internal_error`.
- [x] The Phase 5 deliberate `501 classification_unavailable` path is absent.
- [x] Exception mapping uses class/discriminator checks and never error-message matching.
- [x] Provider, request, session, capacity, extraction, validation, and persistence failures leave Redis unchanged.
- [x] Public error responses contain no provider status body, exception name, raw validation output, prompt, ID, credential, stack trace, or Redis detail.

## Frontend outcome mapper

- [x] One pure function maps a discriminated prompt API outcome to rat presentation data.
- [x] Successful outcomes map from accepted `expenses.length`, not `rejectedCount`.
- [x] `invalid_request` and `no_expenses_extracted` map to extraction-failure presentation.
- [x] `session_not_found`, `expense_limit_reached`, `service_unavailable`, and `internal_error` map to the correct provider-error presentation key.
- [x] Unknown/network failures map to the generic provider-error presentation.
- [x] The mapper returns no raw API error, HTTP status, API code, server message, exception, or provider detail.
- [x] Loading is selected before the request and is not represented as a completed mapper outcome.
- [x] The mapper performs no input, refresh, focus, session, network, or logging side effect.
- [x] A table-driven unit test covers every outcome and proves full/partial success equivalence.

## Client workflow and accessibility

- [x] Capture submits the exact draft and active locale through the existing mutation gate.
- [x] Capture and conflicting mutation controls remain disabled while classification is pending.
- [x] Loading and final feedback are announced through the existing rat live region.
- [x] Full and partial success clear the draft, use ordinary singular/plural accepted-count copy, and refresh categories and expenses.
- [x] Every failure preserves the exact draft for correction or retry.
- [x] Session expiry preserves the draft, shows localized recovery feedback, creates a replacement session, and re-enables capture afterward.
- [x] Empty and overlength client validation stays attached to the input and prevents a request.
- [x] No visible or accessibility-only content includes an HTTP status, API code, exception name, raw fallback message, or rejected count.
- [x] English and Spanish titles/details remain natural, localized UI copy stored in typed i18next dictionaries.
- [x] The obsolete automatic-classification-unavailable and skipped-expense copy is removed when unused.
- [x] Keyboard focus remains visible and predictable through validation, loading, success, failure, and retry.

## Component, route, and integration coverage

- [x] Extractor tests cover valid output, empty output, malformed output, configuration, timeout, provider failure, and safe causes/messages.
- [x] Prompt-construction tests prove inclusion of allowed data and exclusion of forbidden data.
- [x] Route tests cover full success, partial success, no real categories, unknown categories, invalid candidates, empty output, all rejected, and exact capacity.
- [x] Route tests cover every documented status/code mapping and verify failed calls do not mutate Redis.
- [x] Persistence tests prove returned DTOs receive server IDs/timestamps and can be queried with consistent totals afterward.
- [x] Browser API tests cover valid success parsing, malformed success rejection, every stable error code, and network failure.
- [x] Rat mapper tests cover every mapping row without rendering raw transport data.
- [x] Dashboard tests cover draft behavior, accepted-count feedback, refresh coordination, session recovery, and stale-query protection.
- [x] English and Spanish component tests cover singular success, plural success, extraction failure, limit, service failure, internal/unknown failure, and session recovery.
- [x] Storybook uses deterministic fixture states and never imports or calls the extractor.

## Manual live-provider checks

- [x] With a non-production key, one English expense is extracted, persisted, and displayed correctly.
- [x] Several English expenses in one prompt remain in source order and update totals/chart.
- [x] One and several Spanish expenses, including a decimal comma, are extracted and displayed correctly.
- [x] Known category names resolve correctly and uncertain/unknown classifications appear as localized Unclassified.
- [x] A session with no categories can capture expenses into Unclassified.
- [x] Limited remaining capacity produces `200` partial success, stores only the first fitting candidates, and shows ordinary success copy without a skipped count.
- [x] A no-expense prompt preserves the draft and shows extraction-failure copy.
- [x] A simulated unavailable provider preserves the draft and shows generic recoverable service copy.
- [x] Refresh after success reads the persisted expenses and authoritative totals from the API.
- [x] Desktop and 390 px layouts remain usable with keyboard-only interaction and visible focus.
- [x] Browser Network inspection shows the documented status/error contracts while the rendered rat UI contains only localized human messages.

## Architecture and scope audit

- [x] New behavior is limited to one extractor module, the existing prompt route/persistence adjustment, and one pure frontend mapper plus necessary tests/contracts.
- [x] No generic AI interface, provider registry, use-case/service layer, controller wrapper, factory, manager, repository wrapper, dependency-injection container, agent framework, or global-state library was introduced.
- [x] The route calls the extractor and existing domain/Redis functions directly.
- [x] The extractor output type and public API success type remain intentionally different.
- [x] Provider types do not escape the extractor and HTTP/API types do not enter it.
- [x] Rat presentation types contain no transport or provider errors.
- [x] Redis schema, cookie transport, category behavior, query ownership, mutation serialization, and refresh coordination remain unchanged except where partial batch persistence requires a focused adjustment.
- [x] No expense editing, reclassification, deletion, currency conversion, category descriptions, accounts, durable history, rate limiting, bot protection, deployment, or unrelated redesign was added.

## Definition of done

All automated gates pass; all applicable manual, accessibility, privacy, and architecture checks are confirmed; a non-production live-provider smoke test succeeds; and no debug code, ignored failure, real credential, unnecessary abstraction, or unrelated feature work remains.

Validated on: 2026-09-08

Environment: Windows 11; Node.js 22.14.0; npm 10.9.2; Next.js 16.3.2; non-production Upstash Redis and OpenAI configuration from ignored local environment settings.

Live model: `gpt-4.1-nano`

Accepted differences: The accepted implementation changed from the earlier OpenRouter/Vercel AI SDK and ordered-model design to one bounded, non-retrying OpenAI Chat Completions request using native server `fetch`; the requirements, plan, validation checklist, technical baseline, and existing documentation now describe that decision. The one-prompt live integration test and representative English/Spanish browser workflows ran against the non-production provider. Destructive capacity edges and forced provider/session failures were confirmed through deterministic route and component coverage rather than consuming live quota or corrupting the smoke-test session. The validation host runs Node.js 22.14.0, below the repository's declared Node.js 24 minimum; all six gates still passed, but release validation should use the declared runtime. Dependency installation reported three high-severity transitive advisories; remediation is deferred to Phase 7 because forced upgrades were not part of Phase 6 validation.

Evidence summary: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` (24 files, 98 tests), `npm run build-storybook`, and `npm run build` all exited successfully. The opt-in live OpenAI test passed. Browser review confirmed English and Spanish multi-expense capture, decimal-comma conversion, custom-category matching, Unclassified fallback, no-result draft preservation, localized live-region feedback, synchronized totals/list/chart data, visible keyboard focus, and the 390 px layout. Client bundles and Storybook output contained no OpenAI credential, authorization header, or provider endpoint, and browser error/warning logs were empty.
