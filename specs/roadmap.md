# Ratapp Roadmap

## Intended initial release

A responsive, publicly hosted classification demo in which a visitor adjusts session-only categories, describes one or more expenses naturally, reviews and corrects AI classifications, and sees cumulative categorized results and a synchronized spending chart in English or Spanish.

The roadmap remains outcome-oriented. Implementation details and decisions are documented in that phase's specification folder when the phase begins, and each phase ends with an observable review point.

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

## Phase 5 — AI classification API

- Same-origin classification API connected to the configured AI provider
- English and Spanish multi-expense extraction using the visitor's current categories
- Validated results with unknown classifications assigned to **Unclassified**
- Cumulative success and recoverable failure behavior
- Server-only provider credentials and safe error responses

## Phase 6 — Public demo release

- Responsive, bilingual, accessibility, privacy, and failure-recovery review
- Public API safeguards and privacy-conscious operations
- Complete automated checks and project documentation
- Vercel deployment with protected server configuration
- Production workflow verification

---

## Deferred beyond the initial release

Category renaming, manual category colors, AI-facing category descriptions, expense editing, manual expense entry, accounts, persistence, synchronization, financial integrations, budgets, recurring expenses, currency conversion, additional languages, model training, and native applications remain outside the initial release until explicitly promoted.

## Mission trace

| Mission outcome | Roadmap coverage |
| --- | --- |
| Faithful React and Storybook migration | Phases 1–2 |
| Session-only category controls | Phase 3 |
| Cumulative results, correction, totals, and chart | Phases 4 and 4.5 |
| Multi-expense bilingual AI classification | Phase 5 |
| Clear success and recoverable failure behavior | Phase 5 |
| Accessible English and Spanish experience | Phases 2–6 |
| Safe publicly hosted demo | Phase 6 |
