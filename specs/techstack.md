# Ratapp Technical Baseline

## Target state

Ratapp is a small, publicly hosted classification demo with a browser-rendered React interface, a server-side OpenRouter boundary, Storybook for isolated UI review, and session-only client state. It does not persist categories, expenses, or language choices.

## Technical goals and constraints

- Migrate the approved HTML mockup faithfully before making intentional visual changes.
- Keep the OpenRouter API key exclusively on the server.
- Accept several expenses in one request and validate model output before adding results to the session.
- Keep categories, expenses, locale, and feedback state only in the running React page.
- Remain functional for browsing and editing current-session results when the AI provider is unavailable.
- Keep the UI responsive, keyboard-operable, and understandable without color alone.
- Bound and rate-limit the anonymous public classification endpoint.
- Optimize for a convincing demo and reviewable component system, not production finance infrastructure.

## Runtime and languages

- **TypeScript** for client and server code, with strict type checking.
- **Node.js active LTS** for development and server execution.
- **Modern evergreen browsers** as the client target.

Exact versions are recorded in the generated lockfile. Major-version upgrades require passing the existing quality gates.

## Frameworks and major dependencies

- **Next.js with the App Router** for the React interface and same-origin classification route.
- **React** for components and in-memory session state.
- **Tailwind CSS** for the responsive visual system.
- **Storybook** for isolated components, responsive compositions, and important UI states.
- **Recharts** for the donut or pie visualization, paired with accessible textual totals and labels.
- **Zod** for runtime validation of API input and model output.

Use platform `fetch` for OpenRouter initially. Do not add an AI SDK unless direct HTTP handling becomes materially harder to maintain.

## Architecture

Ratapp uses an idiomatic React and Next.js feature-oriented architecture. Code is grouped by product capability, with components, hooks, types, and pure behavior kept close to the feature that owns them. Shared modules are introduced only when more than one feature genuinely uses them.

Use function components and Hooks rather than class components, controller classes, or view-model classes. Keep synchronous business rules—such as category validation, color assignment, amount normalization, grouping, and totals—in pure TypeScript functions. Use discriminated unions for expected outcomes and validation failures instead of exception-based control flow.

Interactive browser state belongs in React. A feature Hook or reducer coordinates category and expense state and exposes intention-revealing operations to presentation components. Components receive data and callbacks through props and do not import storage implementations. Context is reserved for state that must be shared across a broad subtree; do not introduce a third-party state library until React state, reducers, and context are demonstrably insufficient.

Use interfaces at real external boundaries, such as the browser classification client and the server-side AI provider client. Do not create service and repository class hierarchies for in-memory React state. A small factory or plain object may implement an interface when dependency substitution materially improves tests. Dependency injection is ordinary function arguments, props, or provider values rather than a container or framework.

The Next.js App Router is the framework boundary. Pages and layouts remain Server Components by default. Add `"use client"` at the narrowest practical interactive boundary. Server-only classification code stays outside the client module graph, and route handlers translate HTTP input and output without containing reusable classification rules.

The application has three runtime boundaries:

1. **Browser UI:** a Client Component feature boundary owns the current categories, expenses, selected locale, and rat feedback in React memory. Pure selectors derive grouped lists, totals, and chart data from that state.
2. **Next.js classification route:** a thin route handler validates the HTTP request, delegates to server-only classification functions, and maps the result to a safe HTTP response. It is stateless.
3. **OpenRouter:** performs extraction and category selection using the configured model.

Recommended source organization:

```text
src/
  app/                    Next.js routes, layouts, and composition
  features/
    categories/           Category types, rules, Hook, and components
    expenses/             Expense types, rules, Hook integration, and components
    classification/       Browser client and shared request/response contracts
    spending/             Pure selectors and visual presentation
  server/
    classification/       Server-only orchestration and provider client
  i18n/                   Typed dictionaries and locale setup
  components/             Truly shared presentation primitives
  test/                   Shared test setup and helpers
```

This layout is a direction, not a requirement to create empty folders or split small cohesive files prematurely. Features may begin in the existing component structure and move when behavior makes the ownership boundary useful.

Storybook renders the browser components outside the live application using deterministic fixtures. It does not require OpenRouter.

Classification flow:

1. The browser sends natural-language text, the selected locale, and the current category IDs and names to `/api/classify`.
2. The route validates a maximum 500-character message and a maximum of ten categories, then requests structured expense output.
3. The route validates response items independently, converts valid amounts to integer minor units, and normalizes unknown category IDs to permanent `unclassified`.
4. If at least one usable item remains, the route returns it as success. The browser adds the items to the current session, clears the textarea, and reports **“Extracted X expenses.”**
5. If no usable item remains or the provider fails, the browser adds nothing and preserves the exact textarea content for correction or retry.
6. Totals and chart data are always derived from the same in-memory expense collection.

## Session data model

No application data is written to `localStorage`, IndexedDB, cookies, a database, or another persistence service. Refreshing or closing the page discards all categories, expenses, and locale changes.

Represent the session with immutable TypeScript values updated through React state or a reducer. Event handlers call feature operations; they do not duplicate domain validation. Derive totals, grouped results, and chart data instead of storing synchronized copies of those values.

Minimum category fields:

- Stable session ID
- User-visible name
- Accessible color token
- System-category flag for permanent `unclassified`

Every session starts with stable IDs for `food`, `home`, `transport`, and `unclassified`. **Unclassified** cannot be renamed or deleted. Other initial and user-created categories may be deleted. The initial release does not support category renaming or manual recoloring.

Category rules:

- A session contains at most ten categories, including **Unclassified**.
- Names are trimmed, non-empty, case-insensitively unique, and limited to 24 characters.
- New categories receive a color from a predefined accessible palette.
- Deleting a category moves all its expenses to `unclassified` before removing it.

Minimum expense fields:

- Stable session ID
- Concise description
- Currency-neutral amount represented as integer minor units at two-decimal precision
- Category ID referencing a current category

The initial release supports reclassification and deletion, but not description or amount editing or manual expense entry.

## Classification interface

### Request

- Same-origin `POST /api/classify`; reject other methods.
- Accept selected locale, current category IDs and names, and a non-empty message of no more than 500 characters.
- Accept amounts written with or without `$`.
- Validate the ten-category and 24-character category-name bounds again on the server.

### Response

- Return a discriminated success or error response.
- For each valid candidate, return a concise description, positive integer minor-unit amount, and current category ID.
- Validate candidates independently and return any non-empty usable subset as ordinary success.
- Normalize unknown category IDs to `unclassified`.
- Return a recoverable error for zero usable candidates, timeouts, rate limits, malformed provider output, and provider unavailability.
- Never return credentials, hidden prompts, raw provider output, or internal errors.

### OpenRouter

- Read `OPENROUTER_API_KEY` from server-only environment configuration.
- Read `OPENROUTER_MODEL` from configuration so model availability can change without a code change.
- Request structured JSON and treat all model output as untrusted input.
- Set a finite upstream timeout and apply anonymous rate limiting before provider calls.
- Do not log raw expense text or unnecessary model data.
- Tell visitors concisely that submitted text is sent to an external AI provider and should not contain sensitive account information.

## Internationalization

- Support exactly English (`en`) and Spanish (`es`).
- Keep all application and rat-dialogue copy in complete typed message dictionaries.
- Use the two-position `EN`/`ES` control represented by the approved mockup, with accessible names **English** and **Español**.
- Switch immediately without navigation or reload and without losing the current in-memory session.
- The locale resets on refresh; do not persist it or infer it from stored state.
- Accept expense input in either language and produce a concise description in the language of the input or selected interface.
- Display amounts as exactly `$` plus a locale-aware two-decimal number. Do not infer or store a currency code.

## UI and Storybook constraints

- Treat `docs/ui-mockup.html` as the visual source of truth for the initial React migration.
- First reproduce the approved layout and states closely; review intentional design changes separately afterward.
- Decompose the page into reusable, prop-driven components with stories for meaningful variants rather than reproducing one monolithic component.
- Cover representative English and Spanish, desktop and narrow, empty, loading, success, and error states in Storybook.
- Use a single-page dashboard with capture, category management, chart summary, and categorized results.
- Pair chart slices with a legend or textual category summary and never communicate category identity by color alone.
- Use `public/assets/rat-mascot.png` and approved state variants without making core meaning depend on artwork.
- Implement global feedback through one reusable rat-dialogue component. Keep field-specific validation beside its field.
- Respect reduced-motion preferences, visible focus, sufficient contrast, and appropriate live-region semantics.

## Testing and quality gates

- **Unit tests:** pure category and expense rules, reducer transitions, amount normalization, response normalization, grouping, totals, and chart selectors.
- **Component tests:** user-visible behavior through rendered components, including language switching, category creation/deletion, fixture and live classification success, zero-result input preservation, provider-error retry, reclassification, deletion, and synchronized chart updates. Avoid asserting Hook or component implementation details.
- **Route tests:** request validation, English and Spanish input, full and partial success, unknown-category normalization, zero usable items, malformed output, timeout, and rate limiting.
- **Storybook review:** principal component variants and responsive page states in English and Spanish.
- **End-to-end smoke test:** create a category, submit multiple expenses through a mocked provider, reclassify and delete results, delete a populated category, switch language, verify chart updates, refresh, and verify a clean reset.
- **Static gates:** formatting, linting, strict TypeScript, and production build.
- **Accessibility:** keyboard workflow, focus visibility, semantic labels, live feedback, textual chart equivalents, and automated scan of the primary view.

## Build, deployment, and operations

- Provide `.env.example` with variable names and safe instructions, never credentials.
- Document install, development, Storybook, test, production-build, and deployment commands.
- Deploy on Vercel with server-side environment variables and support for the Next.js route.
- Apply anonymous rate limiting appropriate to a public demo without introducing user accounts.
- Log generated request ID, outcome, and latency, but not raw input, response content, or secrets.
- Do not add analytics or third-party trackers to the initial release.

## Engineering decisions and consequences

- **Memory instead of persistence:** keeps the demo honest and simple; refresh intentionally resets all work.
- **Storybook before behavior:** makes the approved HTML migration inspectable and separates visual parity from later product logic.
- **Interactive fixtures before live AI:** validates session behavior, correction, totals, and chart synchronization without provider variability.
- **Server route instead of browser-to-provider calls:** protects credentials and centralizes validation, at the cost of requiring server-capable deployment.
- **Configurable model:** accommodates provider availability and pricing changes without coupling the UI to one model.
- **Partial usable success:** adds all valid candidates and reports their count; only a zero-usable result preserves the input and shows failure.
- **Integer minor units:** avoids floating-point errors while preserving currency-neutral `$` display.

## Dependency policy

Prefer browser, React, and Next.js capabilities before adding packages. A runtime dependency needs a clear responsibility, active maintenance, compatible licensing, and no duplication of an existing dependency. Changes to the framework, session-only data model, AI provider boundary, currency model, or public deployment model require updating this baseline and affected roadmap or phase specifications.

Prefer plain TypeScript modules over architectural framework packages. Do not add dependency-injection containers, repository frameworks, global-state libraries, or form libraries solely to reproduce patterns familiar from server-side object-oriented applications.
