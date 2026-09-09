# Capture Panel Layout Stability

## Goal

Keep the capture panel visually stable when rat-dialogue feedback changes while preserving complete, readable, localized feedback.

The composer may give some horizontal space to the mascot and speech bubble. Known application messages should not make the desktop capture panel jump vertically.

## Current Problem

The desktop capture panel reserves 270px for feedback. After the 116px mascot and 8px gap, the speech bubble is only 154px wide.

In the 1200px Storybook canvas, the normal panel is approximately 154px tall. The existing service-unavailable message wraps until the bubble is approximately 151px tall and increases the panel to approximately 188px. Longer localized messages can cause equal or larger shifts.

The composer has enough surplus width at ordinary desktop sizes to rebalance the layout.

## Requirements

### Desktop layout

- Increase the feedback column from 270px to approximately 340px at comfortable desktop widths.
- Keep the mascot at its current desktop size and preserve the gap between the mascot and speech bubble.
- Give the remaining width to the composer using a shrinking-safe flexible column.
- Keep the textarea and submit action usable after the width transfer.
- Stack feedback above the composer before the horizontal layout would reduce the textarea below a useful width. The expected breakpoint is approximately 840px and must be verified in the application shell, not only in an isolated story.
- Do not change the capture panel width when feedback state changes.

### Rat dialogue

- Keep the complete visible title and detail available to every visitor.
- Do not line-clamp, truncate, hide, or place ordinary feedback inside a scrolling speech bubble.
- Do not use a fixed panel height that can clip text under browser zoom, font substitution, or localization.
- Shorten repetitive feedback where the title already supplies the same context.
- Prefer a one-line title and no more than two detail lines at the target desktop layout for each known English and Spanish message.
- Keep error copy actionable and preserve important facts such as the 100-expense limit and loss of an expired anonymous session.

### Responsive and accessible behavior

- Preserve the single-column capture layout at narrow widths.
- Allow natural height growth when required by narrow screens, browser zoom, increased text size, or future copy. Stability must not come at the expense of readability.
- Preserve the current alert and polite live-region semantics.
- Preserve visible keyboard focus and the textarea's association with validation feedback.
- Avoid page-level horizontal overflow at every supported viewport.

## Copy Review

Review every detail that can be rendered by `RatDialogue`, not only the service-unavailable fixture.

Candidate English reductions include:

- `The request was invalid. Check your input and try again.` → `Check your input and try again.`
- `This anonymous session expired. Starting a new session…` → copy defined by the Session Expiration Recovery specification.
- `This session has reached its 100-expense limit.` → `This session is full (100 expenses).`
- `No expenses could be found in that description.` → `Include what you bought and the amount.`
- `The service is temporarily unavailable. Try again.` → `Service unavailable. Try again.`
- `Something went wrong. Try again.` → `Try again.` when paired with the existing error title.

Apply equivalent reductions in Spanish while retaining natural Rioplatense wording and equivalent meaning. Copy changes must remain synchronized in both typed translation dictionaries.

## Storybook Coverage

- Keep stories for every rat state.
- Add deterministic coverage for the longest rat-dialogue detail that can reach the panel.
- Cover the longest representative message in both English and Spanish.
- Review the normal and longest-message states at 1200px and 1440px desktop widths.
- Review both languages immediately above and below the revised stacking breakpoint.
- Review both languages at the existing 390px narrow viewport.
- Stories must make the feedback detail selectable without duplicating production rendering logic.

## Validation

Verify that:

- known normal, loading, success, extraction-failure, provider-error, and rate-limit states have the same outer panel height at 1200px and 1440px under default text settings;
- the composer remains comfortably usable after the feedback column grows;
- the panel stacks before the textarea becomes cramped;
- every known English and Spanish message remains fully visible;
- narrow layouts, 200% browser zoom, and increased text size remain readable and free of overlap;
- no state produces page-level horizontal overflow;
- live-region roles and announcements remain correct;
- component tests, Storybook build, and production build continue to pass.

## Out of Scope

- Redesigning the mascot or replacing its assets.
- Changing prompt validation or submission behavior.
- Hiding error details behind a tooltip or disclosure.
- Guaranteeing an identical panel height for arbitrary future copy, extreme zoom, or user-provided text.
- Changing the overall application shell or results layout.

## Acceptance Criteria

The work is complete when the feedback column has enough space for concise known messages, the composer remains usable, ordinary English and Spanish feedback changes no longer resize the desktop capture panel, and responsive or enlarged-text layouts remain fully readable without clipping or overflow.
