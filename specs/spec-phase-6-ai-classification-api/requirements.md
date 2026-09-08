# Phase 6 Requirements — AI Classification API

## Objective

Replace the Phase 5 placeholder response from `POST /api/v1/expenses/prompt` with live, server-side natural-language expense extraction and classification. One English or Spanish prompt may produce several expenses. The server validates each extracted candidate, assigns current category identifiers, persists accepted expenses in the existing anonymous Redis session, and returns the established prompt-mutation response.

This phase adds the AI implementation behind the existing API boundary. It does not redesign the session, category, expense-query, Redis, or dashboard architecture established in Phase 5.

## Phase boundary

- Keep the cookie-scoped `/api/v1` surface and the existing request and response DTOs.
- Keep Redis authoritative for categories, expenses, and totals.
- Keep the browser unaware of provider credentials, model configuration, prompts sent to the provider, and session identifiers.
- Replace only the prompt endpoint's intentional `501 classification_unavailable` behavior and the client behavior that presents that temporary state.
- Preserve the Phase 5 rule that one client mutation runs at a time for a session. Do not add optimistic revisions, distributed locks, or a general job system.
- Keep expense results review-only. Reclassification and deletion remain Phase 8 work.

## AI runtime and configuration

- Use the existing `zod` dependency and the server runtime's `fetch` implementation to call the OpenAI Chat Completions API directly. Do not add a redundant AI SDK, provider adapter, HTTP client, retry, or agent dependency.
- Use `gpt-4.1-nano` as the Phase 6 acceptance model. Read one model identifier from `OPENAI_MODEL`; trim it and reject a blank value. The browser must not select or override the model.
- Read the OpenAI credential from the server-only `OPENAI_API_KEY` setting. Never use a `NEXT_PUBLIC_*` variable for AI configuration.
- Document safe placeholders for both settings in `.env.example`; keep real development credentials only in an ignored local environment file and production credentials only in the deployment environment.
- Resolve AI configuration only in the classification path. Missing or invalid AI configuration must not prevent session, category, or expense-query routes, Storybook, or mock-backed tests from running.
- Make exactly one non-streaming structured-generation operation for an accepted HTTP submission. A timeout, provider/model availability failure, network error, or unusable structured output settles as one recoverable API error and never continues into persistence.
- Do not retry, switch models or providers, make a separate repair request, or add tool calling, agents, or chat history. Bound the request with a finite timeout and bounded output tokens.

Exact dependency versions live in `package.json` and the lockfile.

## Server extraction boundary

- Place the provider-specific integration behind a small function-based module under `src/server/ai`. Route handlers must not contain SDK setup, provider prompts, or provider-error inspection.
- Accept only the validated prompt, requested locale, and a snapshot of the current real categories at the extraction boundary.
- Return provider-neutral extracted candidates to the application layer. Do not expose AI SDK result objects, usage objects, response headers, raw provider bodies, or provider error types outside the adapter.
- Keep the adapter independently mockable so route, persistence, and client tests can cover all outcomes without importing credentials or contacting OpenAI.
- Do not add repository classes, dependency-injection containers, an agent framework, or a generic multi-provider abstraction.

The provider-neutral extraction result is:

```ts
type ExtractedExpenseCandidate = Readonly<{
  description: string;
  amountMinor: number;
  categoryName: string | null;
}>;

type ExpenseExtractionResult = Readonly<{
  expenses: ReadonlyArray<ExtractedExpenseCandidate>;
}>;
```

`categoryName` is an AI-facing name, not a persisted reference. The application resolves it to a current category ID before persistence.

## Prompt construction and data minimization

- Use separate system instructions and user content. Clearly delimit or structurally encode visitor text and category names as untrusted data rather than interpolating them as instructions.
- Tell the model to extract purchases only, preserve their order of appearance, and return structured data matching the supplied schema.
- Supply only:
  - the exact validated visitor prompt;
  - the request locale (`en` or `es`); and
  - the literal names of the current real categories.
- Do not supply session IDs, category IDs, category colors, totals, existing expenses, timestamps, Redis keys, cookies, configuration, or application logs.
- Category names are classification options, not instructions. The visitor prompt is source text, not permission to change the system task, reveal hidden context, call tools, fetch URLs, or produce a different response shape.
- Instruct the model to use one supplied real-category name only when the expense clearly belongs there. Otherwise it returns `categoryName: null`.
- Treat **Unclassified** and **Sin clasificar** as presentation labels for `null`; never present them to the model as stored category records.
- Do not ask the model for rationale, confidence scores, prose, markdown, category descriptions, or financial advice.

