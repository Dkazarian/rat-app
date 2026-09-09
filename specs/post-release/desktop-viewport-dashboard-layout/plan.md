# Desktop Viewport Dashboard Layout — Implementation Plan

## Execution Profile

Designed for implementation by `gpt-5.6-luna` with high reasoning effort.

Follow the steps in order. Do not redesign the dashboard, introduce JavaScript height calculations, or change data behavior. This is a CSS/layout change plus deterministic Storybook coverage and a mobile input-font correction.

Status: `[ ]` pending, `[x]` complete.

## Primary Reference

- `specs/post-release/desktop-viewport-dashboard-layout/spec.md`

Read the specification before editing. If this plan and the specification appear to conflict, preserve the specification's user-visible outcome and record the conflict before changing the implementation approach.

## Current Component Path

The loaded dashboard is composed as follows:

```text
DashboardPage
├─ viewport page wrapper
│  └─ centered max-width frame
│     ├─ AppShell
│     │  ├─ Header
│     │  └─ main
│     │     ├─ CapturePanel
│     │     └─ DashboardResults
│     │        ├─ CategoryPanel
│     │        │  ├─ category header/action
│     │        │  ├─ optional CategoryForm
│     │        │  └─ category <ul>
│     │        └─ results panel
│     │           ├─ SpendingSummary
│     │           └─ expense section wrapper
│     │              └─ ApiExpenseList
│     │                 └─ ExpenseList
│     │                    ├─ expense header/date
│     │                    ├─ empty message, when applicable
│     │                    └─ expense <ul>
│     └─ Footer
```

Height constraints must be continuous from the viewport wrapper down to each scrolling `<ul>`. A missing `min-h-0` at any constrained flex/grid level will allow content to expand the page instead of scrolling.

## Fixed Decisions

Use these decisions exactly unless browser evidence proves one cannot meet the specification:

- “Fit the browser window” means the complete desktop application surface is exactly the visible viewport height. Retain the existing centered `max-w-[1200px]`, 12px desktop outer padding, and current width behavior.
- The `Footer` remains a sibling after `AppShell`. The centered frame becomes a full-height flex column; `AppShell` consumes the remaining height and the footer consumes its natural height. Do not move, duplicate, or conditionally render the footer.
- Use `h-screen h-dvh`: `100vh` is the fallback and `100dvh` is the preferred modern value.
- Desktop fitted behavior applies at CSS widths of `851px` and above. Natural-height narrow behavior applies at `850px` and below.
- Tailwind v4 arbitrary `max-*` variants compile as strict less-than queries. Encode the inclusive `<= 850px` reset as `max-[851px]`.
- Change the existing `DashboardResults` one-column variant from `max-[850px]` to `max-[851px]` so the implementation matches the specification at exactly 850px.
- The category and expense `<ul>` elements are the only new scroll containers. Use `overflow-y-auto`, not `overflow-y-scroll`, so scrollbars appear only when needed.
- Keep the category header and optional create form outside the category scroll container.
- Keep the spending summary and expense heading/date outside the expense scroll container.
- Use CSS flex/grid sizing only. Do not add `ResizeObserver`, viewport listeners, measured pixel heights, inline calculated heights, or layout state in React.
- Keep the existing panel width (`250px` category column), gaps, padding, colors, radii, and borders.
- Prevent iOS/WebKit focus zoom by making the category-name input `16px` on narrow layouts and restoring the existing `14px` appearance at `851px` and above. Use `text-base min-[851px]:text-sm` on that input.
- Do not change viewport metadata. Do not set `user-scalable=no`, `maximum-scale=1`, or run JavaScript that resets zoom after blur.
- Do not add custom scrollbar colors or widths in this task.
- Use the existing document scroll on narrow layouts. Explicitly reset fixed heights, flex growth, and overflow at `max-[851px]` where inheritance would otherwise retain desktop constraints.

## 1. Establish and Record the Baseline

- [ ] Run `git status --short` and preserve all unrelated changes.
- [ ] Read the production components listed in the file inventory at the end of this plan.
- [ ] Run the focused component suite before editing:

  ```powershell
  npm test -- src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx src/features/expenses/components/expense-list/expense-list.test.tsx
  ```

