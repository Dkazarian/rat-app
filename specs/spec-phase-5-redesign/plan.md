# Phase 5 Plan — Redesign

Status: complete. Groups 1–10 are implemented and verified.

## Execution rules

- [x] Implement each behavior from a failing automated test where practical, then keep the focused test and existing suite green while refactoring.
- [x] Treat `requirements.md` as authoritative. Update the requirement, this plan, and affected tests together if an API, Redis, or component contract changes.
- [x] Build the backend rules from the Phase 5 contracts. Do not adapt, import, move, or wrap the current browser service implementations.
- [x] Keep production session initialization empty. Seed categories and expenses only through the explicit non-production Redis seeder workflow.
- [x] Permit only one client mutation at a time through the shared page mutation gate. Do not add server revisions, optimistic concurrency, or compare-and-set behavior.
- [x] Keep every Redis credential and operation server-only. Never expose `KV_REST_API_URL`, `KV_REST_API_TOKEN`, raw Redis errors, session IDs in logs, or seeded expense text.
- [x] Do not connect OpenRouter or implement classification in Phase 5. The prompt route returns the specified unavailable response until Phase 6.

## Group 1 — Establish shared API contracts and configuration

- [x] Add shared TypeScript wire types for `CategoryDto`, `CategoriesResponse`, `ExpenseDto`, `ExpensesResponse`, mutation responses, and `ApiErrorResponse` without importing deleted service types. (Query object contracts, Error contract)
- [x] Add Zod schemas for route parameters, request bodies, stored Redis records, environment configuration, and response-shaping boundaries. (API contract, Server safety)
- [x] Add server-only configuration for `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `RATAPP_REDIS_KEY_PREFIX`, `RATAPP_SESSION_TTL_SECONDS`, `RATAPP_MAX_EXPENSES_PER_SESSION`, and `RATAPP_USE_SEEDED_SESSION`. (Redis store)
- [x] Default the TTL to 86400 seconds and the expense cap to 100; reject unsafe, missing, malformed, or production seed-mode configuration at startup/use boundaries. (Redis store, Seeder)
- [x] Document safe placeholders and development values in `.env.example` while retaining real local values only in `.env.development.local`. (Redis store)
- [x] Add server-only UUID helpers using `crypto.randomUUID()` and strict canonical UUID validation for session, category, and expense IDs. (Session transport, Server safety)
- [x] Add one response helper that applies the stable error envelope and `Cache-Control: no-store` to all session responses. (Error contract, API contract)
- [x] Add `@upstash/redis` and only the minimal supporting runtime/development dependencies required by the selected validation and seed-command approach. (Redis store, Dependency policy)

## Group 2 — Rewrite backend domain behavior

- [x] Define backend session, real-category, expense, totals, and seed-fixture models independently of React and the old service classes. (Objective, Removal)
- [x] Create an empty production session with no categories, no expenses, and an Unclassified fallback total of zero. (Session creation)
- [x] Implement category-name trimming, non-empty and 24-character validation, case-insensitive uniqueness, ten-real-category limit, accessible palette assignment, and reservation of only `Unclassified` and `Sin clasificar`. (Category creation)
- [x] Keep Food, Home, and Transport available as ordinary category names. (Category creation)
- [x] Assign category and expense UUIDs on the server and assign each new expense a server-controlled `createdAt` Unix-millisecond timestamp. (Identifiers, Expense contract)
- [x] Implement expense validation, the 100-expense cap, and nullable category normalization; calculate real-category and Unclassified totals when categories are queried. (Prompt contract, Query totals)
- [x] Implement expense reclassification while preserving ID, description, amount, and `createdAt`. (Expense reclassification)
- [x] Implement expense deletion; the next category query recalculates its totals. (Expense deletion)
- [x] Implement real-category deletion by setting affected expense category IDs to `null` and removing the real category atomically. (Category deletion)
- [x] Produce categories without server display ordering and expenses ordered by `createdAt` descending then expense UUID ascending. (Query contracts)

## Group 3 — Implement the Upstash Redis repository

- [x] Create one server-only Upstash client from the Vercel-provided REST configuration. (Redis store)
- [x] Implement validated key builders using `<prefix>:session:v1:{sessionId}:meta`, `categories`, and `expenses`; never interpolate an unvalidated ID or prefix. (Redis key model)
- [x] Split direct session-ID, category, and expense operations into three small Redis repositories without a session snapshot abstraction. (Redis repositories)
- [x] Store real categories and expenses as independently writable hash fields and avoid a whole-session JSON value or stored totals. (Redis data model)
- [x] Apply a simple 24-hour TTL when each Redis key is created or written; use `meta` as the existence authority and do not renew TTLs on reads. (Redis expiry)
- [x] Use an atomic Upstash transaction for category deletion. No concurrent-writer resolution is added. (Redis atomicity, No concurrency)
- [x] Implement query shaping that reads Redis values, validates stored data, calculates category totals, and applies the required client-independent ordering. (Query contracts)
- [x] Return the stable `service_unavailable` response for safe operational Redis failures and keep provider details server-only. (Error contract)
- [x] Add integration coverage against the configured Upstash development/test database for TTL, multi-key atomicity, environment prefix isolation, stored-schema rejection, and repository round trips. (Redis verification)

## Group 4 — Implement session identity and HTTP route boundaries

- [x] Add `POST /session` at `src/app/session/route.ts`. Resume a valid cookie-backed session or create a new empty session, return its UUID, and set the `ratapp_session` browser-session cookie. (Session transport)
- [x] In non-production seed mode, resolve the active seed pointer, verify the seeded session, return it with `200 OK`, and set the matching cookie instead of creating a new session. (Seeder session mode)
- [x] Reject seed mode in production and return `seed_session_unavailable` when the configured non-production seed pointer is missing or expired. (Seeder safety)
- [x] Add a small helper that validates the path UUID and checks that its Redis session exists. The cookie is used only by `POST /session` for resume behavior. (Session lookup)
- [x] Ensure all session routes return `Cache-Control: no-store`, safe JSON errors, bounded bodies, and no identifiers or raw input in logs. (HTTP safety)

## Group 5 — Implement category and expense routes

- [x] Add `GET /session/:sessionId/categories` returning real categories, `unclassifiedTotalMinor`, and `totalMinor` according to `CategoriesResponse`. (Category query)
- [x] Add `POST /session/:sessionId/categories` accepting `{ name }` and returning `{ category }` with `201 Created`. (Category creation)
- [x] Add `DELETE /session/:sessionId/categories/:categoryId` for real categories only; return `204 No Content` after the atomic cascade. (Category deletion)
- [x] Add `GET /session/:sessionId/expenses` returning all bounded expenses in newest-`createdAt` order. (Expense query)
- [x] Add `PUT /session/:sessionId/expenses/:expenseId/category` accepting `{ categoryId: string | null }` and returning `{ expense }`. (Expense reclassification)
- [x] Add `DELETE /session/:sessionId/expenses/:expenseId` returning `204 No Content`. (Expense deletion)
- [x] Add `POST /session/:sessionId/expenses/prompt`; validate the session and body, then return `501 classification_unavailable` without creating an expense or calling an extractor/provider. (Phase 5 prompt boundary)
- [x] Cover every route with request/response tests for success, malformed bodies and UUIDs, missing or expired sessions, limits, reserved names, Redis failure mapping, cookie behavior, no-store headers, and absence of leaked internals. (API and error contracts)

## Group 6 — Add the deterministic Redis seeder

- [x] Add a repository-level `npm run seed:redis` command and TypeScript entry point that loads `.env.development.local` safely. (Seeder command)
- [x] Create a deterministic backend fixture with several ordinary categories, multiple categorized expenses, one zero-total category, at least one `categoryId: null` expense, and fixed server-style timestamps below the 100-expense cap. (Seeder fixture)
- [x] Seed categories before expenses and resolve seeded expense references to the generated/fixture category UUIDs. (Seeder referential integrity)
- [x] Replace only the selected session family, renew its TTL, and register `<prefix>:seed:v1:active-session` with the same TTL. (Seeder persistence)
- [x] Support an optional validated `--session-id <uuid>` and otherwise generate a UUID. Never delete by a broad prefix or touch another environment's keys. (Seeder safety)
- [x] Refuse production, reject unsafe prefixes/configuration, and avoid printing credentials or fixture expense text. (Seeder safety)
- [x] Read the seeded session back through the repository and fail if totals, nullable/category references, timestamps, count, or overall total differ from the fixture. (Seeder verification)
- [x] Test deterministic replacement, pointer registration/expiry, environment refusal, exact-session scoping, and successful reads through both query routes. (Seeder tests)

## Group 7 — Add browser API clients and focused Hooks

- [x] Add a small browser session API client that URL-encodes UUID path parameters, sends JSON, includes same-origin credentials, parses the stable success/error contracts, and never reads Redis configuration. (Client boundary)
- [x] Rewrite `usePageSession` to create/resume the session and expose only session readiness/error/retry, `sessionId`, the page-wide `isMutating`/`runMutation` gate, and the refresh counter/callback. (Hook simplification, No concurrency)
- [x] Ensure `runMutation` disables Capture Panel, Category Panel, and Expense List writes until the active request settles, while allowing query requests to overlap. (No concurrency)
- [x] Add a `DashboardResults` category-query Hook with loading, error, retry, abort, and stale-response protection. Sort real categories using `Intl.Collator` for the active locale after every successful response. (Category query client)
- [x] Add an Expense List query Hook with independent loading, error, retry, abort, stale-response protection, and newest-first API result handling. (Expense query client)
- [x] Add focused category and expense mutation functions/Hooks at the sections presenting those actions; route every write through `runMutation` and notify the coordinator after success. (Mutation client)
- [x] Add a Capture Panel prompt mutation that preserves exact input and shows localized unavailable feedback for Phase 5's `501` response. It must not trigger a data refresh because no data changed. (Prompt client)
- [x] Map stable API error codes to typed English and Spanish messages; treat server messages as safe fallbacks rather than primary localized copy. (Errors, Localization)

## Group 8 — Recompose the dashboard around section-owned data

- [x] Make `DashboardPage` render Capture Panel and `DashboardResults` directly through ordinary JSX composition. (Dashboard composition)
- [x] Make `DashboardResults` own the responsive category/results structure and one categories response shared by Category Panel and Spending Summary. (Dashboard data flow)
- [x] Keep Expense List nested visually inside `DashboardResults` while it owns its independent expenses query; give it the real categories plus a locally constructed localized `null` Unclassified option. (Expense data flow)
- [x] Render an empty production session correctly: no real categories, zero Unclassified/overall totals, and no expenses. (Empty state)
- [x] After category creation, refetch categories so Category Panel and Spending Summary update and remain alphabetized. (Refresh flow)
- [x] After category deletion, refetch categories and expenses so totals and every `categoryId: null` reassignment appear together. (Refresh flow)
- [x] After expense reclassification/deletion, refetch expenses and categories; after Phase 6 prompt success, the same coordinator path will refresh both. (Refresh flow)
- [x] Keep each section's loading, retry, empty, and failure presentation accessible and localized without introducing a page-wide domain snapshot. (Client behavior)
- [x] Remove `DashboardLayout` and `ResultsPanel` if they remain feature-specific rendered-element slot wrappers; retain structural markup locally or use ordinary `children` only where a reusable layout abstraction remains justified. (Composition simplification)

## Group 9 — Remove superseded client architecture

- [x] Delete the current category, expense, and session implementation files under `src/services/` after all application paths use the API. (Service removal)
- [x] Delete or fully rewrite the old `useCategories` and `usePageSession` implementations, contracts, mocks, and service-oriented tests. (Hook removal)
- [x] Remove service construction, `UserStore`, injected service dependencies, client identifier factories, typed service-only errors, snapshot reducers/actions, and synchronization code that no longer has a consumer. (Wiring removal)
- [x] Move or rewrite only genuinely reusable wire types and presentation-neutral helpers in contract/feature locations; do not retain obsolete files to preserve imports. (Type migration)
- [x] Remove the deterministic in-page expense producer from the production dashboard path. Redis seed data replaces it for Phase 5 end-to-end behavior, while the prompt endpoint remains unavailable. (Capture transition)
- [x] Update source documentation, imports, stories, and tests so searches find no production references to the removed services or old Hook contracts. (Architecture audit)

## Group 10 — Complete regression, Storybook, and browser coverage

- [x] Update Storybook stories to use explicit API-shaped fixtures or injected query/mutation clients without requiring Redis, cookies, or Upstash credentials. (Storybook isolation)
- [x] Cover empty production, seeded populated, category creation, populated-category cascade, expense reclassification/deletion, prompt unavailable, session expired, Redis unavailable, English, Spanish, desktop, and narrow states. (Component coverage)
- [x] Verify alphabetical category ordering in both locales, localized Unclassified presentation, zero totals, 100-expense cap feedback, timestamp ordering, and stable UUID-based actions. (Contract coverage)
- [x] Verify keyboard operation, global mutation disabling, focus restoration, live-region feedback, chart text, contrast, and narrow layouts. (Accessibility)
- [x] Run an end-to-end seeded workflow: seed Redis, start in seeded-session mode, obtain the seeded cookie/ID through `POST /session`, query both resources, mutate all supported resources, refresh, and confirm the session resumes. (Seeded E2E)
- [x] Verify a normal non-seeded session starts empty and cannot see or mutate the seeded session or another session's identifiers. (Isolation E2E)
- [x] Verify closing/clearing the session cookie and Redis expiry behavior return the application to a new empty session with recoverable feedback. (Lifecycle E2E)

## Planned test cases

The IDs below are traceability labels; automated test names should describe behavior plainly.

| ID      | Level      | Scenario                                                     | Expected result                                                                                                                            |
| ------- | ---------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| RD5-001 | Unit       | Parse valid and invalid environment configuration.           | Safe defaults apply; missing credentials, unsafe prefixes, invalid limits, and production seed mode fail closed.                           |
| RD5-002 | Unit       | Validate UUIDs and build Redis/session URLs.                 | Canonical UUIDs are accepted and encoded; malformed values never reach Redis key construction.                                             |
| RD5-003 | Unit       | Create a production session.                                 | It contains no categories or expenses and has zero Unclassified/overall totals.                                                            |
| RD5-004 | Unit       | Create categories named Food, Home, and Transport.           | All are accepted as ordinary real categories.                                                                                              |
| RD5-005 | Unit       | Create reserved, duplicate, invalid, or eleventh categories. | Stable category validation/conflict codes are returned without mutation.                                                                   |
| RD5-006 | Unit       | Shape category query data.                                   | Real categories and totals are returned with separate Unclassified and overall totals; no storage token leaks.                             |
| RD5-007 | Unit       | Shape expense query data.                                    | Server timestamps order newest first with UUID tie-breaking; categories remain nullable references.                                        |
| RD5-008 | Repository | Create and read a session key family.                        | The three prefixed hashes round-trip through Upstash and share the configured TTL once populated.                                          |
| RD5-009 | Repository | Create or write a Redis record.                              | The affected key receives the configured 24-hour TTL without read-time renewal.                                                            |
| RD5-010 | Repository | Create/reclassify/delete an expense.                         | Expense fields change and the next category query recalculates consistent totals.                                                          |
| RD5-011 | Repository | Delete a populated category.                                 | Expenses become `categoryId: null`, the real category disappears atomically, and the query reports the transferred amount as Unclassified. |
| RD5-012 | Repository | Use distinct development/test prefixes.                      | Reads, writes, seed pointers, and cleanup remain isolated.                                                                                 |
| RD5-013 | Route      | Create and resume a normal session.                          | `201` creates empty state; `200` resumes it; both return UUID, cookie, and no-store headers.                                               |
| RD5-014 | Route      | Resolve a configured seeded session.                         | `POST /session` returns the active seed with `200` and binds its cookie.                                                                   |
| RD5-015 | Route      | Enable seed mode with missing/expired seed or in production. | Non-production returns `seed_session_unavailable`; production refuses the configuration.                                                   |
| RD5-016 | Route      | Use a missing or expired session ID.                         | The route returns `401 session_not_found`.                                                                                                 |
| RD5-017 | Route      | Query categories and expenses.                               | Responses match exact DTO envelopes, totals, ordering, nullable fallback, and no-store rules.                                              |
| RD5-018 | Route      | Create and delete a category.                                | Creation returns one zero-total DTO; deletion returns 204 and completes the cascade.                                                       |
| RD5-019 | Route      | Reclassify and delete an expense.                            | Updated DTO/204 response is correct and category totals change on the next query.                                                          |
| RD5-020 | Route      | Submit a valid Phase 5 prompt.                               | The route returns `501 classification_unavailable`, creates nothing, and calls no extractor/provider.                                      |
| RD5-021 | Route      | Trigger each public failure family.                          | Status, stable code, optional field, safe fallback message, and no-store header match the error contract.                                  |
| RD5-022 | Seeder     | Seed twice for one UUID.                                     | The second run replaces deterministically, does not append, renews TTL, and verifies totals/references.                                    |
| RD5-023 | Seeder     | Run with unsafe scope or production settings.                | The command fails before writing or deleting any Redis key.                                                                                |
| RD5-024 | Hook       | Initialize `usePageSession`.                                 | It exposes the returned UUID and readiness without owning category/expense snapshots.                                                      |
| RD5-025 | Hook       | Start one mutation and attempt another.                      | The global mutation gate permits only the active write and disables every mutation control until settlement.                               |
| RD5-026 | Hook       | Resolve stale and current query requests out of order.       | Each section retains only its newest requested response.                                                                                   |
| RD5-027 | Component  | Render unsorted categories in English and Spanish.           | Category Panel and Spending Summary share one locale-collated alphabetical result.                                                         |
| RD5-028 | Component  | Create a category.                                           | Categories refetch; the new zero-total category appears alphabetically in both views.                                                      |
| RD5-029 | Component  | Delete a populated category.                                 | Categories and expenses refetch; affected expenses show localized Unclassified and totals remain stable.                                   |
| RD5-030 | Component  | Reclassify or delete an expense.                             | Both relevant queries refresh and all totals/list data synchronize.                                                                        |
| RD5-031 | Component  | Submit capture text in Phase 5.                              | Exact input remains and localized unavailable feedback appears; no data refresh occurs.                                                    |
| RD5-032 | Component  | Render an empty normal session.                              | No real categories or expenses are fabricated; fallback and overall totals are zero.                                                       |
| RD5-033 | E2E        | Run the complete seeded workflow and refresh.                | The seeded session is usable without AI and resumes through its cookie.                                                                    |
| RD5-034 | E2E        | Create two distinct demo sessions.                           | Their Redis categories, expenses, and totals remain stored under distinct UUID key families.                                               |
| RD5-035 | Audit      | Search source after migration.                               | Old services, service Hooks, fixture capture path, and feature-specific rendered-node layout props are absent from production code.        |

## Group 11 — Validate and hand off

- [x] Run formatting, lint, strict TypeScript, unit/component/integration tests, Storybook build, and production build.
- [x] Run the Upstash-backed repository/route suite with a unique test prefix and verify cleanup is scoped to that prefix.
- [x] Complete bilingual desktop and narrow browser review for empty and seeded sessions, every mutation, loading/error states, keyboard flow, and prompt-unavailable recovery.
- [x] Audit response headers, cookies, UUID validation, error safety, environment isolation, Redis TTLs, and absence of client-visible credentials.
- [x] Audit Redis data after representative mutations to confirm no Unclassified category record, dangling reference, stale total, broad seed key, or unbounded session exists.
- [x] Reconcile every requirement and planned test case with implementation evidence; record accepted differences before marking Phase 5 complete.
- [x] Update `specs/techstack.md`, `src/README.md`, `.env.example`, root `README.md`, and roadmap status to match the implemented architecture and commands.

## Completion handoff

Phase 5 hands Phase 6 a Redis-backed anonymous session API, exact query/mutation contracts, a protected prompt route returning `classification_unavailable`, and a Capture Panel that preserves input on that response. Phase 6 replaces only the unavailable prompt behavior with live extraction and atomic expense creation; it must preserve the session, DTO, refresh, mutation-gate, error, privacy, and Redis boundaries established here.
