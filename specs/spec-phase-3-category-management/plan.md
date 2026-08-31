# Phase 3 Plan — Category Management

## Group 1 — Establish the category feature model

- [x] Define immutable category, built-in identity, custom-name, identifier, color, and validation-result types. (R1, R4)
- [x] Define the four-category initial-state factory with stable built-in identifiers and the required order. (R1, R2)
- [x] Separate stable built-in identity from localized display names so custom names remain literal. (R1, R7)
- [x] Move category-specific presentation contracts out of the general dashboard presentation types where ownership is unambiguous. (R10)

## Group 2 — Implement and test pure category behavior

- [x] Implement pure name normalization and validation for empty, length, duplicate, reserved-name, and category-limit rules. (R4, R5)
- [x] Implement deterministic color selection from the non-muted palette, reserving muted for **Unclassified**. (R4, R5)
- [x] Implement pure category creation using an identifier supplied by the caller. (R4, R5)
- [x] Implement pure category deletion with permanent **Unclassified** protection. (R4, R6)
- [x] Add focused unit tests for every rule, boundary, stable result code, deterministic color, and immutability guarantee listed in `validation.md`. (R1, R2, R4–R7)

## Group 3 — Add React-owned session coordination

- [x] Create a category feature Hook that lazily initializes the fresh-session categories and owns them with React `useState`. (R2, R3)
- [x] Generate custom category identifiers at the feature boundary and pass them into the pure creation function. (R4, R5)
- [x] Expose intention-revealing create and delete operations plus stable validation results to the presentation layer. (R3–R6)
- [x] Keep category state independent of the selected locale so language changes cannot reset the session. (R3, R7)
- [x] Compose the Hook at the dashboard's interactive client boundary without adding context or a global-state dependency. (R3, R10)

## Group 4 — Extend the category interface

- [x] Relocate the category panel, item, tests, and stories under a cohesive category feature boundary; add the form there and update imports without redesigning the dashboard. (R8, R10)
- [x] Add the inline creation form with localized label, add action, cancel action, and field-level validation. (R7–R9)
- [x] Preserve invalid drafts, clear successful drafts, and discard canceled drafts. (R8)
- [x] Add delete actions for eligible categories and omit the action for **Unclassified**. (R6, R9)
- [x] Keep all displayed category totals at zero and leave expense-derived presentation fixture-only until Phase 4. (R2)
- [x] Route any global category success or informational feedback through the existing rat-dialogue presentation. (R9)

## Group 5 — Complete localization, focus, and responsive behavior

- [x] Add synchronized typed English and Spanish copy for creation, cancellation, deletion actions, validation, and accessible labels. (R7, R9)
- [x] Translate built-in names from stable identities at render time while rendering custom names verbatim. (R1, R7)
- [x] Move focus into the creation field when opened and restore it predictably after cancel or successful creation. (R8, R9)
- [x] Associate validation with the input, announce it appropriately, and retain visible focus for the complete keyboard workflow. (R9)
- [x] Verify the extended category panel at representative desktop and 390 px widths without overlap or horizontal scrolling. (R8, R9)

## Group 6 — Add component tests and Storybook states

- [x] Add user-focused component tests for fresh state, creation, validation retention, cancellation, deletion, and protected **Unclassified** behavior. (R2–R6, R8, R9)
- [x] Add a language-switching test that preserves created and deleted categories while translating built-ins only. (R3, R7)
- [x] Add deterministic stories for the default, open-form, validation, and category-limit states. (R11)
- [x] Add representative English and Spanish story compositions with both built-in and custom names. (R7, R11)
- [x] Confirm tests and stories do not rely on storage, network access, uncontrolled randomness, or an API key. (R3, R11)

## Group 7 — Validate and hand off

- [x] Run every automated quality gate listed in `validation.md`.
- [x] Complete the manual keyboard, localization, refresh-reset, responsive, and no-persistence checks.
- [x] Complete the architecture and scope audit against `requirements.md` and `specs/techstack.md`.
- [x] Record the validation date, environment, and any accepted differences in `validation.md`.
- [x] Mark Phase 3 complete in `specs/roadmap.md` only after all required checks pass.

## Completion handoff

After Phase 3 passes validation, Phase 4 can extend the same React-owned session with expenses, reassign expenses to permanent **Unclassified** during category deletion, and derive totals and chart data from the expense collection.