- [ ] Start Storybook with `npm run storybook` and inspect `Pages/Dashboard/SeededDesktop` at 1200 × 900.
- [ ] In browser developer tools, record:
  - `window.innerHeight`;
  - document `scrollHeight`;
  - the centered frame height;
  - `AppShell` height;
  - footer height;
  - category panel and results panel heights;
  - category-list and expense-list `clientHeight`/`scrollHeight`.
- [ ] Repeat at 1440 × 900, 1200 × 700, 850 × 900, and 390 × 844.
- [ ] Confirm the mobile focus-zoom issue on a real iPhone/mobile Safari or real WebKit device if one is available. Record the initial visual viewport scale, the scale after focusing **Category name**, and the scale after cancel/submit.

Do not treat JSDOM or a static screenshot as evidence of height or scrolling behavior.

## 2. Constrain the Desktop Page to the Viewport

Edit `src/features/dashboard/components/dashboard-page/dashboard-page.tsx`.

### Outer viewport wrapper

Replace the current desktop `min-h-screen`-only behavior with these layout responsibilities:

- [ ] Desktop: `h-screen h-dvh overflow-hidden`.
- [ ] Narrow reset: `max-[851px]:h-auto max-[851px]:min-h-screen max-[851px]:overflow-visible`.
- [ ] Keep the existing background, typography, 12px desktop padding, and zero narrow padding.

The outer wrapper's final class list should retain the existing visual classes and add only the height/overflow behavior above. Do not set `w-screen`; `w-screen` can include scrollbar width and create horizontal overflow.

### Centered frame

Change the direct child of the viewport wrapper into a constrained flex column:

- [ ] Add `flex h-full min-h-0 flex-col`.
- [ ] Retain `mx-auto w-full max-w-[1200px]`.
- [ ] Add `max-[851px]:h-auto` so the narrow page follows its content.

### Main content

Change `<main>` into the vertical distributor inside `AppShell`:

- [ ] Desktop: add `flex min-h-0 flex-1 flex-col overflow-hidden`.
- [ ] Narrow: add `max-[851px]:flex-none max-[851px]:overflow-visible`.
- [ ] Retain the current 22px desktop and 15px narrow padding.
- [ ] Add `shrink-0` to the existing capture-panel wrapper so `CapturePanel` keeps its natural height.
- [ ] Keep its existing bottom margin; do not convert the gap to an absolute height calculation.

Do not change `DashboardPage` state, API calls, mutation behavior, or props.

## 3. Make `AppShell` Consume the Remaining Frame Height

Edit `src/components/layout/app-shell.tsx`.

- [ ] Add `flex min-h-0 flex-1 flex-col` to the shell `<section>`.
- [ ] Keep `min-w-0`, `overflow-hidden`, border, background, text color, and radius unchanged.
- [ ] Do not add a hard-coded height.
- [ ] Do not move `Footer` into `AppShell`.

Why: the centered frame has the viewport's available height. The footer keeps its natural height, and `flex-1 min-h-0` assigns all remaining height to the bordered shell without requiring a calculation in pixels.

Reference `src/components/layout/footer.tsx`, but do not edit it. Its existing margin and padding must remain included in the flex column's natural footer height.

## 4. Stretch Both Dashboard Columns Through the Remaining Height

Edit `src/features/dashboard/components/dashboard-page/dashboard-results.tsx`.

### Results grid

- [ ] Add `min-h-0 flex-1` to the root loaded-state grid so it consumes the remaining `<main>` height.
- [ ] Replace `items-start` with `items-stretch`.
- [ ] Keep `grid-cols-[250px_minmax(0,1fr)]` and `gap-[18px]`.
- [ ] Replace `max-[850px]:grid-cols-1` with `max-[851px]:grid-cols-1`.
- [ ] Add `max-[851px]:flex-none` so the narrow grid returns to natural height.

Do not wrap loading or error `QueryState` returns in this task. They contain no category/expense collection and may remain natural-height states.

### Right results panel

Change the right panel from an auto-row grid to a two-row constrained grid:

- [ ] Add `h-full min-h-0`.
- [ ] Add `grid-rows-[auto_minmax(0,1fr)]`.
- [ ] Retain its current `min-w-0`, gap, padding, border, background, and radius.
- [ ] Add `max-[851px]:h-auto` for the natural-height narrow layout.

The first row is `SpendingSummary`. The second row is the existing bordered expense wrapper.

### Expense wrapper

On the existing wrapper around `ApiExpenseList`:

