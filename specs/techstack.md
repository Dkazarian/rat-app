# Ratapp Technical Baseline

## Project state

**Current state:** Greenfield. At constitution creation, the workspace contains the original UI sketch and these specification files; no application scaffold, dependency manifest, tests, deployment configuration, or Git repository exists.

**Target state:** A small full-stack web demo with a browser-rendered interface, a server-side OpenRouter boundary, and local browser persistence.

## Technical goals and constraints

- Keep the OpenRouter API key exclusively on the server.
- Accept several expenses in one request and validate model output before persistence.
- Keep the demo inexpensive to run; the initial model is a free OpenRouter model.
- Remain functional for category browsing, editing, and previously saved expenses when the AI provider is unavailable.
- Keep the UI responsive, keyboard-operable, and understandable without color alone.
- Optimize for a small demo codebase, not premature multi-user scalability.

## Runtime and languages

- **TypeScript** for client and server application code, with strict type checking.
- **Node.js active LTS** as the development and server runtime.
- **Modern evergreen browsers** as the client target.

Exact versions will be recorded in the generated lockfile when the application is scaffolded. Major-version upgrades require passing the existing quality gates.

## Frameworks and major dependencies

- **Next.js with the App Router** for the UI, server rendering where useful, and the server-side classification endpoint.
- **React** through Next.js for interactive state and components.
- **Tailwind CSS** for the responsive visual system and playful theme.
- **Recharts** for the donut/pie visualization, provided its rendered chart is paired with accessible textual totals and labels.
- **Zod** for runtime validation of API input, model output, and persisted data.

Use the platform `fetch` API for OpenRouter initially. Do not add an AI SDK unless direct HTTP handling becomes materially harder to maintain.

## Architecture

The initial application has three boundaries:

1. **Browser UI:** owns interaction state, selected locale, localized message dictionaries, category and expense editing, grouped lists, totals, chart rendering, and local persistence.
2. **Next.js classification route:** validates the submitted text and category choices, constructs the model request, calls OpenRouter, validates the response, and returns normalized expense candidates. It does not persist user data.
3. **OpenRouter:** performs extraction and category selection using the configured model.

Classification flow:

1. The browser sends the natural-language text, selected locale, and category IDs and names to the server route.
2. The route asks for structured output containing one item per expense: description, positive numeric amount, and a selected current category ID, with optional confidence/reason metadata.
3. The route validates items independently. It discards unusable items, normalizes unknown category IDs to `unclassified`, and returns success whenever at least one usable expense remains.
4. The browser ensures an **Unclassified** category exists when a normalized result needs it, persists the usable candidates, clears the textarea through the normal success flow, and shows success even when only part of the input was extracted.
5. If validation leaves no usable expenses, the browser persists nothing, shows the confused-rat error, and preserves the textarea content for correction or retry.
6. UI totals and chart data are derived from the same stored expense collection; no duplicate aggregate state is persisted.

## Data and persistence

Store categories, expenses, the selected locale, and a small schema version in browser `localStorage` for the initial demo.

Minimum category fields:

- Stable ID
- User-visible name
- Accessible color token
- Creation timestamp

On first-run provisioning, create five categories with stable initial IDs: `food`, `home`, `transport`, `fun`, and `unclassified`. Their initial English names are **Food**, **Home**, **Transport**, **Fun**, and **Unclassified**; Spanish-first provisioning uses **Comida**, **Casa**, **Transporte**, **Diversión**, and **Sin clasificar**. Each can be renamed, recolored, or deleted, and switching locale does not overwrite its persisted name. If `unclassified` has been deleted, recreate it with its default localized name and neutral color only when a later classification must normalize an unknown category.

Minimum expense fields:

- Stable ID
- Description
- Currency-neutral amount represented as integer minor units at two-decimal precision
- Category ID referencing a current category
- Creation timestamp
- Original input or batch reference sufficient to support review

Persistence rules:

- Validate and migrate local data before use; invalid records must not crash the app.
- Deleting a non-empty category requires confirmation and reassignment of its expenses. **Unclassified** is the default destination when it is not the deletion target; deleting a non-empty **Unclassified** category requires another current destination or clearing its expenses first.
- Renaming or recoloring a category preserves its ID and linked expenses.
- Storage provisioning creates the five defaults only for a new workspace. Validation and migration must not recreate a deleted default category; only classification-time unknown-category normalization may recreate `unclassified` on demand.
- Do not store the OpenRouter key, full provider responses, hidden prompts, or unnecessary model metadata in the browser.
- Clearing browser storage is an accepted limitation of this account-free demo.

## Interfaces and integration

### Classification endpoint

- Use a same-origin Next.js route under `/api/classify`.
- Accept `POST` only, with a bounded text payload and bounded category list.
- Return a discriminated success/error response; never return provider credentials or raw internal errors.
- Set a finite upstream timeout and return a retryable error when OpenRouter is unavailable or rate-limited.
- Validate response items independently and persist the usable subset when at least one item succeeds. A wholly malformed response or a response with zero usable expenses is an error and persists nothing.

### OpenRouter

- Read `OPENROUTER_API_KEY` from server-only environment configuration.
- Read `OPENROUTER_MODEL` from configuration, defaulting initially to `google/gemma-4-26b-a4b-it:free`.
- Request structured JSON output and still validate it locally; model output is untrusted input.
- Keep the model configurable because free-tier model availability, limits, and latency are external constraints.
- Provider logging and data-handling terms must be reviewed before using real sensitive financial descriptions. The first release is a demo and should tell users not to enter sensitive account data.

### Internationalization

- Support exactly two initial interface locales: English (`en`) and Spanish (`es`).
- Keep UI and rat-dialogue copy in complete, typed message dictionaries; user-visible application strings must not be scattered as hard-coded component text.
- Provide a compact two-position sliding segmented control with visible `EN` and `ES` choices and accessible names `English` and `Español`. It should update the interface immediately without navigation or reload.
- Implement the control semantically as two mutually exclusive named choices rather than an ambiguous unlabeled on/off switch. It must support keyboard operation and expose the selected language to assistive technology.
- Persist the user's language choice locally. On a first visit, provisionally select Spanish when the browser's preferred language begins with `es`; otherwise select English.
- Localize interface copy, labels, validation, chart text, accessible names, rat dialogue, recovery messages, and the initially provisioned category names. After provisioning, do not automatically translate persisted category names or expense descriptions.
- Accept natural-language expense input in either English or Spanish. Preserve the user's wording in the saved description unless normalization is required for a valid amount.
- Treat amounts as currency-neutral `$` units. The product does not store or infer whether `$` means US dollars, Argentine pesos, or another dollar-denominated interpretation, and it performs no conversion.
- Format the numeric portion through decimal-mode `Intl.NumberFormat` using the selected locale, then prefix exactly `$`. Do not use currency mode because it may render `US$`, `USD`, `ARS`, or another currency-specific marker.

## UI and design constraints

