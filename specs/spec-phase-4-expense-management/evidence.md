# Phase 4 validation evidence

Validated: 2026-09-02, Windows, Node 24.16.0, npm 11.13.0, in-app Chromium browser.

## Automated gates

- Format check, ESLint (zero warnings), TypeScript, Vitest, Next.js production build, and Storybook production build pass.
- Vitest: 14 files, 96 passing tests.
- No new runtime dependencies or package-lock changes.
- Storybook emits non-failing bundle-size and plugin-timing advisories.

## Coverage trace

| Validation area                                                                                                                              | Evidence                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Expense model, batch validation, immutable rules, missing-category normalization                                                             | EXP-001–EXP-016: `expense-service.test.ts`, immutable domain types                                                                          |
| Grouping, totals, zero totals, percentages, current category membership                                                                      | EXP-017–EXP-021: `expense-selectors.test.ts`                                                                                                |
| Literal descriptions/custom names, localized built-ins, amount format, chart text                                                            | EXP-022–EXP-024: `expense-display.test.ts`, `format-amount.test.ts`, Dashboard locale tests                                                 |
| Initialization, cumulative capture, rejected-input preservation, reclassification/deletion, category coordination, locale persistence, reset | EXP-025–EXP-032: `use-page-session.test.tsx`                                                                                                |
| Controlled capture, accessible recovery and extracted count                                                                                  | EXP-033–EXP-034: `dashboard-page.test.tsx`                                                                                                  |
| Native selectors, immediate deletion, populated-category deletion, unique accessible names, bilingual controls, keyboard activation          | EXP-035–EXP-040: `dashboard-page.test.tsx` and browser workflows below                                                                      |
| Deterministic test/story interactions                                                                                                        | EXP-041: injected-ID Dashboard regression, per-mounted-story ID counters                                                                    |
| No persistence/network/provider operations                                                                                                   | EXP-042: source audit of app, features, and components; no fetch/XHR/storage/cookie/IndexedDB calls in session workflows                    |
| Neutral coordination and feature independence                                                                                                | EXP-043: Dashboard supplies props; category and expense UI do not control one another; session coordinator calls both pure rule modules     |
| Derived state and dependencies                                                                                                               | EXP-044: reducer state contains categories, expenses, input, feedback only; summary is memoized from selectors; package manifests unchanged |

Two audit regressions were observed failing before their fixes on 2026-09-02:

1. Dashboard ignored injected ID factories. It now forwards them to the session, and stories use deterministic per-mount counters for both expense and category identifiers.
2. Several intentions issued in one event used a stale rendered collection. The regression captured a batch, deleted its category, and captured another batch; it previously lost the first expense and restored a deleted reference. A ref now tracks the latest queued reducer transition for synchronous operation results. Both expenses remain and normalize to Unclassified.

The pending-state ref is not an additional owner or a store of derived data: every update uses the same pure reducer and dispatch boundary, including input changes. It permits synchronous operation results while React batches rendering.

## Story and browser review

The built Storybook was served from `storybook-static` on loopback; no Storybook development settings/cache writes were needed.

The following Dashboard stories were inspected in both English and Spanish: Empty, One Accepted Batch, Cumulative Batches, Reclassification, Expense Deletion, Populated Category Deletion, Extraction Failure, Desktop Success, Spanish, and Narrow Correction. Domain values and custom `Fun` remained literal; built-in names, feedback, controls, and chart summaries localized.

Representative observed totals: empty `$0.00`; one batch `$518.20`; cumulative `$770.60`; reclassified `$1284.50`; expense-deleted `$766.30`; category-deleted `$1284.50`.

- Desktop visual review: 1440 × 1000 viewport, readable controls with no overlap or horizontal overflow.
- Narrow visual review: 390 × 844 viewport override (375 px content area excluding the scrollbar), selector widths approximately 264 px; no page-level horizontal scrolling, clipped category labels, or control overlap.
- Native keyboard workflow completed at both sizes: textarea typing, Enter to capture, ArrowDown to reclassify, Tab between correction controls, Enter to delete an expense, and Enter to delete a populated category.
- Focus-visible was true on the focused native selector, with a solid outline.
- Keyboard capture produced Lunch/Coffee/Taxi and `$34.50`. Moving Lunch to Home changed the chart to Food 13%, Home 52%, Transport 35%. Deleting Lunch and then Transport preserved Taxi under Unclassified and produced `$16.50`.
- Rejected Spanish capture retained `  exact rejected input\n  ` exactly and displayed an accessible recovery alert.
- Earlier 2026-08-30 browser evidence in `docs/phase-4-handoff.md` additionally verifies cumulative live captures, custom Health creation, movement through custom/built-in/Unclassified categories, populated Food deletion, locale persistence, and refresh reset.
- Unclassified has no deletion UI; direct rejected deletion and unchanged collections are covered by pure-rule tests.
- No session operation contains a network or persistence call. Initial static assets and Storybook's own infrastructure are not session data transport.

## Process deviation requiring sign-off

Functional requirements and current validation pass. However, the earlier implementation history does not satisfy the plan's mandated test-first chronology for Groups 4–6: their production code was added before the corresponding tests. Earlier checkmarks claiming that order for Groups 4 and 5 have been corrected. The initial before-production validation mapping also cannot be retroactively established.

The current regression tests were run red then green, but that cannot retroactively repair the earlier process sequence. No user acceptance of this deviation is assumed. Final Phase 4 roadmap sign-off remains open pending acceptance of this process deviation; no implementation or functional validation work is otherwise known to remain.
