# Phase 3 Requirements — Category Management

## Objective

Turn the existing category presentation into a complete session-only category-management feature. Visitors can inspect the initial categories, create their own categories, and delete any category except permanent **Unclassified**.

This phase introduces interactive category state only. Expense behavior begins in Phase 4, the API-backed redesign begins in Phase 5, and live classification begins in Phase 6.

## Requirements

- **R1 — Category model:** Represent each category as an immutable TypeScript value with a stable session identifier, an accessible color token, and enough information to distinguish localized built-in names from literal user-created names. Mark permanent **Unclassified** as a system category without deriving its behavior from its translated label.
- **R2 — Initial state:** Initialize each fresh page session with **Food**, **Home**, **Transport**, and **Unclassified**, in that order, using stable built-in identifiers. Keep all category totals at zero until Phase 4 introduces interactive expenses.
- **R3 — React session ownership:** Own the current category collection in a category feature Hook using React state or a reducer. Initialize it once for the mounted page session, preserve it across component rerenders and language changes, and reset it naturally on refresh or page closure. Do not read or write category data through browser storage, cookies, network requests, a server, or a database.
- **R4 — Pure category behavior:** Implement category validation, creation, deletion, and deterministic color selection as pure TypeScript functions. Event handlers and presentation components call these feature operations instead of duplicating rules. Return discriminated success or validation results for expected outcomes rather than using exceptions for ordinary field errors.
- **R5 — Category creation:** Trim names before validation and storage. Reject empty or whitespace-only names, names longer than 24 characters after trimming, case-insensitive duplicates, and creation beyond ten total categories. Reserve the English and Spanish names of every built-in category regardless of the current locale. Give each valid category a stable session identifier and a deterministic color from the existing non-muted palette, then display it immediately without navigation or reload.
- **R6 — Category deletion:** Do not present a delete action for **Unclassified**, and reject any attempted deletion of it without changing state. Allow initial and user-created categories to be deleted immediately without confirmation. Category deletion does not perform expense reassignment in this phase because no interactive expense state exists yet.
- **R7 — Localization:** Translate built-in category names from their stable identities at render time. Preserve user-created names exactly as accepted and never translate them. Switching between English and Spanish updates built-in labels, controls, validation, and accessible names without recreating or otherwise changing the category session.
- **R8 — Inline creation workflow:** Extend the existing category panel rather than redesigning it. The **New** action reveals an inline name field with add and cancel actions and moves focus to the field. Invalid input remains available for correction. Successful creation clears and closes the form. Cancel discards the draft. Focus returns predictably when the workflow closes.
- **R9 — Accessible actions and feedback:** Make creation, cancellation, validation, and eligible deletion keyboard-operable at desktop and narrow layouts with visible focus. Associate localized field validation with the input and announce it appropriately. Give each delete action an accessible name that identifies its target. Keep field-specific errors beside the input; any global success or informational message uses the existing rat-dialogue presentation.
- **R10 — Feature organization:** Organize category types, pure rules, session coordination, and feature-specific presentation under a cohesive category feature boundary. Use function components and Hooks, ordinary function arguments and props, and strict TypeScript types. Do not introduce category service classes, repository abstractions, dependency-injection containers, global-state libraries, or new runtime dependencies for session-only state.
- **R11 — Storybook coverage:** Provide deterministic category stories for the default list, open creation form, localized validation, category limit, and representative English and Spanish states. Keep stories independent of network access, persistence, randomness, and API keys.

## Decisions

- Generate custom identifiers at the feature boundary with a browser capability such as `crypto.randomUUID()`, then pass the identifier into pure creation logic so tests remain deterministic.
- Select colors deterministically from the existing non-muted category palette. Reserve the muted token for **Unclassified** and do not expose manual color selection.
- Use stable validation codes from the category feature and translate those codes in the presentation layer.
- Delete eligible categories directly because interactive expenses do not exist until Phase 4.
- Keep derived spending output at zero and do not store synchronized category totals in category session state.
- Prefer the existing React and browser capabilities; no new runtime dependency is needed.

## Exclusions

- Category renaming, manual color selection, and AI-facing category descriptions
- Expense capture, accumulation, reassignment, reclassification, or deletion
- Spending totals and chart derivation from live session data
- Classification routes, mock classifiers, and AI-provider integration
- Browser, server, or database persistence
- A clear-session action
- Service classes, repository adapters, or asynchronous storage behavior for categories

## Context

- `specs/mission.md` defines the category rules, session boundary, localization behavior, accessibility expectations, and deferred work.
- `specs/techstack.md` defines the feature-oriented React architecture, React-memory session model, localization system, and quality gates.
- `specs/roadmap.md` keeps this phase focused on category management; expense behavior begins in Phase 4.
- Preserve the approved layout and visual language from Phase 2 while moving category-specific code into a cohesive feature boundary.
- Keep all visible and accessible English and Spanish copy in the typed i18next dictionaries.

## Completion evidence

Phase 3 is complete when every requirement and exclusion has passed the checks recorded in `validation.md`.
