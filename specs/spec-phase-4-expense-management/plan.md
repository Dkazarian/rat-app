# Phase 4 Plan — Expense Management

## TDD execution rule

Phase 4 follows red-green-refactor. Before implementing each behavior, write the smallest failing automated test that demonstrates the corresponding requirement and expected public outcome; implement only enough production code to pass it; then refactor while the suite remains green. Do not mark a plan item complete from implementation alone.

- [ ] Map every automatable checklist item in `validation.md` to one or more planned test-case identifiers below before writing its production code.
- [ ] Add each mapped test in a failing state first and confirm it fails for the intended missing behavior rather than for setup, typing, or fixture errors.
- [x] Implement the minimum behavior needed to make the new test pass without weakening existing assertions.
- [x] Refactor only with the new test and the existing suite green, then record any manual-only validation item that cannot be automated and why.
- [x] Keep `plan.md`, `validation.md`, and implemented test coverage aligned when a scenario or result code changes during development.

## Group 1 — Establish the expense feature model

- [x] Define immutable expense, expense-candidate, identifier, minor-unit amount, and operation-result types. (R1, R3)
- [x] Keep descriptions as non-empty literal values and category references as stable identifiers; exclude formatted amounts, localized names, percentages, and totals from the expense model. (R1, R9, R10)

## Group 2 — Implement and test pure expense behavior

- [x] Write the failing pure-rule tests EXP-001 through EXP-016, following the red-green-refactor cycle one behavior at a time. (R1, R3–R8)
- [x] Implement atomic expense-batch validation and addition with caller-supplied identifiers, positive integer minor-unit amounts, and normalization of missing or unknown categories to permanent **Unclassified**. (R3, R4)
- [x] Reject empty or invalid batches without partially changing the previous expense collection. (R3–R5)
- [x] Implement expense reclassification by stable expense and category identifiers while preserving the expense identifier, description, and amount. (R3, R6)
- [x] Implement individual expense deletion with a stable rejected result for a missing identifier. (R3, R7)
- [x] Implement category-deletion coordination that reassigns affected expenses to **Unclassified** before returning the category collection without the deleted category. (R3, R8)
- [x] Preserve both original collections when category deletion is rejected, including attempts to delete **Unclassified**. (R3, R8)
- [x] Confirm EXP-001 through EXP-016 cover every aligned model, batch, correction, deletion, immutability, and referential-integrity item in `validation.md`. (R1, R3–R8)

## Group 3 — Implement derived selectors and presentation mapping

- [x] Write the failing selector and formatting tests EXP-017 through EXP-024 before implementing each corresponding selector or mapper behavior. (R3, R9, R10)
- [x] Derive expenses grouped in current category order from the category and expense collections. (R3, R9)
- [x] Derive per-category totals, the overall total, percentages, and chart slices without storing duplicated values in session state. (R3, R9)
- [x] Include current zero-total categories where the interface requires them, omit deleted categories, and handle an empty or zero-total collection without invalid percentages. (R9)
- [x] Build expense-list and spending-summary view models from domain values, current categories, locale, and translations. (R9, R10)
- [x] Preserve expense descriptions and custom category names verbatim while translating built-in category identities at render time. (R10)
- [x] Generate synchronized accessible chart text from the same derived data used to draw the chart. (R9–R11)

## Group 4 — Add shared page-session coordination

- [ ] Write the failing session tests EXP-025 through EXP-032 before replacing the existing session ownership and before implementing each transition. (R2–R8, R12)
- [x] Replace the separate category Hook and static expense presentation state with one neutral page-session coordinator that owns categories, expenses, input, and global feedback. (R2, R8, R12)
- [x] Use a reducer or equivalent single-state transition boundary so operations involving both collections commit atomically. (R2, R8, R12)
- [x] Keep category and expense rules in their respective feature modules; the neutral coordinator may call both, but neither feature UI may import or control the other feature UI. (R3, R8, R12)
- [x] Initialize session collections once, preserve them across rerenders and language changes, and allow refresh or page closure to reset them naturally. (R2)
- [x] Replace the presentation-owned dashboard seed with feature-owned domain values and derived view models. (R1, R2, R9, R12)
- [x] Define the live session seed and generate browser expense identifiers at the feature boundary while allowing deterministic seeds, factories, or identifiers in tests and stories. (R2, R4, R5, R12, R13)
- [x] Expose intention-revealing operations for input changes, deterministic batch capture, expense reclassification, expense deletion, category creation, and coordinated category deletion. (R3–R8)

