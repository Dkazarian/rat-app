# Phase 4.5 Validation — Category and Expense Service Refactor

Status: validated and complete on 2026-09-03. This checklist was written retrospectively on 2026-09-02 and then verified against the current refactor with fresh automated runs, source review, and built Storybook browser workflows. Historical Phase 4 results were not carried forward as new evidence.

## Automated quality gates

- [x] `npm run format:check` exits 0.
- [x] `npm run lint` exits 0 with no warnings.
- [x] `npm run typecheck` exits 0.
- [x] `npm test` exits 0; record the current file and test counts.
- [x] `npm run build-storybook` exits 0.
- [x] `npm run build` exits 0 without an API key.

## Category service and typed errors

- [x] Initial categories have stable identities and order; independent service instances do not share collections. (R1, R2)
- [x] Creation trims names and enforces empty, length, reserved-name, duplicate-name, and category-limit constraints with the expected typed validation codes. Reserved English and Spanish names remain reserved after deleting a built-in category. (R3, R4)
- [x] Custom colors cycle through non-muted tokens, and a duplicate generated identifier never overwrites an existing category. (R3)
- [x] Eligible built-in and custom categories can be deleted; missing and protected categories throw distinct errors without changing stored data. (R3, R4, R8)
- [x] Category form validation preserves its draft, displays localized field feedback, and focuses the input; unexpected errors are not converted into ordinary name-validation messages. (R4, R10)

Primary references: `src/services/categories/category-service.test.ts`, `src/features/categories/hooks/use-categories.test.tsx`, and `src/features/categories/components/category-panel.test.tsx`.

## Expense service and partial batches

- [x] Valid candidates append cumulatively while preserving literal descriptions and positive safe-integer minor-unit amounts. Earlier snapshots and caller-owned values remain unchanged. (R1, R5)
- [x] A mixed batch accepts valid candidates and returns one typed error with the original candidate for each rejected item, preserving order within both result arrays. (R4, R5)
- [x] Blank descriptions, invalid amounts, and duplicate identifiers are rejected individually, including duplicate identifiers within a single batch; existing records are never overwritten. (R5)
- [x] Missing and unknown categories normalize to **Unclassified**; empty batches return empty `added` and `errors` arrays. (R5)
- [x] Reclassification changes only the category reference; invalid expense or category targets throw before changing stored records. Deletion removes only the target expense and throws when it is missing. (R4, R7)
- [x] Reassignment returns only affected records, preserves unrelated expenses, throws for an unknown category, and does nothing for **Unclassified**. (R8)
- [x] Category deletion checks current expense references after addition, reclassification, reassignment, and expense deletion; populated categories remain blocked until references are removed. (R8)

Primary reference: `src/services/expenses/expense-service.test.ts`.

## Session and dashboard integration

- [x] Services initialize once per mounted page session; rerenders and locale changes preserve data, while remounting starts a clean session. Separate page-session instances remain independent. (R2)
- [x] Injected category and expense identifiers remain deterministic, and the existing HTTP-safe identifier fallback still produces distinct identifiers. (R2, R6, R10)
- [x] Fully accepted and partially accepted captures append only accepted records, clear input, and report accepted counts; partial success also reports skipped counts in English and Spanish. (R5, R6)
- [x] Empty and wholly rejected captures preserve exact input and prior expenses and show recoverable feedback. (R6)
- [x] Reclassification, expense deletion, and category operations synchronize service collections and React snapshots without losing unrelated records. (R7–R9)
- [x] Multiple intentions in one event compose correctly, including capture, reassignment, category deletion, and another capture; deleted references are not restored. (R8, R9)
- [x] Deleting a populated category through the dashboard reassigns before deletion and leaves all expenses visible under **Unclassified** with synchronized results and chart data. (R8–R10)
- [x] Totals, percentages, chart slices, and grouped results remain derived; custom names and descriptions stay literal, and both locales retain the established `$1285.50` amount format. (R9, R10)

Primary references: `src/features/dashboard/hooks/use-page-session.test.tsx`, `src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`, `src/features/expenses/expense-selectors.test.ts`, and the category/expense display tests.

## Storybook, browser, and accessibility review

- [x] Review category creation and validation, cumulative capture, correction, populated-category deletion, and zero-result recovery in English and Spanish.
- [x] Exercise a deterministic mixed valid/invalid batch and confirm accepted and skipped counts match the visible expenses; verify all-invalid capture preserves exact input.
- [x] Complete category creation, expense correction, and populated-category deletion with keyboard controls and visible focus.
- [x] Review representative desktop and 390 px layouts for overlap, clipping, and page-level horizontal scrolling.
- [x] Switch languages after mutations and confirm the session persists; refresh and confirm initial categories and empty expenses return.
- [x] Confirm fixtures and stories use isolated service instances where needed and do not leak mutations between mounts.

These checks cover R2, R4, R6, R8, and R10. The browser setup, reviewed stories, and observed results are recorded below.

## Architecture and scope audit

- [x] Domain validation resides in services; presentation consumes data/callbacks and catches only the intended validation errors. (R1, R4, R9)
- [x] The dashboard uses a dedicated service pair instead of mutable module-level defaults. Service mutation occurs outside the pure reducer, and snapshots reflect returned operation results. (R2, R9)
- [x] Superseded rule modules and imports are removed; tests, fixtures, selectors, and stories use current contracts. (R1, R10)
- [x] No session persistence, network classification, provider integration, new runtime dependency, or excluded product feature was introduced.
- [x] Phase 4.5 contract changes are documented without treating the earlier Phase 4 checklist as validation of the new architecture.

