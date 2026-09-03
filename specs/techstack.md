# Ratapp Technical Baseline

## Target state

Ratapp is a small, publicly hosted classification demo with a browser-rendered React interface, a server-side OpenRouter boundary, Storybook for isolated UI review, and session-only client state. It does not persist categories, expenses, or language choices.

The current implementation covers the dashboard and in-memory domain services through Phase 4.5. Capture uses a deterministic demo batch; the classification API, provider integration, and public deployment described below remain planned work for Phases 5 and 6. See the [roadmap](roadmap.md) for delivery status.

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
- **i18next and react-i18next** for typed English and Spanish resources and locale switching.
- **Zod (planned for Phase 5)** for runtime validation of API input and model output; it is not currently installed.

Use platform `fetch` for OpenRouter initially. Do not add an AI SDK unless direct HTTP handling becomes materially harder to maintain.

## Architecture

Ratapp separates feature UI from framework-independent services. Features group components, Hooks, selectors, and presentation helpers by product capability. Category and expense services, domain types, and typed errors live in `src/services`, outside features and components. Shared presentation lives in `src/components/common` and application framing in `src/components/layout`.

Use function components and Hooks for React UI. `CategoryService` and `ExpenseService` own in-memory collections in private Maps and enforce domain validation. `SessionService` coordinates their business workflows. Individual operations throw typed errors; expense batch addition returns accepted records and per-candidate errors. Selectors, display mapping, and the React snapshot reducer remain pure. This extends the [Phase 4.5 requirements](spec-phase-4-5-service-refactor/requirements.md) with a small session service; the historical specification describes the earlier Hook coordination and reciprocal service wiring.

Each mounted dashboard session creates one `SessionService`, which owns a private category/expense pair. It assigns missing capture IDs and validates category deletion before reassigning expenses and deleting the category. `CategoryService` handles category-only rules without a reference to expenses; `ExpenseService` retains a one-way dependency for category lookup. `usePageSession` maintains a category rendering snapshot and an expense/input/feedback reducer, updating them from completed service results. `useCategories` remains for standalone category examples. Category and expense presentation components receive data and callbacks through props. Locale state remains in the i18n provider. Dashboard sessions never share the standalone default collections.

Services depend on domain contracts and framework-independent helpers, never on features, React components, or route code. Feature Hooks depend on services. Use interfaces at real external boundaries, such as the future browser classification client and server-side AI provider client. Inject service instances, initial values, and identifier factories through ordinary arguments and props. No dependency-injection container, repository hierarchy, or global-state package is needed.

The Next.js App Router is the framework boundary. Pages and layouts remain Server Components by default. Add `"use client"` at the narrowest practical interactive boundary. Server-only classification code stays outside the client module graph, and route handlers translate HTTP input and output without containing reusable classification rules.

The target application has three runtime boundaries; only the browser boundary is currently implemented:

1. **Browser UI:** dashboard-scoped services own categories and expenses; React maintains rendering snapshots, input, locale, and feedback. Pure selectors derive grouped lists, totals, and chart data from the current snapshots.
2. **Next.js classification route:** a thin route handler validates the HTTP request, delegates to server-only classification functions, and maps the result to a safe HTTP response. It is stateless.
3. **OpenRouter:** performs extraction and category selection using the configured model.

Current source organization:

```text
src/
  app/                    Next.js route entry points and root layout
  components/
    common/               Shared presentation components
    layout/               Header, language control, app shell, footer
  features/
    categories/           Category UI, Hooks, colors, and display mapping
    expenses/             Expense UI, spending summary, selectors, and mapping
    dashboard/            Page composition, Hooks, contracts, and fixtures
  services/
    categories/           Category service, domain types, errors, and tests
    expenses/             Expense service, domain types, errors, and tests
    session/              Session workflows, capture contracts, and tests
  i18n/                   Typed dictionaries and locale setup
  styles/                 Global Tailwind styles
  utils/                  Shared formatting and identifier helpers
  test/                   Shared test setup and helpers
```

The [source guide](../src/README.md) documents placement rules, contracts, and fixture ownership. Add `app/api/classify`, browser classification modules, and server-only provider code when Phase 5 needs them; do not create empty placeholder folders. Tests and stories remain colocated with their implementations.

Storybook renders the browser components outside the live application using deterministic fixtures. It does not require OpenRouter.

Planned classification flow (Phase 5):

1. The browser sends natural-language text, the selected locale, and the current category IDs and names to `/api/classify`.
2. The route validates a maximum 500-character message and a maximum of ten categories, then requests structured expense output.
3. The route validates response items independently, converts valid amounts to integer minor units, and normalizes unknown category IDs to permanent `unclassified`.
4. If at least one usable item remains, the route returns it as success. The browser adds the items to the current session, clears the textarea, and reports **“Extracted X expenses.”**
5. If no usable item remains or the provider fails, the browser adds nothing and preserves the exact textarea content for correction or retry.
6. Totals and chart data are always derived from the same in-memory expense collection.

## Session data model

No application data is written to `localStorage`, IndexedDB, cookies, a database, or another persistence service. Refreshing or closing the page discards all categories, expenses, and locale changes.

Services store readonly domain values, replacing changed records without mutating earlier records or caller input. Feature Hooks apply successful service results to React rendering snapshots; the reducer contains no service mutations. Event handlers call session actions rather than duplicating domain validation. Derive totals, grouped results, and chart data instead of storing synchronized copies of those values.

Minimum category fields:

- Stable session ID
- User-visible name
- Accessible color token
- System-category flag for permanent `unclassified`

Every live session starts with permanent `unclassified` and no expenses. Unclassified is the only system category and is initialized by the category service constructor. Stories and tests may explicitly seed `food`, `home`, and `transport` as ordinary custom categories whose literal names do not change with the locale. Those names are available for user-created categories; only the English and Spanish names of Unclassified remain reserved. **Unclassified** cannot be renamed or deleted. Other initial and user-created categories may be deleted. The initial release does not support category renaming or manual recoloring.

Category rules:

- A session contains at most ten categories, including **Unclassified**.
- Names are trimmed, non-empty, case-insensitively unique, and limited to 24 characters.
- New categories receive a color from a predefined accessible palette.
- `SessionService.deleteCategory` validates the target, reassigns expenses to `unclassified`, and deletes the category synchronously before returning. Sessions must use this operation for cross-collection consistency. Direct `CategoryService.delete` enforces category-only rules and is suitable for standalone category examples; permanent `unclassified` cannot be deleted.

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
- Display amounts as `$` followed by an ungrouped number with a `.` decimal separator and exactly two fractional digits in both English and Spanish (for example, `$1285.50`). Do not infer or store a currency code.

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

- **Unit tests:** service operations and typed errors, independent candidate validation, session isolation and snapshot synchronization, amount formatting, grouping, totals, and chart selectors. Add provider response normalization tests with Phase 5.
- **Component tests:** user-visible behavior through rendered components, including language switching, category creation/deletion, fixture and live classification success, zero-result input preservation, provider-error retry, reclassification, deletion, and synchronized chart updates. Avoid asserting Hook or component implementation details.
- **Route tests (Phase 5):** request validation, English and Spanish input, full and partial success, unknown-category normalization, zero usable items, malformed output, timeout, and rate limiting.
- **Storybook review:** principal component variants and responsive page states in English and Spanish.
- **End-to-end smoke test:** create a category, capture the deterministic demo batch, reclassify and delete results, delete a populated category, switch language, verify chart updates, refresh, and verify a clean reset. Add a mocked provider when the classification boundary exists.
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