## Group 5 — Connect the deterministic capture workflow

- [ ] Write the failing capture component tests EXP-033 and EXP-034 before connecting the controlled input and deterministic batch boundary. (R4, R5, R10, R11)
- [x] Make the existing expense textarea controlled by the page session and preserve its exact value through rejected or zero-item capture attempts. (R5)
- [x] Connect successful deterministic batch capture to cumulative session addition without parsing the textarea or replacing earlier expenses. (R4, R5)
- [x] Clear the input only after an accepted batch and route the localized extracted count through rat dialogue. (R5, R10, R11)
- [x] Keep rejected capture feedback recoverable and leave the submitted input available for correction. (R5, R11)
- [x] Keep the Phase 4 batch producer an injected caller dependency for application composition, tests, and stories; do not imitate natural-language classification. (R5, R13)

## Group 6 — Add expense correction controls

- [ ] Write the failing correction and accessibility component tests EXP-035 through EXP-040 before adding or wiring their controls. (R6, R7, R9–R11)
- [x] Extend the expense list with a native or equivalently accessible category selector populated from current categories. (R6, R11)
- [x] Add an immediate delete action for every expense without confirmation. (R7, R11)
- [x] Pass category options and correction callbacks through props so expense presentation remains independent of session implementation details. (R11, R12)
- [x] Ensure each correction control has a localized accessible name that identifies its action and expense target. (R10, R11)
- [x] Preserve visible focus and usable layouts for reclassification and deletion at desktop and representative narrow widths. (R11)

## Group 7 — Complete localization, tests, and stories

- [x] Add synchronized typed English and Spanish copy for dynamic capture counts, correction actions, empty results, validation, and accessible chart summaries. (R5, R10, R11)
- [x] Complete any remaining validation-aligned tests through red-green-refactor, including ungrouped `$` formatting with a `.` decimal separator and exactly two fractional digits, plus synchronized chart output. (R9, R10)
- [x] Confirm the session and component cases cover empty state, cumulative batches, zero-result preservation, reclassification, expense deletion, populated-category deletion, and synchronized totals. (R4–R11, R13)
- [x] Confirm EXP-031 and EXP-039 preserve expenses and input, translate built-in names and controls, and leave descriptions and custom names unchanged. (R2, R10)
- [x] Add deterministic Storybook states for empty, cumulative, correction, category-deletion, rejected-capture, English, Spanish, desktop, and narrow layouts. (R13)
- [x] Confirm tests and stories do not depend on persistence, network access, uncontrolled randomness, natural-language parsing, or API keys. (R2, R5, R13)
- [x] Run the audit cases EXP-041 through EXP-044 and reconcile every automated `validation.md` checkbox with the final suite before validation begins. (R2, R5, R12, R13)

## Planned test cases

The identifiers below are planning and traceability references; they do not prefix automated test names. Test names describe behavior in plain language so failure output remains readable. Unit cases exercise pure functions directly. Session cases exercise the coordinating Hook or reducer with deterministic identifiers and batches. Component cases use user-visible roles, names, and outcomes rather than implementation details.

### Expense model and batch rules

| ID      | Level | Scenario                                                                                                                   | Expected result                                                                                                                                   |
| ------- | ----- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXP-001 | Unit  | Add one candidate with a literal description, positive integer minor-unit amount, known category, and supplied identifier. | The accepted expense preserves all four values and is appended in a new collection.                                                               |
| EXP-002 | Unit  | Add a second valid batch to a non-empty expense collection.                                                                | Earlier expenses remain in order and every new expense is appended in batch order.                                                                |
| EXP-003 | Unit  | Add an empty batch.                                                                                                        | The result is rejected with the stable empty-batch code and returns the original collection reference.                                            |
| EXP-004 | Unit  | Add a batch containing an empty or whitespace-only description.                                                            | The entire batch is rejected and no valid sibling candidate is added.                                                                             |
| EXP-005 | Unit  | Add batches containing zero, a negative amount, a fractional minor-unit amount, and a non-finite amount.                   | Each entire batch is rejected with the stable invalid-amount code and no partial mutation occurs.                                                 |
| EXP-006 | Unit  | Add candidates with a missing category and an unknown category identifier.                                                 | Both accepted expenses reference permanent **Unclassified**.                                                                                      |
| EXP-007 | Unit  | Add a valid multi-item batch.                                                                                              | Supplied identifiers remain stable, all inputs remain unmodified, and the returned collection and new expense values are immutable by convention. |

