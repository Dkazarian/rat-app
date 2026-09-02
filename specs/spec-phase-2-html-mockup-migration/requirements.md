# Phase 2 Requirements — HTML Mockup Migration

## Objective

Faithfully reproduce `docs/ui-mockup.html` as a responsive, bilingual React interface built from reusable, prop-driven components and deterministic fixtures.

This phase implements presentation only. Interactive session behavior belongs to Phase 3, and live AI classification belongs to Phase 4.

## Requirements

- **R1 — Visual parity:** Treat the HTML mockup as the source of truth for layout, typography, spacing, colors, assets, copy, states, and responsive behavior at desktop and narrow widths.
- **R2 — Source preservation:** Do not modify the reference HTML or original mascot assets in `public/assets`.
- **R3 — Components:** Build reusable components for the application shell, capture area, language control, rat dialogue, categories, spending chart and legend, expense results, and footer.
- **R4 — Contracts:** Use strict TypeScript props for displayed data, locale, state, labels, and callback placeholders.
- **R5 — Determinism:** Render without network requests, persistence, randomness, timers, or an API key. Supply reusable fixtures for empty, loading, success, extraction-failure, and provider-error states; recoverable failures preserve the submitted input.
- **R6 — Localization:** Use `i18next` with `react-i18next` as the single localization system. Keep all visible and accessible copy in synchronized English (`en`) and Spanish (`es`) JSON resources at `src/i18n/locales/{locale}/translation.json`, using i18next's conventional default `translation` namespace while the translation set remains small. Configure English as the fallback and refresh default, retain type-checked translation keys, and support immediate in-memory switching through an accessible `EN`/`ES` control by calling `i18n.changeLanguage(locale)`. Do not add browser language detection or persistence.
- **R7 — Amounts and chart:** Keep amounts as integer minor units and display `$` followed by an ungrouped number with a `.` decimal separator and exactly two fractional digits in both English and Spanish (for example, `$1285.50`). Derive the chart, legend, category values, and total from the same fixture data.
- **R8 — Accessibility:** Preserve semantic structure, keyboard access, visible focus, accessible names, textual chart equivalents, appropriate feedback announcements, and reduced-motion support. Do not rely on color alone.
- **R9 — Storybook:** Expose principal components, both locales, and every required fixture state. Validate responsive behavior with Storybook viewport controls instead of duplicate narrow stories.

## Exclusions

- No category creation, deletion, renaming, validation, or limits.
- No cumulative session state, reclassification, or expense deletion.
- No `/api/classify` route, OpenRouter integration, provider parsing, rate limiting, or credentials.
- No `localStorage`, IndexedDB, cookies, database, server persistence, or locale persistence.
- No intentional redesign before visual parity is established.

## Completion evidence

Phase 2 is complete when every requirement and exclusion has passed the checks recorded in `validation.md`.
