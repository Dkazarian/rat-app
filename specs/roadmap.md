# Ratapp Roadmap

## Intended initial release

A responsive, playful web demo in which a user creates custom categories, describes one or more `$`-denominated expenses naturally, reviews AI classifications, corrects them when needed, and sees persistent categorized lists and a synchronized spending chart.

Detailed tasks, acceptance cases, and implementation notes belong in a dated phase specification rather than this roadmap.

## Phase 0 — Product and UI design

Status: Complete

Outcome: The core expense-capture experience has an agreed information architecture, interaction model, responsive layout, and visual direction that can guide implementation without relying on guesswork.

Scope:

- Discuss and define the primary user flow from category setup and natural-language entry through classification review and spending insight.
- Explore the interface through rough sketches, wireframes, and progressively higher-fidelity mockups.
- Define desktop and mobile layouts for expense entry, category management, the five deletable default categories, **Unclassified** expenses, categorized lists, totals, and the pie or donut chart.
- Specify important empty, loading, success, partial-success-as-success, complete-extraction-failure, provider-error, and retry states.
- Establish the playful visual direction, category color behavior, accessible hierarchy, and appropriate placements for the rat mascot.
- Design rat dialogue-bubble variants for success, error, warning, progress, and informational feedback across desktop and narrow screens.
- Design a compact EN/ES sliding segmented control and validate both layouts with representative English and Spanish copy, including text expansion.
- Select a provisional mascot asset while allowing a later human-drawn replacement.

Completion evidence:

- At least one approved desktop mockup and one approved narrow-screen mockup cover the complete core workflow.
- The mockups identify component hierarchy, primary actions, responsive changes, and all important system states.
- Feedback mockups show concise rat dialogue, any required recovery action, and how field-level validation remains connected to its source.
- Approved desktop and narrow-screen mockups show the language control and the complete core workflow in both English and Spanish.
- The design remains understandable without color alone and includes keyboard focus and readable-chart considerations.
- Material design decisions are reflected in the mission and technical constraints; unresolved choices are explicitly labeled.

Dependencies: None.

## Phase 1 — Local expense workspace

Status: Not started

Outcome: A user can manage categories and expenses in a responsive single-page workspace, with changes surviving refresh.

Scope:

- Scaffold the approved Next.js, TypeScript, and Tailwind baseline.
- Implement the approved playful visual system, responsive layouts, accessible interaction patterns, and reserved rat-mascot placements from Phase 0.
- Implement the reusable, accessible rat-dialogue feedback component defined in Phase 0.
- Implement typed English and Spanish message dictionaries, the accessible EN/ES segmented slider, immediate locale switching, and persisted locale preference.
- Provision **Food**, **Home**, **Transport**, **Fun**, and **Unclassified** for a new workspace, then support rename, recolor, and safe deletion for every category, including those defaults.
- Implement the expense and category data model, local persistence, validation, and migration boundary.
- Provide editable local expense records, **Unclassified** grouping, and safe category-deletion reassignment without requiring the AI integration.

Completion evidence:

- Category and expense interactions work by keyboard and at representative mobile and desktop widths.
- Valid state survives refresh; invalid stored data fails safely.
- Deleting a used category requires reassignment; **Unclassified** is the default destination unless it is being deleted.
- Unit and component tests cover the local domain rules.

Dependencies: Phase 0.

## Phase 2 — Natural-language AI capture

Status: Not started

Outcome: A user can submit a sentence containing one or several expenses and receive a validated, editable batch classified into current categories.

Scope:

- Add the server-only `/api/classify` boundary and OpenRouter configuration.
- Use `google/gemma-4-26b-a4b-it:free` as the initial configurable model.
- Extract descriptions and currency-neutral `$` amounts, normalize unknown categories to **Unclassified**, and accept any non-empty usable subset as success.
- Accept natural-language expense batches in English and Spanish while preserving user wording.
- Add loading, retry, provider error, malformed-output, and preserved-input behavior.
- Allow review, correction, editing, and deletion of returned expenses.

