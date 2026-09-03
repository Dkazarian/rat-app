# Phase 4.5 Requirements — Category and Expense Service Refactor

## Objective

Record the category and expense refactor implemented after Phase 4 and before Phase 5. Move domain operations into stateful TypeScript services, preserve the session-only dashboard workflow, and accept valid expense candidates independently so the capture boundary is ready for partial AI results.

This is a retrospective specification of the refactor, not evidence that its acceptance checks or a test-first implementation sequence have passed.

## Requirements

- **R1 — Domain services:** Encapsulate category and expense collections in `CategoryService` and `ExpenseService`, keyed by stable identifiers in private Maps. Expose collection snapshots and intention-revealing methods. Preserve readonly domain values and replace changed expense records without mutating earlier records or caller-supplied candidates. Remove the superseded category, expense, and session rule modules.
- **R2 — Session lifetime and isolation:** Create a paired category and expense service once per mounted `usePageSession` instance, with optional initial data and injected identifier factories for deterministic tests and stories. Rerenders and language changes preserve the session; a fresh mount starts clean. Separate page sessions must not share mutable collections. Module-level service defaults may support the standalone category Hook, but the dashboard uses its own instances.
- **R3 — Category behavior:** Start fresh services with only permanent **Unclassified**, always include it when initial data is supplied, and preserve trimmed names, the 24-character name bound, case-insensitive uniqueness, English and Spanish reserved names, and the ten-category limit. Assign custom colors cyclically from the non-muted palette using the current category count excluding **Unclassified**. Reject identifier collisions without overwriting an existing category.
- **R4 — Typed failures:** Throw distinct category errors for invalid names, missing categories, protected categories, duplicate identifiers, and categories still referenced by expenses. Throw a missing-expense error for invalid correction targets. Category creation UI catches `CategoryValidationError`, maps its stable code to localized field feedback, and retains focus and the draft for correction; unexpected errors propagate. Expense batch validation reports typed errors per rejected candidate through its result.
- **R5 — Partial expense batches:** Return `{ added, errors }` from `addExpenseBatch`. Process candidates independently and in order, append accepted records cumulatively, and retain each rejected candidate with its validation error. Reject blank descriptions, amounts that are not positive safe integers in minor units, and identifiers already stored or accepted earlier in the same batch. Preserve accepted descriptions literally and normalize missing or unknown category references to **Unclassified**. An empty batch returns two empty arrays.
- **R6 — Capture feedback:** Supply missing expense identifiers at the page-session boundary. If at least one candidate is accepted, append accepted expenses, clear the input, report the accepted count, and include the skipped count in English or Spanish when candidates fail. If none are accepted, add nothing, preserve the exact input, and show recoverable extraction-failure feedback.
- **R7 — Expense correction:** Reclassification validates both expense and destination category, replaces only the expense's category reference, and returns the changed expense. Deletion removes the identified expense. Missing targets throw typed errors before changing stored data or the React snapshot.
- **R8 — Guarded category deletion:** Connect each expense service to its category service so direct service deletion of a populated category throws `CategoryHasExpensesError`. Expose a separate reassignment operation that moves affected expenses to **Unclassified** and returns only changed records. The page session's `deleteCategory` action coordinates reassignment before deletion; the dashboard invokes that single action. Missing categories and permanent **Unclassified** remain protected; reassignment from **Unclassified** is a no-op.
- **R9 — React synchronization and derived output:** Compose `useCategories` inside `usePageSession` with the session's dedicated category service. The category Hook owns the React category snapshot and refreshes it from the service after successful creation or deletion. The page-session reducer owns expenses, input, and feedback only, with no duplicate category state or actions. Compose multiple synchronous intentions without losing unrelated expenses or restoring deleted category references. Continue deriving grouped results, totals, percentages, and chart data from the current snapshots. Keep domain validation in services and the pure reducer free of service mutations.
- **R10 — Presentation and regression preservation:** Keep prop-driven category and expense components, accessible keyboard controls, literal custom names and descriptions, localized built-in names, and the existing amount format in both languages. Update tests, fixtures, stories, selectors, and display imports for the new service contracts. Keep session workflows deterministic under injected identifiers and compatible with the existing HTTP-safe identifier fallback.

## Changes to earlier contracts

For this intermediate phase and subsequent client integration, the following contracts replace the corresponding Phase 3/4 assumptions. The current `specs/techstack.md` incorporates these service contracts, and `src/README.md` documents their source locations. Other product requirements continue to apply.

| Earlier contract                                                  | Phase 4.5 contract                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure category and expense operations; no service classes          | Stateful TypeScript service classes own domain collections; selectors and the snapshot reducer remain pure                                                                |
| React is the sole owner of domain collections                     | Services own mutable collections; React maintains rendering snapshots scoped to the same mounted page session                                                             |
| Expected rejected operations return discriminated failure results | Individual operations throw typed errors; expense batches return accepted records and per-candidate errors; page-session category successes retain their success wrappers |
| Any invalid expense rejects the entire batch                      | Valid candidates are accepted independently; only zero accepted candidates preserve input and show failure                                                                |
| One session deletion operation reassigns and removes a category   | The session coordinates explicit reassignment before guarded service deletion; the dashboard calls one action                                                             |

Historical Phase 4 validation describes the earlier implementation. Its completed checkboxes do not establish acceptance of these changed contracts, and its outstanding process sign-off remains separate.

## Exclusions

- AI extraction, classification routes, provider calls, credentials, and server-side validation
- Persistence, accounts, synchronization, or shared state across dashboard sessions
- Repository frameworks, dependency-injection containers, global-state libraries, or new runtime dependencies
- Manual expense entry, description or amount editing, category renaming, undo, confirmation dialogs, or dashboard redesign

## Context and completion

- [Roadmap](../roadmap.md): intermediate Phase 4.5, preserving Phase 5 and Phase 6 numbering.
- [Phase 4 requirements](../spec-phase-4-expense-management/requirements.md): established expense workflow and the contracts revised above.
- [Technical baseline](../techstack.md): retained session-only, localization, amount-formatting, and future classification expectations.

Complete this phase when its [validation checklist](validation.md) is supported by recorded results. Do not infer completed validation from this retrospective specification.
