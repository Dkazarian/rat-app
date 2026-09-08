# Ratapp Roadmap

## Intended initial release

A responsive, publicly hosted classification demo in which a visitor adjusts session-only categories, describes one or more expenses naturally, reviews AI classifications, and sees cumulative categorized results and a synchronized spending chart in English or Spanish. Anonymous session data expires after 48 hours.

The roadmap remains outcome-oriented. Implementation details and decisions are documented in that phase's specification folder when the phase begins, and each phase ends with an observable review point.

Current architecture and source placement are documented in the [technical baseline](techstack.md) and [source guide](../src/README.md). Services live separately from feature UI; historical phase descriptions below retain the implementation approach used at that time.

---

## Phase 0 — Product and UI design ✅

- Core workflow from category setup through classification review and visualization
- Responsive desktop and mobile layouts for the principal interface states
- English and Spanish copy, rat dialogue, and language control
- Approved HTML mockup and mascot assets

## Phase 1 — React project foundation ✅

- Next.js, React, strict TypeScript, and Tailwind CSS foundation
- Storybook environment for isolated component and page-state review
- Application, component, localization, asset, story, and test structure
- Development, quality, test, Storybook, and production-build commands

## Phase 2 — HTML mockup migration ✅

- Approved mockup reproduced as reusable, prop-driven React components
- Responsive visual parity at representative desktop and narrow widths
- Complete typed English and Spanish localization
- Storybook coverage for principal components and interface states
- Accessible, deterministic presentation without persistence or live AI integration

## Phase 3 — Category management ✅

- Category feature model, pure rules, and React-owned session coordination
- Initial **Food**, **Home**, **Transport**, and permanent **Unclassified** categories
- Create and delete categories within the product rules
- Bilingual validation and keyboard-accessible controls
- Session categories survive language changes and reset on refresh

## Phase 4 — Expense management (implemented; process sign-off pending)

- Immutable expense model, pure rules, derived selectors, and shared React session coordination
- Cumulative expense capture within the current session
- Reclassify and delete expenses
- Move expenses to **Unclassified** when their category is deleted
- Synchronized categorized results, totals, and spending chart

Functional validation passed on 2026-09-02. Final sign-off awaits acceptance of the historical test-first process deviation documented in [Phase 4 evidence](spec-phase-4-expense-management/evidence.md).

## Phase 4.5 — Category and expense service refactor ✅

- Category and expense services with typed domain errors and session-scoped instances
- Independent expense-candidate validation with partial batch acceptance and bilingual skipped-item feedback
- Explicit expense reassignment before guarded category deletion
- React snapshots synchronized from service results, with totals and chart data still derived
- Regression coverage for session isolation, sequential operations, and existing category and expense workflows

This intermediate phase records the refactor between expense management and AI integration. Its [requirements](spec-phase-4-5-service-refactor/requirements.md) describe the changes to the earlier architecture and operation contracts; its [validation checklist](spec-phase-4-5-service-refactor/validation.md) tracks acceptance separately from the historical Phase 4 evidence.

Validated on 2026-09-03: all six automated gates, 106 tests, and bilingual desktop/narrow browser workflows pass.

## Phase 5 — Redesign ✅

- Replace browser-owned category and expense services with a server API as the source of truth
- Remove remains of deferred expense reclassification and deletion features
- Create a short-lived Redis-backed anonymous session and associate subsequent requests with it
- Start production sessions without category records; treat Unclassified as an implicit fallback bucket
- Load category totals and expenses from the API
- Submit expense prompts through the session API, ready for the Phase 6 AI implementation
- Create and delete categories through API operations
- Replace the current service-oriented Hooks with section-owned queries and mutations plus a small refresh coordinator
- Simplify dashboard composition by removing feature-specific rendered-element layout props
- Rewrite domain rules in the backend and remove the current client-side category, expense, and session services
- Provide deterministic Redis seed data for API and dashboard testing before live AI integration
- Preserve category-deletion cascading behavior and the existing session-only product experience

Detailed HTTP contracts and session-transport decisions are defined in the [Phase 5 requirements](spec-phase-5-redesign/requirements.md).

Validated on 2026-09-03: unit/component and Upstash integration suites, lint, strict TypeScript, Storybook, production build, and bilingual seeded browser review pass.

## Phase 6 — AI classification API ✅

- Same-origin classification API connected to the configured AI provider
- English and Spanish multi-expense extraction using the visitor's current categories
- Validated results with unknown classifications assigned to **Unclassified**
- Cumulative success and recoverable failure behavior
- Server-only provider credentials and safe error responses
- Category names as the only custom-category context supplied to the AI

Validated on 2026-09-08: all six automated gates, 98 tests, the opt-in live `gpt-4.1-nano` integration test, privacy/architecture review, and representative bilingual desktop/narrow browser workflows pass. Detailed evidence and accepted environment differences are recorded in the [Phase 6 validation checklist](spec-phase-6-ai-classification-api/validation.md).

## Phase 7 — Public demo release

- Responsive, bilingual, accessibility, privacy, and failure-recovery review
- Public API safeguards
- Complete automated checks and project documentation
- Vercel deployment with protected server configuration
- Production workflow verification
- Review-only expense results, without reclassification or deletion controls

## Phase 8 — Post-release expense controls

- Reclassify an expense into another category or **Unclassified**
- Delete an expense from the active session
- Keep lists, totals, and the spending chart synchronized after either action
- Add bilingual, accessible controls and regression coverage

---

## Deferred beyond the initial release

Custom-category descriptions supplied to the AI remain a future idea. Category renaming, manual category colors, other expense editing, and manual expense entry also remain outside the initial release until explicitly promoted.

## Mission trace

| Mission outcome | Roadmap coverage |
| --- | --- |
| Faithful React and Storybook migration | Phases 1–2 |
| Session-only category controls | Phase 3 |
| Cumulative results, totals, and chart | Phases 4, 4.5, and 5 |
| Server-backed anonymous session | Phase 5 |
| Multi-expense bilingual AI classification | Phase 6 |
| Clear success and recoverable failure behavior | Phase 6 |
| Accessible English and Spanish experience | Phases 2–7 |
| Safe publicly hosted demo | Phase 7 |
| Expense reclassification and deletion | Phase 8 |
