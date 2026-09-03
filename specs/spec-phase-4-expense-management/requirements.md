# Phase 4 Requirements — Expense Management

## Objective

Turn the existing expense, totals, and chart presentation into a complete session-only expense-management feature. The current page session can accumulate expense batches, reclassify and delete individual expenses, preserve referential integrity when categories are deleted, and derive every displayed result from the same in-memory collections.

This phase establishes interactive expense behavior with deterministic caller-supplied data. The API-backed redesign begins in Phase 5; natural-language extraction, the classification route, and the external AI provider begin in Phase 6.

## Requirements

- **R1 — Expense model:** Represent each expense as an immutable TypeScript value with a stable session identifier, a non-empty literal description, a positive integer amount in minor units, and a category identifier that references a category in the current session. Do not store formatted amounts, localized category names, percentages, or other derived presentation values on the expense.
- **R2 — Unified React session ownership:** Coordinate categories and expenses at a shared feature boundary using React state or a reducer. Initialize the expense collection once for the mounted page session, preserve it across rerenders and language changes, and reset it naturally on refresh or page closure. Do not read or write session data through browser storage, cookies, network requests, a server, or a database.
- **R3 — Pure expense behavior:** Implement expense batch addition, reclassification, deletion, category-deletion reassignment, grouping, totals, and chart-data selection as pure TypeScript functions. Return discriminated results for expected rejected operations rather than using exceptions for ordinary session outcomes. Do not duplicate these rules in event handlers or presentation components.
- **R4 — Cumulative batch addition:** Accept one or more caller-supplied expense candidates, with stable identifiers supplied at the feature boundary, and append every valid expense to the existing session without replacing earlier results. Reject an empty batch and invalid descriptions or amounts without partially mutating the previous collection. Normalize a missing or unknown category reference to permanent **Unclassified** so every accepted expense retains a valid category.
- **R5 — Deterministic Phase 4 capture boundary:** Expose an intention-revealing session operation that accepts a deterministic expense batch for the existing capture workflow, stories, and tests. A successful batch clears the current input and reports the localized extracted count through rat dialogue. A rejected or zero-item batch adds nothing and preserves the exact input for correction. Do not parse natural language, call an HTTP route, simulate provider heuristics, or require an API key in this phase.
- **R6 — Expense reclassification:** Let visitors move an expense immediately to any current category, including permanent **Unclassified**, using the category's stable identifier. Reject missing expenses or categories without changing the session. Reclassification changes only the category reference and preserves the expense identifier, description, and amount.
- **R7 — Expense deletion:** Let visitors delete any individual expense immediately without confirmation. Reject a missing expense without changing the session. Deletion must update the categorized results, category totals, overall total, and chart data in the same render.
- **R8 — Category deletion coordination:** Before deleting any eligible category, reassign every expense that references it to permanent **Unclassified**, then remove the category. Keep the existing protection for **Unclassified** and leave both collections unchanged when category deletion is rejected. Coordinate this transition as one session intention so no rendered state contains a dangling expense category reference.
- **R9 — Derived results and totals:** Derive categorized expense lists, per-category totals, the overall total, percentages, and chart slices from the current category and expense collections. Include current categories with zero totals where the interface calls for them, omit deleted categories, and keep chart and textual summaries synchronized. Do not store duplicated totals, percentages, grouped lists, or chart values in session state.
- **R10 — Localization and amount presentation:** Translate built-in category names from stable identities at render time, preserve custom category names and expense descriptions verbatim, and update all expense controls and accessible names when the locale changes. Display every amount as `$` followed by an ungrouped number with a `.` decimal separator and exactly two fractional digits in both English and Spanish (for example, `$1285.50`) while retaining integer minor units in state.
- **R11 — Accessible correction workflow:** Make expense reclassification and deletion keyboard-operable at desktop and narrow layouts with visible focus. Give every control an accessible name that identifies its purpose and expense target, use a native or equivalently accessible category selection control, and ensure category identity never depends on color alone. Route global success or informational feedback through rat dialogue.
- **R12 — Feature organization:** Keep expense types, pure rules, selectors, session coordination, and expense-specific presentation under cohesive feature boundaries. Use function components, Hooks, ordinary arguments and props, strict TypeScript types, and immutable updates. Do not introduce service classes, repository abstractions, dependency-injection containers, global-state libraries, form libraries, or new runtime dependencies for session-only behavior.
- **R13 — Component and Storybook coverage:** Add user-focused tests and deterministic stories for empty state, cumulative batches, reclassification, expense deletion, populated-category deletion, zero-result preservation, synchronized totals, English and Spanish, and representative desktop and narrow layouts. Keep fixtures independent of persistence, network access, uncontrolled randomness, and API keys.

## Decisions

- Represent monetary values as positive integer minor units and format them only at the presentation boundary.
- Generate expense identifiers at the feature boundary and inject deterministic identifiers in tests and stories.
- Add expenses in batches because Phase 6 will return multiple extracted expenses from one message.
- Treat the batch-producing boundary as a caller dependency in Phase 4. Deterministic fixtures can exercise the complete session transition without pretending to classify natural language.
- Coordinate category and expense transitions in the existing page-session boundary rather than making the category feature import expense behavior.
- Reassign populated categories to **Unclassified** before deletion and derive all downstream output from the resulting collections.
- Use stable result codes and translate feedback in the presentation layer.
- Delete expenses directly; confirmation and undo behavior are outside the initial release.

## Exclusions

- Natural-language parsing, extraction, classification heuristics, or mock AI behavior
- Classification HTTP routes, OpenRouter calls, provider clients, credentials, rate limiting, or server-side validation
- Manual expense entry or editing an expense description or amount
- Category renaming, manual category colors, or category descriptions for AI context
- Browser, server, or database persistence; accounts; synchronization; or durable history
- Currency codes, conversion, mixed-currency accounting, budgets, income, or recurring expenses
- Bulk selection, bulk deletion, undo, confirmation dialogs, filtering, search, pagination, or export
- Service or repository class hierarchies, global-state libraries, and new runtime dependencies

## Context

- `specs/mission.md` defines cumulative session behavior, correction controls, category-deletion reassignment, synchronized outputs, localization, and accessibility expectations.
- `specs/techstack.md` defines the immutable minor-unit model, React-memory session boundary, pure selectors, feature organization, formatting behavior, and quality gates.
- `specs/roadmap.md` keeps this phase focused on expense state and correction; the API-backed redesign begins in Phase 5 and natural-language AI classification begins in Phase 6.
- Phase 3 supplies stable category identifiers, permanent **Unclassified**, category operations, and localized category display names. Phase 4 must preserve those guarantees while coordinating expense references.
- Preserve the approved Phase 2 presentation and extend the current capture, results, spending, chart, and rat-dialogue components rather than redesigning the dashboard.
- Keep all new visible and accessible English and Spanish copy in the typed i18next dictionaries.

## Completion evidence

Phase 4 is complete when every requirement and exclusion has passed the automated, manual, accessibility, architecture, and scope checks recorded in this phase's `validation.md`.
