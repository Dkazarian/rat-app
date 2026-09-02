# Phase 4 Validation — Expense Management

Implementation is complete and ready for review when all of the following pass.

## Automated quality gates

- [x] `npm run format:check` exits 0.
- [x] `npm run lint` exits 0 with no warnings.
- [x] `npm run typecheck` exits 0 with no type errors.
- [x] `npm test` exits 0 with no failures.
- [x] `npm run build-storybook` exits 0.
- [x] `npm run build` exits 0 without an API key.

## Expense model and pure-rule coverage

- [x] An accepted expense has a stable identifier, non-empty literal description, positive integer amount in minor units, and a category identifier present in the current category collection. (R1)
- [x] Expense values do not store formatted amounts, localized category names, percentages, totals, or chart values. (R1, R9, R10)
- [x] Adding a valid batch appends every expense without replacing earlier expenses and returns new immutable collections. (R3, R4)
- [x] Empty batches, empty or whitespace-only descriptions, non-integer amounts, and non-positive amounts are rejected without partial addition. (R3–R5)
- [x] Missing and unknown category references are normalized to permanent **Unclassified** for every accepted expense. (R4)
- [x] Reclassification to any current category, including **Unclassified**, changes only the category reference. (R3, R6)
- [x] Reclassification with a missing expense or category returns the expected rejected result and preserves the original expense collection. (R3, R6)
- [x] Deleting an existing expense removes only that expense; deleting a missing expense returns the expected rejected result without changing the collection. (R3, R7)
- [x] Deleting a populated eligible category reassigns all of its expenses to **Unclassified** and removes the category in one transition. (R3, R8)
- [x] Rejected category deletion, including deletion of **Unclassified**, leaves both category and expense collections unchanged. (R3, R8)
- [x] No pure operation mutates its input arrays or existing category and expense values. (R1, R3)

## Selector and formatting coverage

- [x] Categorized results are derived from the current category and expense collections and contain no dangling category references. (R9)
- [x] Per-category totals and the overall total equal the sum of current expense minor-unit amounts. (R9)
- [x] Percentages and chart slices are derived from the same totals, remain synchronized, and handle empty or zero-total input safely. (R9)
- [x] Current categories that require display remain visible with zero totals, and deleted categories are absent from results, summaries, and chart data. (R9)
- [x] Built-in category names localize from stable identities, while custom names and expense descriptions remain verbatim. (R10)
- [x] Every displayed amount is `$` followed by an ungrouped number with a `.` decimal separator and exactly two fractional digits in English and Spanish (for example, `$1285.50`). (R10)
- [x] The accessible chart summary is generated from current derived data rather than hard-coded fixture text. (R9–R11)

## Session and integration coverage

- [x] A fresh page initializes the four Phase 3 categories and an empty expense collection exactly once for the mounted session. (R2)
- [x] Editing the capture textarea updates session input, and rerenders do not discard the exact value. (R2, R5)
- [x] One accepted deterministic batch displays its expenses and clears the input. (R4, R5)
- [x] A later accepted batch appends to the existing expenses and updates all results cumulatively. (R4, R5)
- [x] A rejected or zero-item batch adds nothing, preserves the exact input, and presents recoverable localized feedback. (R5, R10, R11)
- [x] Successful capture reports the localized extracted count through rat dialogue. (R5, R10, R11)
- [x] Reclassifying an expense immediately updates its categorized result, affected category totals, overall total, percentages, and chart. (R6, R9)
- [x] Deleting an expense immediately updates its categorized result, affected category total, overall total, percentages, and chart. (R7, R9)
- [x] Deleting a populated category never renders an intermediate state with an expense referencing the removed category. (R8)
- [x] Switching language in either direction preserves categories, expenses, input, and expense identifiers while updating built-in names, controls, amounts, and accessible text. (R2, R10)
- [x] Category and expense presentation receive data and callbacks through props and do not import each other or own cross-collection transitions. (R11, R12)

## Component and accessibility coverage

- [x] Every expense provides a keyboard-operable category selection control containing every current category, including **Unclassified**. (R6, R11)
- [x] Every expense provides a keyboard-operable immediate delete action. (R7, R11)
- [x] Each correction control has a localized accessible name identifying its purpose and expense target. (R10, R11)
- [x] Category identity remains understandable through text and does not depend on color alone. (R11)
- [x] Correction controls retain visible focus and remain operable at desktop and narrow layouts. (R11)
- [x] Global success and informational feedback is presented through rat dialogue and announced with the appropriate live-region behavior. (R5, R11)
- [x] All new visible and accessible copy exists in both typed localization dictionaries. (R10, R11)

