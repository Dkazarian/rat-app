# Phase 3 Validation — Category Management

Implementation is complete and ready for review when all of the following pass.

## Automated quality gates

- [ ] `npm run format:check` exits 0.
- [ ] `npm run lint` exits 0 with no warnings.
- [ ] `npm run typecheck` exits 0 with no type errors.
- [ ] `npm test` exits 0 with no failures.
- [ ] `npm run build-storybook` exits 0.
- [ ] `npm run build` exits 0 without an API key.

## Unit coverage

- [x] The initial-state function returns **Food**, **Home**, **Transport**, and **Unclassified** in the specified order with stable built-in identifiers. (R1, R2)
- [x] Built-in names are represented by stable identities while user-created names remain literal values. (R1, R7)
- [x] Creating a category trims its name, accepts an injected identifier, assigns a deterministic accessible color, and returns a new immutable category collection. (R4, R5)
- [x] Category operations do not mutate their input collection or existing category values. (R1, R4)
- [x] Empty and whitespace-only names are rejected with the expected validation code. (R4, R5)
- [x] A 24-character trimmed name is accepted and a 25-character trimmed name is rejected. (R4, R5)
- [x] Exact-case and mixed-case duplicates are rejected. (R4, R5)
- [x] Every built-in English and Spanish name remains reserved regardless of the active locale. (R5, R7)
- [x] The tenth category can be created and an eleventh category is rejected. (R4, R5)
- [x] Initial and user-created categories can be deleted without mutating the previous collection. (R4, R6)
- [x] Attempts to delete **Unclassified** return a rejected result without changing state. (R4, R6)
- [x] The muted color is assigned only to **Unclassified**, and custom colors are selected deterministically from the non-muted palette. (R1, R4, R5)

## Component and integration coverage

- [ ] A freshly rendered page displays exactly the four initial categories with zero totals. (R2, R3)
- [ ] Opening the creation workflow moves focus to the name field. (R8, R9)
- [ ] Cancel closes the workflow, discards the draft, and restores focus predictably. (R8, R9)
- [ ] Successful submission displays the new category immediately, clears the draft, closes the workflow, and restores focus predictably. (R3, R5, R8)
- [ ] Invalid input remains available for correction and its localized validation message is programmatically associated with and announced for the field. (R7–R9)
- [ ] Deleting an eligible category removes it immediately, while **Unclassified** has no delete action. (R3, R6, R9)
- [ ] Switching language updates built-in names and interface copy without resetting created or deleted categories. (R3, R7)
- [ ] User-created names remain unchanged when switching language. (R7)
- [ ] Category presentation receives state and callbacks through React props or a feature Hook and does not import persistence, network, repository, or service implementations. (R3, R10)
- [ ] Any global category feedback is rendered through rat dialogue, while validation remains beside the field. (R9)

## Storybook checks

- [ ] Category stories cover the default list, open creation form, validation, and category-limit states. (R11)
- [ ] Representative English and Spanish stories render built-in and user-created names correctly. (R7, R11)
- [ ] Stories remain deterministic and require no storage, network request, randomness, or API key. (R11)

## Manual checks

- [ ] A fresh page shows exactly **Food**, **Home**, **Transport**, and **Unclassified** in English.
- [ ] Switching to Spanish localizes the built-in names and controls.
- [ ] Create a category with surrounding whitespace and confirm the trimmed name appears immediately.
- [ ] Try empty, duplicate, reserved, overlength, and category-limit submissions and confirm each gives clear field-level feedback without losing the draft.
- [ ] Confirm **Unclassified** has no delete action and every other category can be deleted.
- [ ] Create and delete categories, switch languages in both directions, and confirm the session state is preserved.
- [ ] Refresh and confirm the initial four categories return and all session changes disappear.
- [ ] Confirm no category operation produces a network request or writes to local storage, IndexedDB, cookies, or another persistence mechanism.
- [ ] Complete creation, cancellation, validation, and deletion using only the keyboard with visible focus throughout.
- [ ] Repeat the workflow at a representative desktop width and at 390 px without overlap or page-level horizontal scrolling.
- [ ] Review every required category story in English and Spanish.

## Accessibility and copy checks

- [ ] Every category action has an accessible name that identifies its purpose and target.
- [ ] Focus moves predictably when the inline form opens, closes, succeeds, or reports validation feedback.
- [ ] Validation is programmatically associated with the input and announced appropriately.
- [ ] Category identity and available actions remain understandable without relying on color alone.
- [ ] All new visible and accessible copy exists in both typed localization dictionaries.
- [ ] Rat dialogue remains the voice for global feedback; field-specific problems remain beside the category input.

## Architecture and scope audit

- [ ] Category session state is owned by React and initialized once for the mounted page session. (R3)
- [ ] Category rules are pure TypeScript functions and are not duplicated in components or event handlers. (R4)
- [ ] The implementation contains no category service class, repository abstraction, dependency-injection container, global-state library, or unnecessary runtime dependency. (R10)
- [ ] No category data is persisted or sent over the network. (R3)
- [ ] No expense-session, classification-route, AI-provider, or persistence behavior was introduced.
- [ ] No category renaming, manual color selection, or clear-session action was added.
- [ ] The approved Phase 2 presentation was extended without an unrelated redesign.

## Definition of done

All automated tests pass, all manual and accessibility checks are confirmed, and no debug code, ignored failures, or unrelated feature work remains. Record the validation date, environment, and any accepted differences below before marking Phase 3 complete in the roadmap.

Validated on:

Environment:

Accepted differences:
