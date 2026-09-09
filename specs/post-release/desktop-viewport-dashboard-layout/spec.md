# Desktop Viewport Dashboard Layout

## Goal

Make the desktop application shell fill the browser viewport and keep the category and expense areas visually balanced regardless of how many records they contain.

On desktop, the dashboard should use the available height instead of growing the document. The category and recent-expense collections should fill their allotted dashboard height and scroll internally only when their content no longer fits.

Preserve the current mobile interface. Narrow layouts must continue to grow naturally with the page and must not gain category or expense scrollbars.

Opening the new-category form must also preserve the mobile viewport scale. Focusing its input must not zoom the page in and leave the interface enlarged after the form is closed.

## Current Problem

The application shell currently grows with its content and only has a minimum page height. The category panel also sizes itself independently from the results panel.

This produces inconsistent desktop layouts:

- short category or expense collections leave conspicuous empty or uneven areas;
- longer collections increase the height of their panel and the whole page;
- the category and results columns no longer present a stable, aligned dashboard;
- the amount of data determines the overall application-shell height.

On mobile browsers that automatically enlarge small text fields, focusing the category-name input can zoom the page in. The viewport remains enlarged after the visitor submits or cancels the form, disrupting the otherwise stable mobile layout.

## Requirements

### Desktop viewport shell

- Apply the viewport-fitted layout only while the dashboard uses its two-column desktop arrangement, currently above the `850px` breakpoint.
- Make the complete application surface fit the browser's visible viewport in both dimensions.
- Use dynamic viewport sizing where supported so browser chrome changes do not leave the shell taller or shorter than the visible viewport.
- Account for the header, capture panel, dashboard gaps, padding, borders, and footer within the available viewport height.
- Keep the footer visible as part of the fitted application surface; it must not create page-level overflow below the shell.
- Prevent ordinary category or expense growth from creating desktop document scrolling.
- Do not introduce page-level horizontal overflow.
- Continue to support browser zoom and increased text size. If fixed desktop fitting can no longer preserve usable content at an enlarged effective layout, allow the existing responsive layout to take over instead of clipping controls or text.

### Dashboard height

- Let the dashboard results area consume the remaining desktop height below the capture panel.
- Make the category panel and the results panel equal in outer height.
- Keep both panels aligned at their top and bottom edges.
- Give every intermediate grid or flex container the shrinking behavior needed for descendant scrolling; content must not force the fitted shell beyond the viewport.
- Preserve the current desktop column widths, spacing, borders, padding, and visual hierarchy unless a small adjustment is required to make the viewport fit robustly.

### Category collection

- Keep the category heading and **New category** action visible while the category collection scrolls.
- When the create-category form is open, keep the form usable and include its height in the panel's available-space calculation.
- Let the category list fill the remaining height of the category panel.
- Show no scrollbar when all category items fit.
- When category items exceed the available list height, scroll the category list vertically inside the panel without moving the panel heading, create action, capture panel, or page.
- Do not allow the internal scrollbar to cover category names, totals, delete controls, focus outlines, or other interactive content.

### Expense collection

- Preserve the spending summary and chart above the recent-expenses section.
- Let the recent-expenses section fill the remaining height of the results panel.
- Keep the **Recent expenses** heading and its accompanying date label visible while expense items scroll.
- Show no scrollbar when all expense items fit.
- When expense items exceed the available list height, scroll the expense list vertically inside the results panel without moving the spending summary, capture panel, or page.
- Preserve the empty-state message when there are no expenses; the section must still occupy its allotted height without vertically stretching or distorting the message.
- Do not allow the internal scrollbar to cover expense descriptions, amounts, delete controls, focus outlines, or other interactive content.

### Mobile and narrow layouts