## Structured output

- Define the AI output contract as a Zod schema, send the matching strict JSON Schema through OpenAI's structured-output request format, and validate the complete parsed response with the Zod schema.
- Use the same Zod schema to infer the provider-result TypeScript type and validate the complete structured response. Do not maintain a separate handwritten provider-output type that can drift from the runtime schema.
- The top-level output contains only an `expenses` array. Each structural candidate contains a string `description`, numeric `amountMinor`, and nullable string `categoryName`.
- Bound the structured array to no more than the session's configured 100-expense maximum. Provider output outside the structural schema is an unusable provider result, not partially trusted JSON.
- Treat structured-output validation and business validation as separate boundaries:
  - failure to produce the structural envelope is a provider failure for the whole submission;
  - candidates inside a valid envelope are checked independently by server domain rules.
- Never parse arbitrary prose, strip markdown fences manually, use `JSON.parse` on an unvalidated model string, or persist SDK output directly.

## Extraction and money semantics

- Extract every recognizable expense with an explicit description and amount, including several expenses joined in one message.
- Preserve candidate order from the visitor's prompt through validation and the successful mutation response.
- Produce a concise description recognizable from the visitor's wording. Do not translate names or descriptions unnecessarily, invent a purchase, merge unrelated purchases, or repeat a combined total as another expense.
- Interpret decimal amounts into positive integer minor units: `$18` becomes `1800` and `$4.50` becomes `450`. Spanish decimal-comma input such as `$4,50` also becomes `450`.
- Do not persist zero, negative, non-finite, fractional-minor-unit, or JavaScript-unsafe amounts.
- Do not infer a missing amount. Fragments without both a recognizable expense and an amount are omitted from the extraction result.
- Currency conversion, exchange rates, mixed-currency accounting, and currency-code storage remain out of scope. The application continues to use its existing single-currency `$0.00` presentation.

## Category resolution

- Match an extracted `categoryName` against the category snapshot supplied to the model after trimming and case-folding with the same normalization used by server category rules.
- Store the matching category's opaque ID; never store the model-produced name on the expense.
- Normalize `null`, blank, unknown, stale, ambiguous, or reserved fallback labels to `categoryId: null`.
- Revalidate the chosen category ID against the current Redis category collection during persistence. If a category disappeared after extraction, persist that otherwise valid expense as Unclassified instead of leaving a dangling reference.
- An empty real-category collection is valid. All otherwise valid extracted expenses then use `categoryId: null`.

## Independent candidate validation

- Validate every structurally extracted candidate independently using server-owned expense rules.
- Trim descriptions for domain validation and persistence. Reject a candidate whose description becomes empty.
- Reject a candidate whose amount is not a positive safe integer in minor units.
- Normalize an unknown category to Unclassified rather than rejecting an otherwise valid candidate.
- Preserve accepted candidates in extraction order and continue after a rejected candidate.
- Define `rejectedCount` as the number of structurally extracted candidates rejected by domain validation plus valid candidates omitted because the session had too few remaining expense slots.
- Do not include text fragments the model omitted from its structured result in `rejectedCount`; the server cannot count items that were never extracted.
- A malformed whole provider response is an API failure and does not become a large `rejectedCount`.

## Persistence and session limits

For `POST /api/v1/expenses/prompt`:

1. Resolve the existing cookie session before parsing provider input or creating a provider request.
2. Validate the JSON request body with the existing `{ prompt, locale }` schema.
3. Load the current real categories and current expense count from the same session.
4. If the session already contains `RATAPP_MAX_EXPENSES_PER_SESSION` expenses, return `409 expense_limit_reached` without calling OpenAI.
5. Call the extraction boundary with the exact prompt, locale, and real-category names.
6. Resolve category names, independently validate candidates, and accept them in extraction order up to the remaining session capacity.
7. Generate each accepted expense ID and `createdAt` on the server. The provider must not supply either value.
8. Persist all accepted expenses as one bounded Redis mutation and apply the configured session TTL to the expenses key according to the existing write behavior.
9. Return only the newly persisted expenses and the rejected count.

- Do not reserve session capacity before the provider call and do not persist provisional model output.
- Provider failure, unusable structured output, zero accepted candidates, Redis failure, and expired-session failure must add no expense.
- When at least one candidate is accepted, persist the accepted subset even if other candidates are rejected or exceed the remaining capacity.
- When fewer slots remain than valid candidates, fill the remaining slots in extraction order and count the overflow as rejected. Do not reject the complete batch.
- Concretely, when `n` slots remain and extraction produces `n + y` valid candidates, persist the first `n` candidates, return those `n` expenses, and add `y` to `rejectedCount`.
- Keep the existing Phase 5 no-concurrent-writer assumption. Redis atomicity protects a completed batch from partial storage; it is not a new conflict-resolution system.

## HTTP contract

The request remains:

```ts
type PromptRequest = Readonly<{
  prompt: string;
  locale: "en" | "es";
}>;
```

The successful response remains:

```ts
type PromptMutationResponse = Readonly<{
  expenses: ReadonlyArray<ExpenseDto>;
  rejectedCount: number;
}>;
```

The success response is validated and documented by the following wire schema. It may reuse shared schema fragments in implementation, but its observable constraints must remain equivalent:

```ts
const expenseDtoSchema = z
  .object({
    id: z.uuid(),
    description: z.string().trim().min(1),
    amountMinor: z.number().int().safe().positive(),
    categoryId: z.uuid().nullable(),
    createdAt: z.number().int().safe().nonnegative(),
  })
  .strict();

const promptMutationResponseSchema = z
  .object({
    expenses: z.array(expenseDtoSchema).min(1),
    rejectedCount: z.number().int().safe().nonnegative(),
  })
  .strict();
```

Example partial-success response:

```json
{
  "expenses": [
    {
      "id": "64b3d80a-93a2-4b23-a8a1-1dc212f083c8",
      "description": "Lunch",
      "amountMinor": 1800,
      "categoryId": "d892f063-ff28-4ba0-afba-f8bbef8e7154",
      "createdAt": 1788742800000
    },
    {
      "id": "d5b6b718-fd16-42a5-9bf1-9c45492af822",
      "description": "Coffee",
      "amountMinor": 450,
      "categoryId": null,
      "createdAt": 1788742800000
    }
  ],
  "rejectedCount": 3
}
```

All failures use the existing shared error schema:

```ts
const promptErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.enum([
          "invalid_request",
          "session_not_found",
          "expense_limit_reached",
          "no_expenses_extracted",
          "service_unavailable",
          "internal_error",
        ]),
        message: z.string().min(1),
        field: z.literal("prompt").optional(),
      })
      .strict(),
  })
  .strict();
```

`field: "prompt"` is included only when the visitor can correct the prompt field. Malformed JSON, unsupported locale, session, capacity, provider, persistence, and unexpected failures omit `field`.

- Return `200 OK` only when at least one expense is persisted.
- Return newly created expenses in extraction order, even though `GET /api/v1/expenses` continues to use newest timestamp then ID ordering.
- Return no additional top-level fields. In particular, do not return provider metadata, token usage, raw extraction output, the model name, session identity, totals, or the session's pre-existing expenses.
- Preserve the existing safe JSON error envelope and `Cache-Control: no-store` behavior.
- Retire `501 classification_unavailable` as the prompt route's normal response. Once this phase is active, the route must not deliberately emit that code.

Error mapping for the prompt route:

| Status                      | Code                    | Condition                                                                                                                                                        |
| --------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | `invalid_request`       | Malformed JSON, invalid envelope, empty/oversized prompt, or unsupported locale                                                                                  |
| `401 Unauthorized`          | `session_not_found`     | Missing, invalid, or expired anonymous session                                                                                                                   |
| `409 Conflict`              | `expense_limit_reached` | The session has no expense slots before extraction begins                                                                                                        |
| `422 Unprocessable Content` | `no_expenses_extracted` | The provider returns a valid envelope but no candidate can be accepted                                                                                           |
| `503 Service Unavailable`   | `service_unavailable`   | OpenAI authentication, rate limit, timeout, network, model-availability, or structured-output failure; also operational Redis failure under the existing mapping |
| `500 Internal Server Error` | `internal_error`        | Unexpected application failure not represented above                                                                                                             |

- Public messages remain concise English fallbacks. They must not distinguish credential failure from rate limiting, expose provider status bodies, or include raw prompts, output, IDs, stack traces, or validation-library text.
- The client maps stable codes to localized English or Spanish feedback.

## Client behavior