## Storybook checks

- [x] Stories cover empty state, one accepted batch, cumulative batches, reclassification, expense deletion, populated-category deletion, and rejected zero-item capture. (R13)
- [x] Representative English and Spanish stories preserve literal descriptions and custom names while translating built-in names and controls. (R10, R13)
- [x] Representative desktop and 390 px stories show correction controls without overlap or page-level horizontal scrolling. (R11, R13)
- [x] Stories remain deterministic and require no persistence, network request, uncontrolled randomness, natural-language parser, or API key. (R5, R13)

## Manual checks

- [x] Enter text, apply a deterministic accepted batch, and confirm the input clears and every extracted expense appears.
- [x] Submit a second accepted batch and confirm the first batch remains present.
- [x] Enter text, apply a rejected or zero-item batch, and confirm no expense is added and the exact input remains available for correction.
- [x] Reclassify an expense among a built-in category, a custom category, and **Unclassified**; confirm results, totals, percentages, and chart update together.
- [x] Delete an expense and confirm every derived textual and chart output updates in the same render.
- [x] Delete a category containing multiple expenses and confirm those expenses remain present under **Unclassified**.
- [x] Attempt to delete **Unclassified** and confirm neither categories nor expenses change.
- [x] Create and delete categories, add and correct expenses, switch languages in both directions, and confirm the complete session is preserved.
- [x] Confirm expense descriptions and custom category names remain byte-for-byte unchanged when switching language.
- [x] Refresh and confirm initial categories return, expenses and input clear, and all prior session changes disappear.
- [x] Confirm no operation produces a network request or writes to local storage, session storage, IndexedDB, cookies, a server, or a database.
- [x] Complete capture, reclassification, expense deletion, and populated-category deletion using only the keyboard with visible focus throughout.
- [x] Repeat the workflow at a representative desktop width and at 390 px without overlap or page-level horizontal scrolling.
- [x] Review every required expense-management story in English and Spanish.

## Architecture and scope audit

- [x] One neutral React page-session boundary owns categories, expenses, input, and feedback and initializes them once for the mounted session. (R2, R12)
- [x] Cross-collection transitions are atomic; category deletion cannot commit separately from required expense reassignment. (R8, R12)
- [x] Category and expense rules remain pure TypeScript functions and are not duplicated in reducers, Hooks, handlers, or presentation components. (R3, R12)
- [x] The session coordinator may depend on both feature rule modules, but the category and expense UI components do not import or control each other. (R8, R12)
- [x] Totals, percentages, grouped lists, and chart values are derived selectors rather than duplicated session state. (R9)
- [x] The implementation contains no service class, repository abstraction, dependency-injection container, global-state library, form library, or new runtime dependency. (R12)
- [x] No session data is persisted or synchronized through browser storage, cookies, network requests, a server, or a database. (R2)
- [x] No natural-language parsing, classification heuristic, mock AI behavior, API route, provider client, credential, rate limiter, or server-side classification validation was introduced. (R5)
- [x] No manual expense creation, description or amount editing, bulk operation, undo, confirmation, search, filter, pagination, export, currency conversion, budget, income, or recurring-expense behavior was added.
- [x] The approved Phase 2 dashboard presentation was extended without an unrelated redesign. (R13)

## Definition of done

All automated tests pass, all manual and accessibility checks are confirmed, and no debug code, ignored failures, dangling category references, or unrelated feature work remains. Record the validation date, environment, and any accepted differences below before aligning the roadmap wording and marking Phase 4 complete.

Validated on: 2026-09-02 (with prior live workflow evidence from 2026-08-30).

Environment: Windows; Node 24.16.0; npm 11.13.0; 14 Vitest files / 96 passing tests; built Next.js and Storybook; in-app Chromium at 1440 × 1000 and 390 × 844.

Evidence: See [evidence.md](evidence.md) for the checklist-to-test trace, architecture audit, and bilingual browser/story review. All six automated gates pass. Storybook bundle-size/plugin-timing messages are advisory, not failures.

Accepted differences: No functional exceptions. Historical test-first sequencing for Groups 4–6 was not followed, and before-production mapping cannot be retroactively established. This process deviation is documented but not assumed accepted; final phase sign-off remains open.
