# Ratapp Technical Baseline

## Target state

Ratapp is a small, publicly hosted classification demo with a browser-rendered React interface, a Redis-backed anonymous session API, a server-side OpenRouter boundary, and Storybook for isolated UI review. Categories and expenses live only in short-lived Redis sessions; language and transient feedback remain client state. Ratapp has no accounts or durable history.

The current implementation includes the Phase 5 anonymous Redis session API and API-backed dashboard. The former browser domain services and deterministic in-page capture batch have been removed. Classification/provider integration and public deployment remain planned for Phases 6 and 7. See the [roadmap](roadmap.md) for delivery status.

## Technical goals and constraints

- Migrate the approved HTML mockup faithfully before making intentional visual changes.
- Keep the OpenRouter API key exclusively on the server.
- Accept several expenses in one request and validate model output before adding results to the session.
- Keep categories and expenses authoritative in the anonymous session API; keep locale and transient feedback only in the running React page.
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
- **React** for components, fetched rendering snapshots, and transient interface state.
- **Tailwind CSS** for the responsive visual system.
- **Storybook** for isolated components, responsive compositions, and important UI states.
- **Recharts** for the donut or pie visualization, paired with accessible textual totals and labels.
- **i18next and react-i18next** for typed English and Spanish resources and locale switching.
- **Zod** for runtime validation of configuration, API input, and stored records.
- **Upstash Redis through the Vercel Marketplace** for expiring anonymous category and expense sessions shared across server instances, accessed server-side with `@upstash/redis`.

The Vercel integration injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` in deployed environments. Local development reads those server-only keys from `.env.development.local`. `RATAPP_REDIS_KEY_PREFIX` isolates environments and test runs, `RATAPP_SESSION_TTL_SECONDS` defaults to 86400, and `RATAPP_MAX_EXPENSES_PER_SESSION` defaults to 100. `.env.example` documents names and safe placeholders only, and no Redis credential uses a `NEXT_PUBLIC_*` prefix.

Phase 5 uses three Redis hashes per session under the configured environment prefix and shared `{sessionId}` cluster hash tag: `meta`, `categories`, and `expenses`. Totals are calculated at query time rather than stored. Transactions update category cascades atomically, and writes apply the configured TTL without renewing it on reads. Demo sessions allow at most 100 expenses, configured through `RATAPP_MAX_EXPENSES_PER_SESSION`; the endpoint sorts the bounded expense hash by server-assigned `createdAt` descending and expense ID ascending.

A development/test-only `npm run seed:redis` command creates ordinary test categories and assigns deterministic timestamped expenses through the same backend repository and invariants. It registers the resulting session as the active test seed. With `RATAPP_USE_SEEDED_SESSION=true` outside production, `POST /session` returns that seeded ID and sets its cookie instead of creating an empty session. The seeder reads local Upstash configuration from `.env.development.local`, refuses production, verifies its own read-back, and is never exposed as a public HTTP route.

The HTTP wire contract is independent of Redis storage. Category queries return real categories with literal names, colors, per-category totals, a separate Unclassified fallback total, and an overall total. The client sorts categories alphabetically for the active locale. Expense queries return stable IDs, literal descriptions, integer minor-unit amounts, nullable category IDs, and server-assigned millisecond timestamps in newest-first order. They do not duplicate category presentation fields or expose Redis ordering metadata. See the [Phase 5 requirements](spec-phase-5-redesign/requirements.md#query-object-contracts) for the exact TypeScript-shaped JSON contracts.

Use platform `fetch` for OpenRouter initially. Do not add an AI SDK unless direct HTTP handling becomes materially harder to maintain.

## Architecture

Ratapp separates feature UI from framework-independent domain logic and HTTP boundaries. Features group components, Hooks, selectors, and presentation helpers by product capability. Shared presentation lives in `src/components/common` and application framing in `src/components/layout`.

The Phase 5 backend rules are independent implementations of the product requirements and HTTP contract. The deleted `CategoryService`, `ExpenseService`, and `SessionService` browser classes are not wrapped or adapted. Focused category and expense query Hooks own their server snapshots; `usePageSession` carries only the returned session ID, readiness/error/retry, one page-wide mutation gate, and a refresh signal. Locale and draft/feedback state remain client-owned.

Domain operations depend on framework-independent contracts and helpers, never on features or React components. Feature Hooks depend on a browser API client rather than mutable domain services after Phase 5. Use interfaces at real external boundaries, including the browser session client and server-side AI provider client. No dependency-injection container, repository hierarchy, or global-state package is needed.

The Next.js App Router is the framework boundary. Pages and layouts remain Server Components by default. Add `"use client"` at the narrowest practical interactive boundary. Server-only classification code stays outside the client module graph, and route handlers translate HTTP input and output without containing reusable classification rules.

The application has four runtime boundaries:

1. **Browser UI:** `usePageSession` obtains and exposes the session ID. `DashboardPage` composes Capture Panel and `DashboardResults` directly rather than passing rendered elements through feature-specific layout props. Capture Panel uses the ID to post prompts; `DashboardResults` uses it to fetch categories once, sorts them alphabetically, and supplies Category Panel and Spending Summary; its nested Expense List uses the ID to fetch expenses independently. Category creation refreshes the shared categories query so both category views update together. Category deletion refreshes both queries because its server-side cascade can set expense category IDs to `null`. A shared mutation gate disables all writes while one is pending; queries may overlap. The page coordinator otherwise carries only session readiness and a refresh signal; pure selectors derive presentation values from each section's current response.
2. **Next.js session API:** resolves the anonymous session ID, loads and atomically updates its Redis record through a repository, enforces domain rules, and returns authoritative resources and category totals.
3. **Next.js classification route:** validates the HTTP request, delegates to server-only classification functions, and writes accepted results through the same server-side session boundary.
4. **OpenRouter:** performs extraction and category selection using the configured model.

Current source organization:

```text
src/
  app/                    Next.js route entry points and root layout
  components/
    common/               Shared presentation components
    layout/               Header, language control, app shell, footer
  features/
    categories/           Category UI, focused query Hook, colors, and view types
    expenses/             Expense UI, focused query Hook, and spending summary
    dashboard/            API client, page coordination, composition, and fixtures
  contracts/              Shared API wire contracts
  server/                 Domain rules, HTTP helpers, Redis repositories, and seeder
  i18n/                   Typed dictionaries and locale setup
  styles/                 Global Tailwind styles
  utils/                  Shared formatting and identifier helpers
  test/                   Shared test setup and helpers