## Completion record

- Validation dates: automated runs began 2026-09-02; browser review and completion recorded 2026-09-03.
- Environment and source revision: Windows, Node 24.16.0, npm 11.13.0, working-tree refactor based on `e9a4b0a`, including the validation additions described below.
- Automated results: all six commands exit 0; Vitest reports 14 files and 106 passing tests. Next.js builds without `OPENROUTER_API_KEY` and without a local environment file. Storybook bundle-size and plugin-timing advisories are non-failing.
- Browser and accessibility evidence: in-app Chromium, built Storybook served on `http://127.0.0.1:6007`, 1440 × 1000 and 390 × 844 viewport overrides, English and Spanish. Review used the dashboard language buttons so locale changes exercised the mounted session rather than remounting through the Storybook toolbar.
- Accepted differences or remaining failures: none for Phase 4.5. No functional production-code correction was needed during this validation.

## Validation evidence

### Automated coverage and corrections

The initial suite passed 104 tests. Added two regressions for explicit requirements that lacked direct coverage: duplicate identifiers within one expense batch and simultaneous page-session isolation, including independence of category-deletion guards. Both pass in the final 106-test run.

The first formatting gate failed on 20 source/document files. Ran the project formatter and repeated the gate successfully. Lint, standalone TypeScript, the complete test suite, and both production builds also pass after the validation additions. `git diff --check` reports no whitespace errors.

Existing category-service tests verify naming constraints, palette cycling, missing/protected targets, snapshot preservation, and identifier collisions. Expense-service tests cover independent candidate validation, literal input preservation, normalization, correction, reassignment, and current-reference deletion guards. Page-session, category-Hook, dashboard, selector, display, and formatting tests cover synchronization, synchronous intentions, injected identifiers, HTTP-safe identifiers, localization, focus, and derived totals. Unexpected category errors propagate by the explicit `instanceof CategoryValidationError` guard; this clause was verified by source inspection.

### Browser workflows

- Added `PartialBatch` and `AllInvalidBatch` dashboard stories using deterministic per-mount identifiers. Partial capture displayed only **Accepted coffee**, total `$4.50`, cleared input, and reported `1 expense sorted. 1 skipped.` Switching to Spanish preserved the expense and displayed `1 gasto ordenado. Se omitieron 1.`
- All-invalid capture added no expenses and preserved the exact textarea value `  exact rejected input\n  ` in both languages, including leading/trailing spaces and the newline. The recovery message appeared in an alert.
- The Empty story accepted two successive three-expense batches, first in English and then in Spanish. Results grew from three expenses / `$34.50` to six / `$69.00`. Deleting populated Food/Comida preserved all six expenses, moved four to Unclassified, and produced Transport 35% / Unclassified 65% with the same `$69.00` total.
- Category creation and empty-name validation were exercised in both languages. Keyboard submission kept input focus visible on validation failure, and successful creation trimmed `  Health  ` to `Health`. Custom `Health` and `Books` names and literal expense descriptions survived language changes.
- Keyboard ArrowDown reclassified Accepted coffee from Food to Home. Enter deleted populated Home and moved the expense to Unclassified. At the narrow viewport, ArrowUp moved it to Transport; Enter deleted populated Transport; Tab reached the expense delete button and Enter removed the expense. Focus-visible was true on the selector and delete control, with a solid selector outline.
- Refresh after category and expense mutations restored all four initial categories, zero expenses, empty input, and English. Fresh story mounts did not retain earlier custom categories or deleted defaults.
- Reviewed Cumulative Batches, Reclassification, Expense Deletion, Populated Category Deletion, and Extraction Failure in English and Spanish. Observed totals were respectively `$770.60`, `$1284.50`, `$766.30`, `$1284.50`, and `$0.00`, with matching translated chart summaries.
- Desktop and narrow visual review found no overlap or clipped correction controls. At 390 px, the content area was 375 px excluding the scrollbar, the selector was approximately 264 px wide, and document scroll width equaled client width. The reviewed narrow stories had no page-level horizontal scrolling. Browser console review returned no application errors.

### Architecture and scope

Source inspection confirms each `usePageSession` owns a dedicated service pair, services mutate outside the pure reducer, and operation results update React snapshots. Selectors derive totals and chart data; the dashboard invokes reassignment before category deletion. Category components catch only the intended name-validation error and otherwise propagate errors.

Searches under `src` found no remaining category/expense/session rule-module references and no browser storage, cookie, IndexedDB, fetch, or XMLHttpRequest calls in session workflows. Package manifests and the lockfile have no dependency changes. This phase retains deterministic capture; it adds no classification provider or persistence behavior.

All required checks have supporting evidence, and Phase 4.5 is marked complete in the roadmap. The historical Phase 4 process-sign-off item remains tracked in its own evidence file.

## Follow-up: shared category Hook

The category synchronization follow-up composes `useCategories` inside `usePageSession`. Category snapshots now refresh from the service in that shared Hook; the session reducer holds only expenses, input, and feedback. The session's `deleteCategory` action now coordinates reassignment and guarded deletion, replacing the dashboard-owned sequence described in the original review above. The unused pending-state reference and its duplicate reducer evaluation were removed.

Verification: 82 tests pass across the category and expense services, category Hook, page-session Hook, category panel, and dashboard test files. Updated tests cover session-owned deletion and isolation; added regressions cover creating, capturing into, and deleting a custom category in one event, plus unchanged snapshots for missing or protected deletion targets. TypeScript and lint checks pass. The earlier build and browser results remain historical; those checks were not repeated for this follow-up.