- Continue submitting the exact draft and active locale through the existing mutation gate.
- Keep the capture input disabled while classification is pending and expose the existing localized loading feedback through the rat dialogue live region.
- Clear the input only after a `200` response containing at least one persisted expense.
- On partial success, use the same rat success message as an ordinary success with the same accepted count. Do not mention skipped or rejected candidates in the UI; then refresh categories and expenses so totals, list items, and the chart reflect authoritative Redis state.
- On `422 no_expenses_extracted`, show extraction-failure feedback, preserve the exact input, and allow correction or retry.
- On `409 expense_limit_reached`, `503 service_unavailable`, or `500 internal_error`, show recoverable localized error feedback, preserve the exact input, and do not refresh data as though a write succeeded.
- On `401 session_not_found`, preserve the exact draft while creating a fresh anonymous session and explaining that prior anonymous data expired according to the Phase 5 lifecycle behavior.
- Remove temporary user-facing copy that says automatic classification is “not available yet” when no runtime path uses it.
- Keep category and expense query ownership, shared refresh coordination, stale-response protection, alphabetical category display, and localized Unclassified presentation unchanged.

### API outcome and rat-dialogue mapping

The following table is developer documentation that maps transport outcomes to presentation. HTTP statuses and API error codes remain in the HTTP response for inspection through browser developer tools; they are never rat-dialogue content. The client converts them to a presentation state and localization key before rendering. A partial success is a success, not an error.

| HTTP outcome                   | API code / condition     | Rat state            | Detail key                    | Input    | Data refresh |
| ------------------------------ | ------------------------ | -------------------- | ----------------------------- | -------- | ------------ |
| `200` full success             | `rejectedCount === 0`    | `success`            | `successDetailOne` / `Many`   | Clear    | Yes          |
| `200` partial success          | `rejectedCount > 0`      | `success`            | `successDetailOne` / `Many`   | Clear    | Yes          |
| `400` correctable prompt       | `invalid_request`        | `extraction-failure` | `apiErrorInvalidRequest`      | Preserve | No           |
| `401` expired session          | `session_not_found`      | `provider-error`     | `apiErrorSessionNotFound`     | Preserve | Recover only |
| `409` full expense collection  | `expense_limit_reached`  | `provider-error`     | `apiErrorExpenseLimitReached` | Preserve | No           |
| `422` no accepted expenses     | `no_expenses_extracted`  | `extraction-failure` | `apiErrorNoExpensesExtracted` | Preserve | No           |
| `503` operational/provider     | `service_unavailable`    | `provider-error`     | `apiErrorServiceUnavailable`  | Preserve | No           |
| `500` unexpected application   | `internal_error`         | `provider-error`     | `apiErrorInternal`            | Preserve | No           |
| Non-API client/network failure | no trusted response code | `provider-error`     | `apiErrorUnknown`             | Preserve | No           |

The corresponding rendered copy is:

| Rat state / outcome            | English title and detail                                                              | Spanish title and detail                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Full success, one accepted     | **Done** — `{{count}} expense sorted.`                                                | **Listo** — `{{count}} gasto ordenado.`                                              |
| Full success, several accepted | **Done** — `{{count}} expenses sorted.`                                               | **Listo** — `{{count}} gastos ordenados.`                                            |
| Partial success                | Same accepted-count message as full success; no rejected-count message.               | Mismo mensaje de cantidad aceptada que el éxito completo; sin mensaje de rechazados. |
| `invalid_request`              | **I didn't understand :(** — The request was invalid. Check your input and try again. | **No entendí :(** — La solicitud no es válida. Revisá los datos e intentá de nuevo.  |
| `session_not_found`            | **Something went wrong** — This anonymous session expired. Starting a new session…    | **Algo salió mal** — Esta sesión anónima venció. Iniciando una nueva sesión…         |
| `expense_limit_reached`        | **Something went wrong** — This session has reached its 100-expense limit.            | **Algo salió mal** — Esta sesión alcanzó el límite de 100 gastos.                    |
| `no_expenses_extracted`        | **I didn't understand :(** — No expenses could be found in that description.          | **No entendí :(** — No se encontraron gastos en esa descripción.                     |
| `service_unavailable`          | **Something went wrong** — The service is temporarily unavailable. Try again.         | **Algo salió mal** — El servicio no está disponible por el momento. Probá de nuevo.  |
| `internal_error`               | **Something went wrong** — Something went wrong. Try again.                           | **Algo salió mal** — Algo salió mal. Probá de nuevo.                                 |
| Unknown client/network failure | **Something went wrong** — Something went wrong. Try again.                           | **Algo salió mal** — Algo salió mal. Probá de nuevo.                                 |