- [ ] Add `min-h-0 overflow-hidden` on desktop.
- [ ] Add `max-[851px]:overflow-visible` for narrow layouts.
- [ ] Retain the top border and 17px top padding.

Do not modify `SpendingSummary`. It must remain fully visible and naturally sized above the expense list.

## 5. Make Only the Category List Scroll

Edit `src/features/categories/components/category-panel.tsx`.

### Panel

- [ ] Add `flex h-full min-h-0 flex-col` to the `<aside>`.
- [ ] Add `max-[851px]:h-auto`.
- [ ] Keep the existing accessible `aria-labelledby`, padding, border, background, and radius.

### Non-scrolling controls

- [ ] Add `shrink-0` to the category header/action row.
- [ ] Leave `CategoryForm` outside the `<ul>`.
- [ ] Do not make the whole `<aside>` scroll.
- [ ] Do not make the form sticky or absolute.

### Category `<ul>`

- [ ] Add `min-h-0 flex-1 overflow-y-auto`.
- [ ] Add `max-[851px]:flex-none max-[851px]:overflow-visible`.
- [ ] Preserve the grid, list reset, and 8px item gap.
- [ ] Give the scrolling list 4px inline breathing room without shifting its visible alignment: use `-mx-1 px-1`. Remove or adjust `p-0` so it does not override `px-1`.
- [ ] Do not set `max-height` or a fixed item count.

Expected behavior:

- With few categories, the list receives the remaining panel height and renders no scrollbar.
- With too many categories, only the `<ul>` scrolls.
- Opening `CategoryForm` consumes natural space between the header and list, reducing the list's `clientHeight` automatically.
- Closing the form restores that space automatically.
- Native focus behavior scrolls an off-screen delete button into view.

Do not edit `src/features/categories/components/category-item.tsx` unless browser inspection shows its focus outline is still clipped after the 4px list inset. If it is clipped, increase the list inset to 6px; do not change the item/button design.

## 6. Make Only the Expense Items Scroll

Edit `src/features/expenses/components/expense-list/expense-list.tsx`.

### Expense section

- [ ] Add `flex h-full min-h-0 flex-col` to the root `<section>`.
- [ ] Add `max-[851px]:h-auto`.
- [ ] Preserve `aria-labelledby` and the generated heading ID.

### Non-scrolling heading and empty state

- [ ] Add `shrink-0` to the expense heading/date row.
- [ ] Keep the empty-state paragraph outside the `<ul>` and add `shrink-0` if needed.
- [ ] Do not make the entire expense `<section>` scroll.

### Expense `<ul>`

- [ ] Add `min-h-0 flex-1 overflow-y-auto`.
- [ ] Add `max-[851px]:flex-none max-[851px]:overflow-visible`.
- [ ] Preserve the grid, list reset, and 8px item gap.
- [ ] Use the same `-mx-1 px-1` inline inset as the category list, adjusting/removing `p-0` so it cannot override `px-1`.

When expenses are empty, keep rendering the existing localized empty-state message and empty list. The section still fills the desktop row, but the message stays at the top under the heading.

Reference `src/features/expenses/components/api-expense-list.tsx`; no edit is expected. It already returns `ExpenseList` directly in the successful state, allowing the new `h-full` section to inherit the constrained parent height.

Reference `src/features/expenses/components/expense-list/expense-list-item.tsx`; do not edit it unless the same focus-outline check described for categories fails.

## 7. Prevent Persistent Mobile Focus Zoom

Edit `src/features/categories/components/category-form.tsx`.

- [ ] Add `text-base min-[851px]:text-sm` to the category-name `<input>`.
- [ ] Do not change padding, border, color, placeholder, focus outline, maximum length, or validation attributes.
- [ ] Do not add an `onFocus`, `onBlur`, timeout, or viewport-manipulation handler.
- [ ] Do not add or change a `<meta name="viewport">` declaration.
- [ ] Do not change the dashboard wrapper's existing `text-sm`; the fix is intentionally limited to this mobile text input.

The resulting computed input font size must be:

| Layout width | Category input size  |
| ------------ | -------------------- |
| `<= 850px`   | `16px` (`text-base`) |
| `>= 851px`   | `14px` (`text-sm`)   |

The 16px narrow value prevents Safari's automatic small-input enlargement. It must not interfere with intentional pinch zoom.