```

The [source guide](../src/README.md) documents placement rules, contracts, and fixture ownership. Phase 6 will add live browser classification modules and server-only provider code behind the existing prompt endpoint. Tests and stories remain colocated with their implementations.

Storybook renders the browser components outside the live application using deterministic fixtures. It does not require OpenRouter.

Planned classification flow (Phase 6):

1. The browser sends natural-language text and the selected locale to `POST /session/:sessionId/expenses/prompt`; the path ID must match the anonymous session cookie.
2. The route validates a maximum 500-character message, resolves the session's maximum of ten categories, then requests structured expense output.
3. The route validates response items independently, converts valid amounts to integer minor units, and normalizes unknown category IDs to `null` (Unclassified).
4. If at least one usable item remains, the route returns it as success. The browser adds the items to the current session, clears the textarea, and reports **“Extracted X expenses.”**
5. If no usable item remains or the provider fails, the browser adds nothing and preserves the exact textarea content for correction or retry.
6. Accepted results are added to the server-owned session, and the browser refreshes its authoritative snapshots. Totals and chart data remain synchronized with those snapshots.

## Session data model

The server stores categories and expenses only in a bounded Upstash Redis session with a 24-hour write-time TTL that is not renewed by reads. A `Secure` cookie in production named `ratapp_session`, marked `HttpOnly`, `SameSite=Lax`, and `Path=/`, carries a UUID session identifier for reload resumption and has no persistent expiry; `POST /session` also returns that ID so components can use the explicit session routes. Category and expense IDs are also server-generated UUIDs. Application data is never stored in the cookie, `localStorage`, or IndexedDB. Closing the browser discards the session cookie, and Redis expiry removes abandoned data. Locale remains client-memory-only and resets on refresh.

Server-side domain operations replace changed records without mutating earlier records or caller input. Feature Hooks apply successful API results to React rendering snapshots; event handlers call API intentions rather than duplicating domain validation. Derive grouped results and chart data instead of storing synchronized client copies; category totals returned by the API remain authoritative.

Minimum category fields:

- Stable opaque category ID
- Literal user-visible name
- Accessible color token

Every Phase 5 production session starts with no categories and no expenses. Unclassified is represented only by `categoryId: null` on expenses and a separate fallback total; it has no category record, identifier, rename operation, or delete operation. Development/test seed fixtures create ordinary categories solely to exercise categorized expenses. The initial release does not support category renaming or manual recoloring.

Category rules:

- A session contains at most ten real categories; the Unclassified fallback bucket does not count toward this limit.
- Names are trimmed, non-empty, case-insensitively unique, and limited to 24 characters.
- New categories receive a color from a predefined accessible palette.
- The backend category-deletion operation sets affected expense category IDs to `null`, moves the category total to the Unclassified fallback total, and removes the real category atomically. Unclassified has no record or delete operation.

Minimum expense fields:

- Stable session ID
- Concise description
- Currency-neutral amount represented as integer minor units at two-decimal precision
- Category ID referencing a current real category, or `null` for the Unclassified fallback bucket
- Server-assigned `createdAt` Unix timestamp in milliseconds

The initial release supports reclassification and deletion, but not description or amount editing or manual expense entry.

## Classification interface

### Request

- Same-origin `POST /session/:sessionId/expenses/prompt`; reject other methods at that route.
- Resolve current categories from the anonymous server session and accept the selected locale plus a non-empty prompt of no more than 500 characters.
- Accept amounts written with or without `$`.
- Validate the ten-category and 24-character category-name bounds again on the server.

### Response

- Return a discriminated success or error response.
- For each valid candidate, return a concise description, positive integer minor-unit amount, and current category ID.
- Validate candidates independently and return any non-empty usable subset as ordinary success.
- Normalize unknown category IDs to `null` (Unclassified).
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
- Switch immediately without navigation or reload and without losing the current anonymous session.
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

- **Unit tests:** service operations and typed errors, independent candidate validation, session isolation and snapshot synchronization, amount formatting, grouping, totals, and chart selectors. Add provider response normalization tests with Phase 6.
- **Component tests:** user-visible behavior through rendered components, including language switching, category creation/deletion, fixture and live classification success, zero-result input preservation, provider-error retry, reclassification, deletion, and synchronized chart updates. Avoid asserting Hook or component implementation details.
- **Route tests (Phase 6):** request validation, English and Spanish input, full and partial success, unknown-category normalization, zero usable items, malformed output, timeout, and rate limiting.
- **Storybook review:** principal component variants and responsive page states in English and Spanish.
- **End-to-end smoke test:** create a category, capture the deterministic demo batch, reclassify and delete results, delete a populated category, switch language, verify chart updates, refresh and verify session resumption, then verify browser-close/expiry reset behavior. Add a mocked provider when the classification boundary exists.
- **Static gates:** formatting, linting, strict TypeScript, and production build.
- **Accessibility:** keyboard workflow, focus visibility, semantic labels, live feedback, textual chart equivalents, and automated scan of the primary view.

## Build, deployment, and operations

- Provide `.env.example` with variable names and safe instructions, never credentials.
- Load local Redis keys from `.env.development.local` and keep all Redis configuration outside the client module graph.
- Return `Cache-Control: no-store` from every session route so session responses are not reused by browser or intermediary caches.
- Document install, development, Storybook, test, production-build, and deployment commands.
- Deploy on Vercel with server-side environment variables and support for the Next.js route.
- Apply anonymous rate limiting appropriate to a public demo without introducing user accounts.
- Log generated request ID, outcome, and latency, but not raw input, response content, or secrets.
- Do not add analytics or third-party trackers to the initial release.

## Engineering decisions and consequences

- **Expiring Redis sessions instead of durable history:** support API-backed workflows across server instances and refresh recovery while keeping the demo anonymous and ensuring abandoned sessions disappear through TTL expiry.
- **Storybook before behavior:** makes the approved HTML migration inspectable and separates visual parity from later product logic.
- **Interactive fixtures before live AI:** validates session behavior, correction, totals, and chart synchronization without provider variability.
- **Server route instead of browser-to-provider calls:** protects credentials and centralizes validation, at the cost of requiring server-capable deployment.
- **Configurable model:** accommodates provider availability and pricing changes without coupling the UI to one model.
- **Partial usable success:** adds all valid candidates and reports their count; only a zero-usable result preserves the input and shows failure.
- **Integer minor units:** avoids floating-point errors while preserving currency-neutral `$` display.

## Dependency policy

Prefer browser, React, and Next.js capabilities before adding packages. A runtime dependency needs a clear responsibility, active maintenance, compatible licensing, and no duplication of an existing dependency. Changes to the framework, session-only data model, AI provider boundary, currency model, or public deployment model require updating this baseline and affected roadmap or phase specifications.

Prefer plain TypeScript modules over architectural framework packages. Do not add dependency-injection containers, repository frameworks, global-state libraries, or form libraries solely to reproduce patterns familiar from server-side object-oriented applications.
