# Ratapp Roadmap

## Intended initial release

A responsive, publicly hosted classification demo in which a visitor adjusts session-only categories, describes one or more expenses naturally, reviews and corrects AI classifications, and sees cumulative categorized results and a synchronized spending chart in English or Spanish.

Detailed implementation decisions belong in dated phase specifications. Each roadmap phase ends with an observable review point.

## Phase 0 — Product and UI design

Status: Complete

Outcome: The core workflow, responsive layout, major interface states, and playful visual direction are represented by an approved HTML mockup and supporting assets.

Scope:

- Define the flow from category setup and natural-language entry through classification review and visualization.
- Establish desktop and mobile layouts, accessible hierarchy, category color behavior, and mascot placement.
- Represent empty, loading, success, extraction-failure, provider-error, and retry states.
- Define rat dialogue variants and the compact English/Spanish language control.
- Select the provisional mascot assets.

Completion evidence:

- `docs/ui-mockup.html` provides the visual source for the initial React migration.
- Desktop and narrow layouts cover the principal workflow and feedback states.
- English and Spanish variants are represented with realistic copy.

Dependencies: None.

## Phase 1 — React project foundation

Status: Not started

Outcome: The repository has a maintainable React development environment in which the approved interface can be migrated and reviewed component by component.

Scope:

- Scaffold Next.js, React, strict TypeScript, and Tailwind CSS.
- Configure Storybook for isolated component and page-state review.
- Establish the application, component, story, asset, localization, and test structure.
- Add standard development, Storybook, formatting, linting, type-checking, test, and production-build commands.
- Add only the dependencies needed by the approved technical baseline.

Completion evidence:

- The application and Storybook start from documented commands.
- A production build, formatting check, lint check, and strict type check pass.
- A representative component story verifies that Tailwind styles and public assets work in both environments.

Dependencies: Phase 0.

## Phase 2 — HTML mockup migration

Status: Not started

Outcome: The approved HTML mockup is faithfully reproduced as reusable React components before intentional product or visual changes are introduced.

Scope:

- Decompose the mockup into reusable layout, capture, category, result, chart, language-control, mascot, and rat-dialogue components.
- Reproduce the complete responsive dashboard in React using fixture data.
- Preserve the mockup's typography, spacing, hierarchy, colors, assets, and desktop-to-mobile behavior.
- Move English and Spanish copy into complete typed dictionaries and reproduce the language variants.
- Add Storybook stories for the components, responsive compositions, and important empty, loading, success, and error states.
- Keep components driven by explicit props so later session and provider logic can be added without rewriting their presentation.

Completion evidence:

- Side-by-side review shows close visual parity with the approved HTML at representative desktop and narrow widths.
- Storybook exposes the principal components and interface states in English and Spanish.
- The migrated page contains no persistence or live AI integration and renders deterministically from fixtures.
- Keyboard focus, semantic labels, and reduced-motion behavior represented by the mockup are preserved.

Dependencies: Phase 1.

## Phase 3 — Interactive session

Status: Not started

Outcome: The migrated interface behaves as a complete session-only demo using deterministic fixture classifications.

Scope:

- Add in-memory React state with no browser or server-side persistence.
- Start every session with **Food**, **Home**, **Transport**, and permanent **Unclassified**.
- Create categories subject to the ten-category and 24-character-name rules, assigning colors from an accessible palette.
- Delete any category except **Unclassified** and move its expenses to **Unclassified**.
- Accumulate fixture classification batches during the page session.
- Reclassify and delete expenses without editing their description or amount.
- Derive categorized lists, totals, and chart data from the same expense collection.
- Reset the complete demo naturally on refresh; do not add a clear-session action.
- Connect immediate English/Spanish switching without persistence.

Completion evidence:

- Category creation, category deletion, reclassification, and expense deletion work by keyboard and at representative responsive widths.
- Every supported change updates lists, totals, and the chart immediately from one source of truth.
- Deleting a populated category moves its expenses to permanent **Unclassified**.
- Refreshing restores the initial categories and clears all session changes without accessing browser storage.
- Component and unit tests cover the session rules and derived visualization data.

Dependencies: Phase 2.

## Phase 4 — AI classification

Status: Not started

Outcome: Visitors can replace fixture submissions with validated English or Spanish AI extraction and classification through a server-only provider boundary.

Scope:

- Add the same-origin `POST /api/classify` route and server-only OpenRouter configuration.
- Accept messages of up to 500 characters and amounts written with or without `$`.
- Send the current category IDs and names to the configured model and request structured output.
- Validate response items independently, produce concise descriptions, normalize unknown categories to **Unclassified**, and convert amounts to integer minor units.
- Treat any non-empty usable subset as normal success, add the results, clear the input, and report **“Extracted X expenses.”**
- When zero expenses are usable or the provider fails, add nothing and preserve the exact input for correction or retry.
- Keep prior session categories and expenses usable while classification is loading or unavailable.
- Implement localized progress, success, validation, provider-error, and retry feedback through rat dialogue and inline validation.

Completion evidence:

- Deterministic route tests cover English and Spanish input, full success, partial usable success, unknown-category normalization, zero-usable-item failure, malformed output, timeout, and rate limiting.
- A multi-expense submission creates separate cumulative results and updates the chart.
- Successful submissions clear the input and report the extracted count; zero-result and provider failures preserve the exact input.
- No provider credential, hidden prompt, or raw provider error reaches the browser.
- A manual test validates the configured live model when a development API key is available.

Dependencies: Phase 3.

## Phase 5 — Public demo release

Status: Not started

Outcome: The complete demo is accessible, safe to expose anonymously, and reliably deployed on Vercel.

Scope:

- Complete responsive, bilingual, accessibility, and reduced-motion review.
- Enforce request and category bounds on both client and server.
- Add anonymous classification rate limiting with localized rat feedback.
- Add a concise notice that submitted text is sent to an external AI provider.
- Log request IDs, outcomes, and latency without raw expense text, secrets, or unnecessary model data.
- Complete automated unit, component, route, accessibility, and end-to-end checks.
- Document local setup, environment configuration, Storybook review, testing, and deployment.
- Deploy to Vercel with encrypted server-side environment variables and verify the production workflow.

Completion evidence:

- Formatting, linting, strict type checking, automated tests, accessibility checks, and the production build pass.
- The English and Spanish end-to-end workflows pass at desktop and mobile sizes.
- Anonymous limits and provider failures produce recoverable messages without losing the current input or session.
- A fresh setup succeeds from repository documentation and `.env.example` without exposing a secret.
- The Vercel deployment completes the core workflow and does not persist or log submitted expense text.

Dependencies: Phases 1 through 4.

## Deferred beyond the initial release

Category renaming, manual category colors, AI-facing category descriptions, expense editing, manual expense entry, accounts, persistence, synchronization, financial integrations, budgets, recurring expenses, currency conversion, additional languages, model training, and native applications remain outside the initial release until explicitly promoted.

## Mission trace

| Mission outcome | Roadmap coverage |
| --- | --- |
| Faithful React and Storybook migration | Phases 1–2 |
| Session-only category controls | Phase 3 |
| Cumulative results, correction, totals, and chart | Phase 3 |
| Multi-expense bilingual AI classification | Phase 4 |
| Clear success and recoverable failure behavior | Phase 4 |
| Accessible English and Spanish experience | Phases 2–5 |
| Safe publicly hosted demo | Phase 5 |