## 8. Add Deterministic Full-Page Storybook Coverage

Edit `src/features/dashboard/components/dashboard-page/dashboard-page.stories.tsx`.

Keep existing stories and APIs. Add local fixture builders in this story file; do not add production fixture types or change server limits.

### Fixture builders

- [ ] Add `buildCategories(count)` that creates deterministic category DTOs with:
  - valid, stable UUID strings;
  - names `Category 01`, `Category 02`, and so on;
  - colors cycling through `coral`, `purple`, `teal`, `yellow`, and `blue`;
  - deterministic totals.
- [ ] Never request more than 10 custom categories, matching `CATEGORY_LIMIT` in `src/server/domain/category-rules.ts`.
- [ ] Add `buildExpenses(count, categories)` that creates deterministic expense DTOs with:
  - valid, stable UUID strings;
  - descriptions `Expense 01`, `Expense 02`, and so on;
  - positive deterministic `amountMinor` values;
  - category IDs cycling through the supplied categories and `null`;
  - increasing deterministic `createdAt` values.
- [ ] Add a small `createStoryApi(categoryCount, expenseCount)` helper that returns a complete `SessionApi` using those arrays. Reuse the current no-op mutations.

Do not use `crypto.randomUUID()` for the initial story data because screenshots and DOM ordering must be deterministic.

### Required stories

Add these named stories:

- [ ] `ShortDesktop`: 3 custom categories and 3 expenses with `defaultViewport: "desktop1200"` (1200 × 900).
- [ ] `CategoryOverflow`: 10 custom categories and 3 expenses with `defaultViewport: "desktopConstrained"` (1200 × 700).
- [ ] `ExpenseOverflow`: 3 custom categories and 24 expenses with `defaultViewport: "desktopConstrained"`.
- [ ] `BothListsOverflow`: 10 custom categories and 24 expenses with `defaultViewport: "desktopConstrained"`.
- [ ] `EmptyDesktop`: zero custom categories and zero expenses with `defaultViewport: "desktop1200"`; this may reuse/rename the current empty API without deleting `EmptyProduction` if compatibility matters.
- [ ] `NarrowLongLists`: 10 custom categories and 24 expenses with `defaultViewport: "narrow"` (390 × 844). This story must produce document scrolling and no nested list scrolling.
- [ ] `NarrowCategoryInput`: use `defaultViewport: "narrow"` and the 10-category API. The implementer manually opens the category form during verification; do not introduce a production `initiallyOpen` prop solely for Storybook.
- [ ] Add a Spanish variant of `BothListsOverflow` or apply `globals: { locale: "es" }` to an equivalent deterministic story.

For the specification's “exactly fitting” case, use this mechanical procedure after the CSS edits:

1. Start with `ShortDesktop` at 1200 × 900.
2. Increase the story's category count one at a time until `scrollHeight > clientHeight`.
3. Record the previous count as the maximum non-overflowing category count.
4. Repeat for expenses while keeping three categories.
5. Add `ExactlyFittingDesktop` using those two maximum non-overflowing counts.
6. Put the selected counts in a code comment with the measured viewport (`1200 × 900`).

“Exactly fitting” means the last item is fully visible and the list does not overflow; pixel equality is not required. If font rendering changes by a subpixel, the story remains valid as long as `scrollHeight <= clientHeight` and adding one more item produces overflow.

## 9. Add the Missing Storybook Viewports

Edit `.storybook/preview.ts`.

Keep all existing viewport entries. Add:

- [ ] `desktopConstrained`: 1200 × 700.
- [ ] `dashboardBoundaryAbove`: 851 × 900.
- [ ] `dashboardBoundary`: 850 × 900.

Use these exact names and dimensions. Do not repurpose the capture-panel 841/840 viewports; those protect a different responsive boundary.

## 10. Automated Test Scope

Run and preserve the existing suites:

- `src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`
- `src/features/expenses/components/expense-list/expense-list.test.tsx`

No production behavior, accessible names, or API calls should change, so no test rewrite is expected.

- [ ] Add a focused assertion to `dashboard-page.test.tsx` only if an existing semantic query stops finding a panel after the markup/class changes.
- [ ] Add a focused assertion to `expense-list.test.tsx` only if markup must change beyond class names.
- [ ] Do not assert element heights, `clientHeight`, `scrollHeight`, or media-query results in JSDOM; JSDOM does not perform layout.
- [ ] Do not add tests that merely snapshot long Tailwind class strings.
- [ ] Do not add Playwright, Cypress, or another browser dependency for this task.