Completion evidence:

- A multi-expense sentence produces separate valid records through a mocked deterministic integration test.
- No provider credential reaches the client bundle or response payload.
- Partially usable provider output saves the valid expenses and presents the ordinary success state.
- A result with zero usable expenses saves nothing, shows the confused-rat error, and retains the user's original textarea content.
- Provider failures retain the user's original text and expose a retry action.
- A manual test with the configured OpenRouter model validates the live integration when an API key is available.

Dependencies: Phase 1.

## Phase 3 — Spending story and playful presentation

Status: Not started

Outcome: Users can understand where their money went at a glance through synchronized totals, categorized lists, and an engaging visual summary.

Scope:

- Add overall and per-category totals derived from stored expenses.
- Add the donut or pie chart with accessible legend and textual equivalents.
- Refine category grouping, **Unclassified** presentation, empty states, friendly copy, motion, and visual hierarchy.
- Integrate the selected `public/assets/rat-mascot.png` artwork in suitable empty, welcome, or feedback states without letting it compete with financial information.
- Refine rat dialogue tone, responsive placement, visual variants, and transitions while respecting reduced-motion preferences.
- Complete and review English and Spanish chart labels, empty states, review copy, and rat dialogue for equivalent meaning and tone.

Completion evidence:

- Adding, editing, reclassifying, or deleting an expense updates list totals and chart data immediately from one source of truth.
- Chart information remains understandable without color and when the chart cannot be perceived.
- Reduced-motion, focus, contrast, mobile layout, and empty-state checks pass.

Dependencies: Phases 1 and 2.

## Phase 4 — Demo hardening and handoff

Status: Not started

Outcome: The complete core workflow can be demonstrated reliably, configured safely, and run by someone other than its author.

Scope:

- Complete automated quality gates and the end-to-end core-flow smoke test.
- Add server timeout, rate-limit, privacy warning, safe logging, and error-boundary behavior.
- Document local setup, environment configuration, testing, production build, and deployment requirements.
- Validate a production build and a server-capable deployment target.

Completion evidence:

- Formatting, lint, strict type checking, unit/component/route tests, accessibility scan, end-to-end smoke test, and production build pass.
- A fresh setup succeeds using repository documentation and `.env.example` without exposing a secret.
- The deployed demo completes the workflow or presents a recoverable message when OpenRouter is unavailable.
- The English and Spanish end-to-end workflows pass, including language persistence and switching without data loss.

Dependencies: Phases 1 through 3.

## Deferred beyond the initial release

Authentication, cloud synchronization, database persistence, financial integrations, currency codes or conversion, mixed-currency accounting, languages beyond English and Spanish, budgets, recurring expenses, model training from corrections, native applications, and user-authored category descriptions supplied to the AI as classification context remain outside active phases until explicitly promoted through a constitution update.

## Mission trace

| Mission outcome | Roadmap coverage | Primary technical constraint |
| --- | --- | --- |
| Custom category control | Phase 1 | Stable category IDs and safe local persistence |
| Useful but fully editable defaults | Phases 0–1 | Five first-run categories, safe reassignment, and on-demand `unclassified` recreation |
| Multi-expense natural-language capture | Phase 2 | Server-only OpenRouter route and validated structured output |
| Classification correction | Phases 1–2 | Editable records and unknown-category normalization to `unclassified` |
| English and Spanish experience | Phases 0–4 | Typed dictionaries, accessible locale control, bilingual AI input, and locale persistence |
| Synchronized lists, totals, and chart | Phase 3 | Derived aggregates from one expense collection |
| Playful, responsive, accessible experience | Phases 0, 1, and 3 | Approved mockups, Tailwind design system, and accessibility constraints |
| Reliable, safe demo operation | Phase 4 | Secret isolation, bounded failures, tests, and server-capable deployment |