- At `850px` wide and below, preserve the current single-column dashboard layout.
- Do not apply fixed viewport height, equal-height columns, or nested category/expense scrolling to the narrow layout.
- Category and expense collections must render at their natural height on narrow screens.
- The document remains the only vertical scrolling surface on mobile; category and expense panels must not show their own scrollbars.
- Preserve the current narrow-screen spacing, ordering, full-width shell treatment, touch behavior, and footer placement.
- Switching across the desktop breakpoint must not leave stale fixed heights or overflow rules on the narrow layout.
- Prevent automatic focus zoom when the new-category input opens on mobile. Its effective focused text size must meet the mobile browser threshold that avoids automatic enlargement.
- Opening the form, focusing and typing in the input, dismissing the software keyboard, submitting, and cancelling must all leave the page at the visitor's prior viewport scale.
- Do not prevent intentional pinch zoom or reduce user-scalable viewport accessibility to work around automatic input zoom.
- Apply any input typography adjustment only where needed for narrow/mobile browsers; preserve the established desktop form appearance.

### Interaction and accessibility

- Internal list scrolling must work with mouse wheels, trackpads, touch, and keyboard interaction.
- Tabbing to an off-screen category or expense control must scroll that item into view within its list.
- Preserve visible focus indicators and existing accessible names, landmarks, headings, live regions, and control semantics.
- Do not trap focus or keyboard scrolling inside either list.
- Preserve item ordering and all existing category and expense behavior.
- Do not use scripted viewport resets that can produce visible jumps or override a visitor's chosen zoom level.

## Storybook and Test Coverage

- Add deterministic desktop coverage for empty, short, exactly-fitting, and overflowing category and expense collections.
- Cover category overflow independently from expense overflow and both overflowing together.
- Cover the open create-category form with enough categories to require scrolling.
- Verify the fitted layout at representative desktop viewport sizes, including `1200px` and `1440px` widths and at least one constrained desktop height.
- Verify the current stacked layout at `850px`, the existing `390px` narrow viewport, and representative mobile heights.
- Add coverage for opening, focusing, typing in, submitting, and cancelling the new-category form at the existing narrow viewport.
- Include assertions or browser checks that identify the actual scrolling element, not only screenshots of clipped content.
- Review English and Spanish because translated headings, actions, and empty states can change the available height and width.
- Manually verify the focus-zoom behavior in mobile Safari or an equivalent real WebKit environment; viewport emulation alone is not sufficient evidence because desktop browser emulation may not reproduce automatic input zoom.

## Validation

Verify that:

- the complete desktop application surface matches the visible browser viewport without page-level overflow;
- the category and results panels have equal outer heights on desktop;
- short collections do not collapse either panel or create unnecessary scrollbars;
- long category collections scroll only within the category list;
- long expense collections scroll only within the expense list;
- category and expense headings remain visible during list scrolling;
- the spending summary remains visible while expenses scroll;
- opening and closing the category form recalculates the available list height correctly;
- keyboard focus reveals off-screen controls within the correct scrolling container;
- desktop resizing does not leave clipped content or stale dimensions;
- at `850px` and below, both lists use natural height and neither becomes an internal scrolling region;
- mobile behavior and appearance remain unchanged;
- focusing the category-name input at the `390px` narrow viewport does not automatically enlarge the page;
- submitting or cancelling the category form and dismissing the software keyboard preserve the viewport scale that was active before focus;
- intentional user pinch zoom remains available;
- browser zoom, increased text size, and both supported languages remain usable without overlap or inaccessible controls;
- component tests, Storybook build, and production build continue to pass.

## Out of Scope

- Changing category or expense business rules, limits, ordering, or data loading.
- Redesigning the spending chart, capture panel, header, footer, or individual list items.
- Adding pagination, virtualization, infinite loading, or scroll-position persistence.
- Adding custom mobile scroll containers.
- Disabling user scaling, setting a restrictive viewport maximum scale, or forcibly resetting the viewport after input focus.
- Changing the existing desktop-to-single-column breakpoint unless validation shows that a small adjustment is necessary to prevent clipping under enlarged text or browser zoom.

## Acceptance Criteria

The work is complete when the desktop application fills the visible browser viewport, the category and results panels remain equal in height, overflowing category and expense collections scroll independently within their allotted list areas, short collections remain visually stable without unnecessary scrollbars, the current mobile layout continues to use natural page height with no nested list scrollbars, and using the new-category input does not automatically enlarge or leave the mobile page zoomed in.