The required scroll and viewport evidence comes from Storybook in a real browser using the measurements in the next section.

## 11. Desktop Browser Validation

Use the full-page dashboard stories, not isolated category or expense stories.

For each of 1200 × 900, 1440 × 900, and 1200 × 700:

- [ ] Confirm the viewport wrapper's bounding height equals `window.innerHeight` within one CSS pixel.
- [ ] Confirm `document.documentElement.scrollHeight <= window.innerHeight + 1`.
- [ ] Confirm the footer is visible without scrolling.
- [ ] Confirm the category and right results panel bounding heights differ by no more than one CSS pixel.
- [ ] Confirm their top and bottom edges align within one CSS pixel.
- [ ] Confirm the header, capture panel, chart, spending list, and expense heading are not clipped.

For each collection, select the actual `<ul>` and record:

```js
({
  clientHeight: list.clientHeight,
  scrollHeight: list.scrollHeight,
  overflowY: getComputedStyle(list).overflowY,
});
```

Expected results:

| Story                   | Category list                  | Expense list                   | Document    |
| ----------------------- | ------------------------------ | ------------------------------ | ----------- |
| `EmptyDesktop`          | no overflow                    | no overflow                    | no overflow |
| `ShortDesktop`          | no overflow                    | no overflow                    | no overflow |
| `ExactlyFittingDesktop` | `scrollHeight <= clientHeight` | `scrollHeight <= clientHeight` | no overflow |
| `CategoryOverflow`      | `scrollHeight > clientHeight`  | no overflow                    | no overflow |
| `ExpenseOverflow`       | no overflow                    | `scrollHeight > clientHeight`  | no overflow |
| `BothListsOverflow`     | `scrollHeight > clientHeight`  | `scrollHeight > clientHeight`  | no overflow |

- [ ] Scroll the category list and confirm the category heading, **New** action, capture panel, and page stay fixed.
- [ ] Scroll the expense list and confirm the expense heading/date, spending summary, capture panel, and page stay fixed.
- [ ] Open the category form in `CategoryOverflow`; confirm the form stays visible, the category list becomes shorter, and the list still scrolls.
- [ ] Close the form; confirm the list regains the released height without a page jump.
- [ ] Tab repeatedly into off-screen delete controls in each list. Confirm the browser scrolls the correct list and the complete focus ring becomes visible.
- [ ] Test wheel/trackpad input over each overflowing list.
- [ ] Repeat the long-list review in Spanish.
- [ ] At 851 × 900, confirm two columns and desktop nested scrolling.
- [ ] At 850 × 900, confirm one column, natural height, and document scrolling.

If the document scrolls on desktop, inspect ancestors in this order for a missing height/minimum reset:

1. outer viewport wrapper;
2. centered frame;
3. `AppShell`;
4. `<main>`;
5. `DashboardResults` root;
6. right results panel;
7. expense wrapper;
8. list section;
9. `<ul>`.

Do not solve a broken height chain by hard-coding a list `max-height`.

## 12. Mobile and Focus-Zoom Validation

At 390 × 844 and 850 × 900:

- [ ] Confirm the outer page height is content-driven and the document is the vertical scrolling element.
- [ ] Confirm both list `<ul>` elements compute to `overflow-y: visible`.
- [ ] Confirm neither list has an independent scroll offset after wheel/touch interaction.
- [ ] Confirm all category and expense items remain reachable through normal page scrolling.
- [ ] Confirm panel order, spacing, full-width treatment, footer position, and controls match the current narrow layout.

On real mobile Safari/WebKit at approximately 390 CSS pixels wide:

- [ ] Record `window.visualViewport?.scale ?? 1` before opening the form.
- [ ] Tap **New** and confirm **Category name** receives focus.
- [ ] Confirm the computed input font size is 16px.
- [ ] Record the viewport scale while the software keyboard is open; it must equal the pre-focus scale.
- [ ] Type a name, dismiss the keyboard, and cancel. The scale must remain unchanged.
- [ ] Reopen, type a valid name, and submit. The scale must remain unchanged.
- [ ] Pinch zoom intentionally, repeat focus/blur, and confirm the implementation does not force the visitor back to scale 1.
- [ ] Repeat once in Spanish.

