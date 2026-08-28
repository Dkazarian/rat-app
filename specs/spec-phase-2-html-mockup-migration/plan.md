# Phase 2 Plan — HTML Mockup Migration

## Group 1 — Establish presentation contracts

- [x] Generate the proposed component separation map and save it as `docs/ratapp-component-map-v2.png`. (R1, R3)
- [x] Inventory the mockup's layout, states, responsive changes, copy, and approved assets. (R1, R2)
- [x] Define typed category, expense, feedback, chart, locale, and page-state props. (R4)
- [x] Create deterministic fixtures for every required interface state. (R5)
- [x] Add minor-unit amount and localized display helpers. (R7)

## Group 2 — Build the component system

- [x] Implement `AppShell`, `Header`, `LanguageControl`, and `Footer`. (R3)
- [x] Implement `CapturePanel`, `Mascot`, `RatDialogue`, and `ExpenseInput`. (R3, R8)
- [x] Implement `DashboardLayout`, `CategoryPanel`, and reusable `CategoryItem` rows. (R3)
- [x] Implement `ResultsPanel`, `SpendingSummary`, `SpendingChart`, and reusable `SpendingCategoryPercentItem` rows. (R3, R7, R8)
- [x] Implement `ExpenseList` and reusable `ExpenseItem` rows. (R3, R7, R8)

## Group 3 — Compose the responsive page

- [x] Replace the scaffold page with the fixture-driven dashboard. (R1, R5)
- [x] Match the approved desktop layout and styling. (R1)
- [x] Match the approved narrow layout without overflow or overlap. (R1)
- [x] Preserve source reference files and mascot assets unchanged. (R2)

## Group 4 — Complete localization and accessibility

- [x] Move all visible and accessible copy into synchronized English and Spanish dictionaries. (R6)
- [x] Connect immediate, session-only `EN`/`ES` switching. (R6)
- [x] Add semantic regions, labels, keyboard focus, and feedback announcements. (R8)
- [x] Add reduced-motion behavior and non-color category identification. (R8)

## Group 5 — Add Storybook and tests

- [x] Add isolated stories for each principal component and meaningful variant. (R9)
- [x] Add bilingual page compositions and keep responsive testing available through viewport controls. (R9)
- [x] Add stories for every deterministic page state. (R5, R9)
- [x] Add focused tests for localization, feedback semantics, accessible labels, and chart-data consistency. (R6–R8)

## Group 6 — Validate and hand off

- [x] Run every automated quality gate listed in `validation.md`.
- [x] Complete desktop and narrow side-by-side parity reviews.
- [x] Complete Storybook, accessibility, and scope reviews.
- [x] Record results and accepted differences in `validation.md`.

## Completion handoff

After Phase 2 passes validation, Phase 3 can connect the prop-driven interface to in-memory session behavior without redesigning the presentation layer.