- Keep these messages in the typed i18next dictionaries; do not hard-code rendered copy in the component or API route.
- Never render an HTTP status number, API error code, provider error name, exception name, or raw server fallback message in the rat dialogue. Those diagnostic values remain available only at the transport/developer boundary.
- Pass the rat a UI-oriented state and localized message data rather than the raw API error object when rendering. The browser API layer may retain the stable code long enough to select that presentation.
- Announce the final success or error through the existing live region after the loading state settles.
- Do not expose `rejectedCount` through rat dialogue, another visible label, or an accessibility-only announcement. It remains part of the API response and can be inspected through browser developer tools.
- Remove the `skippedExpenses` localization entries when implementation no longer uses them.
- For `session_not_found`, show the mapped message while session bootstrap creates a replacement session. A successful bootstrap re-enables capture without clearing the preserved draft.
- Client-side empty and overlength validation remains attached to the input and prevents the request; it is not an API outcome in this table.

## Privacy, safety, and observability

- Send provider requests only from server code. The OpenAI API key and provider headers must never appear in client bundles, HTML, API responses, Storybook, test fixtures, or logs.
- Do not log raw visitor prompts, extracted descriptions, raw model output, session IDs, cookies, Redis keys, authorization headers, or provider response bodies.
- Operational logs may contain a coarse outcome code, duration, accepted count, rejected count, and provider/model identifier when useful, provided they contain no visitor or session data.
- Do not retain prompts or raw provider responses after the request. Persist only validated `ExpenseDto` records in the existing expiring Redis session.
- The model has no tools and no access to Redis, application routes, the network, files, secrets, or prior requests.
- Treat all model output as untrusted until both structural and domain validation pass.
- Keep safe error translation at the HTTP boundary. Provider-specific errors must not escape the AI adapter.
- Rate limiting, bot protection, moderation infrastructure, accounts, and durable audit history remain Phase 7 or later concerns.

## Testing and verification

- The default automated suite must mock the AI extraction boundary or `fetch`. It must not load a real OpenAI credential, contact OpenAI, consume quota, or depend on nondeterministic model text.
- Unit-test AI configuration parsing, including model whitespace trimming and rejection of empty values, without placing a usable credential in source or fixtures.
- Unit-test the single OpenAI request with mocked `fetch`, including provider failure, timeout, malformed output, and the absence of persistence after failed extraction.
- Unit-test prompt construction to prove that only the exact prompt, locale, and category names are supplied and that IDs, totals, expenses, and session data are absent.
- Unit-test structured output handling, category-name resolution, nullable fallback behavior, minor-unit validation, independent candidate rejection, order preservation, and rejected-count calculation.
- Route-test success, partial success, empty extraction, all-invalid extraction, full sessions, limited remaining capacity, missing/expired sessions, malformed requests, provider failures, timeouts, malformed structured output, Redis failures, and unexpected failures.
- Verify that a full session returns before the provider adapter is called.
- Verify that every failure path leaves Redis unchanged and that a successful partial batch persists exactly the returned accepted expenses.
- Verify that category deletion or staleness during persistence cannot create a dangling category reference.
- Component-test English and Spanish loading, success, partial-success, no-expense, limit, provider-error, retry, input-preservation, focus, live-region, and refresh behavior.
- Keep Storybook deterministic and provider-free. Use fixtures for capture states rather than issuing AI requests.
- Run formatting, lint, strict TypeScript, unit/component/mock-backed Redis tests, Storybook build, and the production build.
- Add a separately invoked live-provider integration test that is excluded from the default test command and CI. It reads the real server-only OpenAI settings, submits exactly one minimal prompt such as `Coffee $1.25` with locale `en`, and passes only when the configured model returns one schema-valid expense with `amountMinor: 125` and a non-empty description. It must skip with a clear message when live-test opt-in or credentials are absent and must never print the credential or raw provider response.
- Complete a manual development smoke test with a non-production OpenAI key for representative English and Spanish single- and multi-expense prompts, Unclassified fallback, partial capacity, provider failure, and synchronized dashboard refresh.
- Confirm through build output and browser inspection that no AI credential or server-only configuration reaches the client.

## Acceptance scenarios

The following are contract examples for deterministic mocked tests; they are not assertions about exact creative wording from a live model.