- Use a single-page dashboard: capture area first, category management and chart summary prominent, categorized expenses below or alongside them depending on viewport width.
- Display exactly `$` plus a locale-aware two-decimal number; store integer minor units rather than floating-point values.
- Provide loading, retry, empty, success, and error states for classification.
- Pair chart slices with a legend or textual category summary, and never communicate category identity by color alone.
- Give **Unclassified** a neutral default style and show it in lists, totals, and chart summaries like the other categories.
- Use the confused rat and error semantics when zero usable expenses are extracted; preserve the textarea exactly. Any non-empty usable subset uses the ordinary success dialogue and post-success textarea behavior without a separate partial-warning state.
- Respect reduced-motion preferences and maintain visible focus states and sufficient contrast.
- Use `public/assets/rat-mascot.png` as the official initial rat mascot source asset. It is a transparent PNG with minimal geometric styling and rat-specific proportions rather than mouse-like oversized ears and eyes.
- Treat the mascot artwork as a replaceable presentation asset with reserved placement and useful empty/error-state roles. A future approved human-drawn asset may replace it without an architecture change. Core actions, meaning, and layout must not depend on the artwork being available.
- Preserve the transparent source PNG. Generate optimized display derivatives during implementation only when required for performance; do not repeatedly recompress the source asset.
- Give informative mascot images appropriate alternative text; mark purely decorative appearances so assistive technology ignores them.
- Implement global success, error, warning, progress, and informational feedback through one reusable rat-dialogue component rather than generic banners or unrelated toast styles.
- Keep dialogue concise and actionable. Pair errors with a recovery action when one exists, and keep field-specific validation next to its field even when the rat also summarizes the problem.
- Use appropriate live-region semantics: non-urgent updates use status behavior, while blocking or failed actions use alert behavior. Do not auto-dismiss errors before they can be read.
- Communicate feedback type through wording and an explicit visual cue in addition to color. Responsive placement may move the rat and bubble, but must not cover primary controls or financial data.

## Testing and quality gates

- **Unit tests:** English and Spanish message completeness, locale-aware currency parsing/formatting, totals, grouping, default-category provisioning, deletion of every default including `unclassified`, on-demand `unclassified` recreation, category deletion reassignment, storage validation/migration, and model-response normalization.
- **Component tests:** language switching and persistence, localized rat dialogue, category management, successful subset persistence, complete-failure input preservation, correction of **Unclassified** expenses, error recovery, and synchronized list/chart summaries.
- **Route tests:** English and Spanish inputs, request validation, full success, partial usable success, unknown-category normalization to `unclassified`, zero-usable-item failure, timeout/rate-limit failure, and wholly malformed structured output.
- **End-to-end smoke test:** complete the core flow in one language, switch languages without losing state, submit expenses in the other language using a mocked provider response, correct one category, refresh, and verify locale persistence and totals.
- **Static gates:** formatting, linting, and strict TypeScript checks.
- **Accessibility check:** keyboard workflow, focus visibility, semantic labels, and automated accessibility scan of the primary view.

Exact test tools should be chosen during scaffolding from tools compatible with the selected Next.js version; the behaviors above are the durable requirement.

## Build, deployment, and operations

- Provide `.env.example` with variable names and safe instructions, never real credentials.
- Ensure the app can run locally with standard install, development, test, and production-build commands documented in the repository.
- Deployment must support Next.js server routes and encrypted environment variables; a static-only host is insufficient while OpenRouter is used.
- Log request outcome, latency, and a generated request ID on the server, but not raw expense text or API keys.
- Avoid analytics and third-party trackers in the initial demo.

## Engineering decisions and consequences

- **Local storage instead of a database:** minimizes setup and avoids account design, at the cost of single-browser data and no synchronization.
- **Server route instead of direct browser-to-OpenRouter calls:** protects credentials and centralizes validation, at the cost of requiring a server-capable deployment.
- **Configurable initial free model:** keeps the demo inexpensive and matches the chosen model, but the app must handle rate limits, availability changes, and weaker service guarantees.
- **Demo-friendly partial success:** usable extracted expenses are more valuable than all-or-nothing batch rejection. Invalid items are discarded, unknown categories normalize to **Unclassified**, and only zero-usable-item outcomes preserve the input and show an error.
- **Integer minor units:** prevents common floating-point errors while supporting standard two-decimal `$` amounts without assigning a currency code. A dataset is expected to use one consistent meaning of `$`; mixed-currency accounting is unsupported.

## Dependency policy

Prefer browser, React, and Next.js capabilities before adding packages. A new runtime dependency needs a clear responsibility, active maintenance, compatible licensing, and no duplication of an existing dependency. Changes to the framework, persistence model, AI provider, currency model, or deployment boundary are constitution-level decisions and require updating this file and affected roadmap or phase specs.
