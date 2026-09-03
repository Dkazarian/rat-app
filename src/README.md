# Source structure

The layout adapts [Pramod Boda's React folder guide](https://dev.to/pramod_boda/recommended-folder-structure-for-react-2025-48mc) to this Next.js application. Feature UI, shared components, and services have separate homes. Next.js `app/` owns routing; services remain outside features, as a project convention.

```text
src/
  app/                         Route entry points and root layout
  components/
    common/                    Reusable UI, including mascot-card
    layout/                    Header, language control, app shell, footer
  features/
    categories/
      components/              Category panel, form, and item
      hooks/                   React category snapshots and actions
      category-color.ts        Category presentation palette
      category-display.ts      Localized presentation mapping
      view-types.ts            Category presentation contracts
    expenses/
      components/              Expense list and spending summary
      expense-display.ts       Localized presentation mapping
      expense-selectors.ts     Pure grouping, totals, and chart derivation
      view-types.ts            Expense presentation contracts
    dashboard/
      components/              Dashboard composition and capture UI
      fixtures/                View examples and domain session seeds
      hooks/                   Page-session coordination
      mock-expense-capture.ts  Mock expense capture for the current demo
      live-dashboard.tsx       Client entry point and capture wiring
      types.ts                 Dashboard session and capture contracts
  services/
    categories/                Category service, domain types, errors, tests
    expenses/                  Expense service, domain types, errors, tests
    session/                   Session workflows, capture contracts, and tests
  i18n/                        Typed translations and locale provider
  styles/                      Global Tailwind styles
  utils/                       Shared amount formatting and ID generation
  test/                        Shared test setup and rendering helpers
```

## Placement and dependencies

- `app/` wires routes to features. The dashboard composes category and expense features; `usePageSession` calls `SessionService` and maintains React rendering snapshots.
- `services/` owns domain collections, validation, and operations. Services may use domain contracts and framework-independent helpers, but do not import React, components, feature modules, localization, or route code. Service types and typed errors live beside their service.
- `SessionService` owns a private category/expense pair, passes its user ID to category and expense operations, and coordinates category deletion. It looks up custom categories before clearing their expense assignments and deleting them; missing and system-category deletions are no-ops. `CategoryService` owns category-only rules; it has no expense-service reference. Call `SessionService.deleteCategory` for sessions containing expenses. `ExpenseService` reads categories through a one-way dependency and generates expense IDs during creation.
- Feature `components/` owns capability-specific UI. Shared presentation contracts live in feature `view-types.ts`; dashboard session contracts live in `features/dashboard/types.ts`. Other modules import these contracts directly instead of importing types from component or Hook implementations.
- `components/common/` holds reusable UI, and `components/layout/` holds application framing. Keep dashboard-specific composition within its feature.
- Hooks stay in their feature's `hooks/` directory. Add a top-level shared Hooks directory only when there is a reusable Hook with consumers across features.
- `utils/` holds broadly reusable helpers. Category presentation colors belong to the category feature; fixture-only calculations belong beside fixtures.
- Prefer `@/` imports across ownership boundaries and relative imports within a cohesive module. Avoid barrel files that mix service, client, and future server exports.
- Tests (`*.test.ts` or `*.test.tsx`) and stories (`*.stories.tsx`) stay beside the code they cover. `test/` contains shared infrastructure only. Storybook discovers stories throughout `src/`.

## Fixtures and runtime state

`features/dashboard/fixtures/dashboard-view-fixtures.ts` contains presentation examples for isolated stories and tests. `dashboard-session-fixtures.ts` contains domain seeds for interactive dashboard stories and tests. These serve different purposes and need not contain identical data. `category-spending.ts` in the same folder supports presentation fixtures only.

The running page uses `mock-expense-capture.ts`, not the story fixtures. Each mounted page creates one `SessionService` with dedicated category and expense collections. `usePageSession` owns the category rendering snapshot and an expense/input/feedback reducer, applying successful service results without coordinating business operations. `useCategories` remains available for standalone category examples. Selectors derive totals and chart data. Refreshing creates a fresh session with only the permanent Unclassified category and no expenses. CategoryService appends Unclassified to every user's category list. Session seeds create custom categories through the public service API and remap seeded expenses to the generated category IDs. Standalone category examples may use the existing default category service; the dashboard always creates dedicated instances.

Unclassified is the only system category and the only category whose display name is translated. Its ID is `null`; expenses use `categoryId: null` to represent no category assignment. Custom category IDs remain strings. Food, Home, and Transport in fixtures are ordinary custom categories with literal names. Custom names may also be Unclassified or Sin clasificar; their generated IDs distinguish them from the permanent system category.

The dashboard's in-memory `UserStore` reuses a supplied user ID or creates one when absent. Only the resolved ID is passed to services. `ExpenseService` stores a `Map<UserId, Expense[]>`; all expense operations require an explicit user ID. Capture and seed candidates contain a description, amount in minor units, and category ID (`null` for Unclassified), without an expense ID. `createExpense` generates an ID; `addExpenseBatch` delegates each candidate to it and collects validation errors. Repeated candidates create separate expenses. Page snapshots initialize from the accepted service records so editing and deletion use the generated IDs.

`listExpensesForUser(userId)` returns a copy in insertion order; setting `sorted` to `true` sorts by descending ID. `SessionService.listRecentExpenses(amount)` slices that sorted list. UUID sorting does not imply chronological order. Category totals sum minor units, and `removeCategoryFromExpensesInCategory` clears matching assignments for one user. The query helpers isolate collection reads for a future database implementation.

## Framework and future boundaries

Static files remain in repository-level `public/assets/`. Global CSS lives in `styles/globals.css` and is imported by both the root layout and Storybook.

There is currently no classification API or provider integration. When Phase 5 is implemented, HTTP handlers belong in `app/api/`, browser classification code in its feature, and provider credentials and provider calls in server-only modules. Do not add empty `pages`, `routes`, `store`, `config`, or server folders in anticipation of future work.