| ID      | Scenario                                                                | Expected result                                                                                                                          |
| ------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AI6-001 | Submit `Lunch $18, coffee $4.50 and taxi $12` with matching categories. | Three candidates are persisted in prompt order with amounts `1800`, `450`, and `1200`; recognized names resolve to current IDs.          |
| AI6-002 | Submit `Almuerzo $18, café $4,50 y taxi $12` with Spanish locale.       | Three candidates are extracted without translating the visitor's recognizable descriptions; decimal comma becomes minor units.           |
| AI6-003 | Submit several valid expenses with no real categories.                  | Every accepted expense is persisted with `categoryId: null`.                                                                             |
| AI6-004 | Return one known, one unknown, and one null category name.              | The known name resolves to its ID; the other two become Unclassified without candidate rejection.                                        |
| AI6-005 | Return valid and semantically invalid candidates together.              | Valid candidates persist in order, invalid candidates do not, and `rejectedCount` reports the invalid candidates.                        |
| AI6-006 | Leave two session slots and extract five valid candidates.              | The first two persist, the other three are rejected, and the response reports `rejectedCount: 3`.                                        |
| AI6-007 | Submit while the session is already full.                               | Return `409 expense_limit_reached`, preserve the draft, perform no Redis write, and make no provider call.                               |
| AI6-008 | Return an empty valid extraction result.                                | Return `422 no_expenses_extracted`, preserve the draft, and write nothing.                                                               |
| AI6-009 | Return an invalid structured provider response.                         | Return `503 service_unavailable`, expose no provider details, preserve the draft, and write nothing.                                     |
| AI6-010 | Time out, rate-limit, or fail authentication at OpenAI.                 | Return the same safe `503 service_unavailable` family and write nothing.                                                                 |
| AI6-011 | Expire the session before submission.                                   | Return `401 session_not_found` without a provider call; the browser preserves the draft while recovering the session.                    |
| AI6-012 | Complete a successful full or partial batch.                            | Clear the draft, show the ordinary localized success message for the accepted count, refresh both queries, and render synchronized data. |
| AI6-013 | Put instructions or URLs inside the visitor prompt or a category name.  | Treat them as untrusted classification data; no tool, fetch, disclosure, or alternate output behavior occurs.                            |
| AI6-014 | Run the automated suite without AI environment variables.               | Provider-free tests and Storybook pass; non-classification routes remain independently testable.                                         |
| AI6-015 | Mock a failed OpenAI request.                                           | Return one safe `503 service_unavailable`, preserve the draft, and write nothing.                                                        |
| AI6-016 | Mock malformed OpenAI structured output.                                | Return one safe `503 service_unavailable`, preserve the draft, and write nothing.                                                        |
| AI6-017 | Explicitly run the live-provider test with valid server-only settings.  | Send one minimal expense prompt to OpenAI and receive one schema-valid expense with the expected minor-unit amount.                      |

## Exclusions

- Model training, fine-tuning, embeddings, vector search, memory, conversational history, or personalized recommendations
- Client-side model calls, streaming UI, tool use, agents, model/provider fallback, or automatic repair calls
- Sending category descriptions, colors, totals, IDs, expense history, or other session data to the model
- Currency detection, conversion, exchange rates, mixed-currency storage, tax calculations, budgets, income, refunds, or recurring expenses
- Manual expense entry, editing descriptions or amounts, expense reclassification, or expense deletion
- Accounts, durable history, cross-device synchronization, shared sessions, or longer retention
- Rate limiting, bot protection, abuse dashboards, paid quota management, or production release work assigned to Phase 7
- Unrelated dashboard redesign, Redis schema changes, category renaming, manual category colors, or category descriptions

## Context and completion

- [Mission](../mission.md): defines multi-expense bilingual classification, graceful failure, transparent results, and the anonymous 48-hour demo boundary.
- [Roadmap](../roadmap.md): assigns live AI classification to Phase 6 and public safeguards/deployment to Phase 7.
- [Phase 5 requirements](../spec-phase-5-redesign/requirements.md): define the cookie session, Redis persistence, API DTOs, partial acceptance, error envelope, refresh coordinator, and placeholder prompt route that this phase completes.
- [Technical baseline](../techstack.md): selects OpenAI, `gpt-4.1-nano`, server-owned classification, and the provider-independent domain boundary.

Phase 6 is complete when the prompt endpoint performs live English and Spanish structured extraction through the configured OpenAI model; provider failures fail safely; server validation and Redis persistence satisfy full and partial-success contracts; failures preserve the draft and write nothing; the dashboard refreshes from authoritative API data; all automated gates remain provider-free and green; and a non-production live-provider smoke test confirms the intended workflow without exposing credentials or visitor data.