### Reclassification, deletion, and referential integrity

| ID      | Level | Scenario                                                     | Expected result                                                                                          |
| ------- | ----- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| EXP-008 | Unit  | Reclassify an existing expense to another current category.  | Only `categoryId` changes; identifier, description, and amount are preserved.                            |
| EXP-009 | Unit  | Reclassify an existing expense to **Unclassified**.          | The operation succeeds and preserves every non-category field.                                           |
| EXP-010 | Unit  | Reclassify a missing expense.                                | The result is rejected with `expense-not-found` and the original collection is returned unchanged.       |
| EXP-011 | Unit  | Reclassify to a missing category.                            | The result is rejected with `category-not-found` and the original collection is returned unchanged.      |
| EXP-012 | Unit  | Delete an existing expense from a multi-expense collection.  | Only the targeted expense is absent from a new collection.                                               |
| EXP-013 | Unit  | Delete a missing expense.                                    | The result is rejected with `expense-not-found` and the original collection is returned unchanged.       |
| EXP-014 | Unit  | Delete an eligible category referenced by zero expenses.     | The category is removed and the expense collection remains unchanged.                                    |
| EXP-015 | Unit  | Delete an eligible category referenced by multiple expenses. | The category is removed and every affected expense is reassigned to **Unclassified** in the same result. |
| EXP-016 | Unit  | Attempt to delete **Unclassified** or a missing category.    | The operation is rejected and both original collections remain unchanged.                                |

### Derived selectors and formatting

| ID      | Level | Scenario                                                                         | Expected result                                                                                                                                             |
| ------- | ----- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXP-017 | Unit  | Select grouped results and totals from several categories and expenses.          | Expenses appear under their referenced categories; per-category and overall totals equal the minor-unit sums.                                               |
| EXP-018 | Unit  | Select results with current categories that have no expenses.                    | Required categories remain present with zero totals and no fabricated expenses.                                                                             |
| EXP-019 | Unit  | Select results after a category has been deleted and its expenses reassigned.    | The deleted category is absent and reassigned values contribute only to **Unclassified**.                                                                   |
| EXP-020 | Unit  | Select percentages and chart slices from a populated collection.                 | Percentages use the derived overall total and chart values match the textual summary.                                                                       |
| EXP-021 | Unit  | Select percentages and chart slices from an empty or zero-total collection.      | No `NaN` or infinite values are produced and the no-spending presentation is selected.                                                                      |
| EXP-022 | Unit  | Map the same domain values in English and Spanish.                               | Built-in category names localize; amount separators stay identical, while literal descriptions and custom category names do not change.                     |
| EXP-023 | Unit  | Format representative whole and fractional minor-unit amounts in both locales.   | Output starts with `$`, uses no grouping separator, and has a `.` decimal separator with exactly two fractional digits without changing stored minor units. |
| EXP-024 | Unit  | Generate chart accessibility text before and after reclassification or deletion. | The text is derived from the current slices and never retains stale fixture percentages.                                                                    |

### Session coordination and capture

