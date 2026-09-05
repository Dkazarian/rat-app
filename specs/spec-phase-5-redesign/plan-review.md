# Phase 5 Plan Review

The completed Phase 5 plan remains a historical record. The product scope changed afterward, so the following work should be handled as a separate alignment pass.

## Changes to make

- [x] Change the anonymous session TTL from 24 hours (`86400` seconds) to 48 hours (`172800` seconds) in configuration, `.env.example`, Redis behavior, tests, and supporting documentation.
- [x] Remove expense reclassification and deletion from the initial-release implementation.
- [x] Remove their route handlers, browser API methods, UI controls, domain entry points, response types used only by those operations, and dedicated tests and stories.
- [x] Keep `GET /session/:sessionId/expenses`; initial-release visitors still need to review extracted expenses.
- [x] Keep category deletion and its atomic cascade, which sets affected expenses to `categoryId: null` (**Unclassified**).
- [x] Update Phase 5 `requirements.md` so it no longer requires expense reclassification or deletion.
- [x] Keep the deferred endpoints documented under the post-release expense-controls phase.
- [x] Re-run formatting, lint, type checking, tests, Storybook, and the production build after the changes.