Desktop responsive emulation is useful for layout but is not sufficient evidence for Safari's automatic focus zoom.

## 13. Accessibility Checks

- [ ] Run Storybook's accessibility check on `BothListsOverflow`, `NarrowLongLists`, and `NarrowCategoryInput` after opening the form.
- [ ] Confirm the category `<aside>` remains named by its heading.
- [ ] Confirm the recent-expenses `<section>` remains named by its heading.
- [ ] Confirm all delete buttons retain visible, localized accessible names.
- [ ] Confirm keyboard focus is never trapped in either list.
- [ ] Confirm arrow/page scrolling over a list behaves natively and focus can move out with Tab/Shift+Tab.
- [ ] Confirm browser pinch zoom remains enabled.

Do not add ARIA roles to generic layout containers. Native `<ul>`, `<li>`, section, heading, form, input, and button semantics are already sufficient.

## 14. Quality Gates

Run in this order and fix only issues caused by this change:

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build-storybook`
- [ ] `npm run build`
- [ ] `git diff --check`

Do not run live Redis or AI-provider tests. This change has no server impact.

## 15. Final Audit and Handoff

- [ ] Review `git diff` and confirm there are no API, data, localization, or business-rule changes.
- [ ] Search for the old `max-[850px]:grid-cols-1`; it must be replaced by the exact inclusive breakpoint described above.
- [ ] Confirm no `overflow-y-scroll`, fixed list height, `ResizeObserver`, viewport event handler, or restrictive viewport metadata was introduced.
- [ ] Confirm no production component received story-only props.
- [ ] Record final measurements for every viewport/story in Section 11.
- [ ] Record the real-device/WebKit zoom results from Section 12.
- [ ] Summarize files changed, quality-gate results, desktop measurements, narrow-layout results, accessibility checks, and any evidence-backed deviation from this plan.

## Expected File Inventory

### Create

- `specs/post-release/desktop-viewport-dashboard-layout/plan.md`

### Planned production edits

- `src/components/layout/app-shell.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-page.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-results.tsx`
- `src/features/categories/components/category-panel.tsx`
- `src/features/categories/components/category-form.tsx`
- `src/features/expenses/components/expense-list/expense-list.tsx`

### Planned Storybook edits

- `.storybook/preview.ts`
- `src/features/dashboard/components/dashboard-page/dashboard-page.stories.tsx`

### Tests to run; edit only if semantic markup requires it

- `src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`
- `src/features/expenses/components/expense-list/expense-list.test.tsx`

### Reference without planned edits

- `specs/post-release/desktop-viewport-dashboard-layout/spec.md`
- `src/components/layout/footer.tsx`
- `src/components/layout/header/header.tsx`
- `src/features/dashboard/components/capture-panel/capture-panel.tsx`
- `src/features/expenses/components/api-expense-list.tsx`
- `src/features/expenses/components/spending-summary/spending-summary.tsx`
- `src/features/categories/components/category-item.tsx`
- `src/features/expenses/components/expense-list/expense-list-item.tsx`
- `src/server/domain/category-rules.ts`
- `src/styles/globals.css`
- `src/app/layout.tsx`

### Conditional edits only after browser evidence

- `src/features/categories/components/category-item.tsx` — only if focus outlines remain clipped after the scrolling-list inset.
- `src/features/expenses/components/expense-list/expense-list-item.tsx` — only for the same verified focus-outline problem.

## Explicitly Out of Scope

Do not:

- remove the 1200px desktop maximum width;
- remove desktop outer gutters;
- move or redesign the footer;
- change the capture-panel layout or copy;
- change the chart or spending-summary layout;
- change category or expense API calls, ordering, limits, or mutations;
- virtualize, paginate, or lazy-load list items;
- persist list scroll positions;
- add nested scrolling on narrow layouts;
- add JavaScript layout measurement;
- disable user zoom;
- change global input typography;
- add a browser-test framework.

## Completion Condition

Stop only when the complete desktop application surface fits the visible viewport height with the footer visible, category and results panels have equal height, only overflowing category and expense lists scroll internally, short lists show no scrollbar, the 850px-and-below layout retains natural document scrolling with no nested scrollbars, focusing the category-name input no longer changes mobile Safari's viewport scale, intentional pinch zoom remains available, and every quality gate passes.