| ID      | Level   | Scenario                                                                     | Expected result                                                                                      |
| ------- | ------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| EXP-025 | Session | Initialize and rerender the mounted session.                                 | Categories and expenses initialize once and retain stable identifiers.                               |
| EXP-026 | Session | Change the input value, then apply a valid deterministic batch.              | The expenses are appended, input clears, and rat dialogue reports the localized item count.          |
| EXP-027 | Session | Apply two valid deterministic batches sequentially.                          | The final collection contains both batches and all derived outputs reflect their combined values.    |
| EXP-028 | Session | Apply an empty or invalid deterministic batch after entering text.           | No expense is added, the exact input remains, and recoverable feedback is selected.                  |
| EXP-029 | Session | Reclassify and then delete an expense.                                       | Each intention commits once and all selectors reflect the same current collections.                  |
| EXP-030 | Session | Delete a populated category.                                                 | No observed session state contains a dangling expense category reference.                            |
| EXP-031 | Session | Change locale after creating categories, adding expenses, and entering text. | All session data persists while derived localized presentation changes.                              |
| EXP-032 | Session | Unmount and create a fresh session, representing refresh or page closure.    | Initial categories return and expenses, input, and prior feedback are reset without storage cleanup. |

### User interface, accessibility, and responsive behavior

| ID      | Level     | Scenario                                                                              | Expected result                                                                                                    |
| ------- | --------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| EXP-033 | Component | Type in the capture textarea and submit a configured accepted batch.                  | The controlled value follows typing, the new expenses render, the input clears, and success is announced.          |
| EXP-034 | Component | Submit a configured rejected or zero-item batch.                                      | The typed value remains byte-for-byte intact and an accessible recoverable message is rendered.                    |
| EXP-035 | Component | Use an expense category selector with the keyboard.                                   | Every current category, including **Unclassified**, is available and the targeted expense moves immediately.       |
| EXP-036 | Component | Delete an expense using its accessible action.                                        | The named target disappears and total and chart accessibility output update immediately.                           |
| EXP-037 | Component | Delete a category containing expenses.                                                | The category disappears and its expenses remain visible as **Unclassified** without an intermediate missing label. |
| EXP-038 | Component | Inspect correction controls for two similarly named expenses.                         | Each accessible name identifies both the action and the specific expense target.                                   |
| EXP-039 | Component | Switch between English and Spanish with populated results.                            | Controls, built-in categories, counts, amounts, and chart text localize while literal values persist.              |
| EXP-040 | Component | Complete capture and correction at desktop and 390 px widths using only the keyboard. | Focus stays visible, controls remain operable, and no overlap or page-level horizontal scrolling occurs.           |

### Determinism and exclusion guards

| ID      | Level              | Scenario                                                                     | Expected result                                                                                                                      |
| ------- | ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| EXP-041 | Story/test audit   | Run stories and tests with injected expense identifiers and batches.         | Results are repeatable and do not call `crypto.randomUUID` from deterministic paths.                                                 |
| EXP-042 | Integration audit  | Exercise capture and every correction workflow while observing browser APIs. | No network, storage, cookie, server, database, natural-language parser, or provider operation occurs.                                |
| EXP-043 | Architecture audit | Inspect imports and state ownership.                                         | The neutral session coordinator may use both rule modules, but category and expense UI modules do not import or control one another. |
| EXP-044 | Architecture audit | Inspect session state and dependencies.                                      | Derived output is not stored, and no service, repository, DI, global-state, form-library, or new runtime dependency is introduced.   |

## Group 8 — Validate and hand off

- [x] Run every automated quality gate listed in `validation.md`.
- [x] Complete the manual capture, correction, localization, keyboard, refresh-reset, responsive, and no-persistence checks.
- [x] Complete the referential-integrity, architecture, dependency-direction, and scope audits against `requirements.md` and `specs/techstack.md`.
- [x] Record the validation date, environment, and any accepted differences in `validation.md`.
- [ ] Align the Phase 4 roadmap wording with the implemented feature boundaries and mark Phase 4 complete only after every required check passes.

## Completion handoff

After the Phase 5 API-backed redesign, Phase 6 can provide the same capture boundary with validated multi-expense results from the same-origin classification API. Neither later phase may replace the cumulative session, correction, reassignment, selector, localization, or accessibility behavior established here.

## Current completion status — 2026-09-02

Implementation and current functional validation pass (96 tests and all six quality gates). See [evidence.md](evidence.md) for the coverage trace, story/browser review, and audit fixes. The remaining unchecked items concern historical test-first sequencing and final phase sign-off, not missing functionality. Earlier Group 4/5 test-first checkmarks have been corrected: production code preceded those tests. Acceptance of that process deviation is required before marking the phase complete.
