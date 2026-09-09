# Capture Panel Layout Stability — Implementation Plan

## Execution Profile

Designed for implementation by `gpt-5.6-luna` with high reasoning effort.

Follow the steps in order. Keep the change limited to capture-panel layout, rat-dialogue copy, Storybook coverage, and directly affected tests. Do not implement session-recovery behavior in this task.

## References

- `specs/post-release/capture-panel-layout-stability/spec.md`
- `specs/post-release/session-expiration-recovery/spec.md` for the approved expiration wording only
- `src/features/dashboard/components/capture-panel/capture-panel.tsx`
- `src/features/dashboard/components/capture-panel/rat-dialogue.tsx`
- `src/features/dashboard/components/capture-panel/capture-panel.stories.tsx`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`

Status: `[ ]` pending, `[x]` complete.

## Fixed Decisions

Use these decisions unless direct browser evidence shows that one fails an acceptance criterion:

- Desktop feedback column target: `340px`, replacing `270px`.
- Capture-panel stacking breakpoint target: `840px`, replacing `680px` only for the outer capture layout.
- Keep the input row's existing `680px` stacking breakpoint.
- Keep the desktop mascot at `116px` and the narrow mascot at `88px`.
- Keep automatic height and complete visible copy.
- Do not introduce truncation, line clamping, a scrollable bubble, or a fixed panel height.
- Known rat messages should fit within the mascot-determined feedback height under default desktop text settings.
- Natural growth remains allowed for zoom, increased text size, font substitution, and unusually constrained layouts.

If `340px` or `840px` needs minor adjustment, record before/after measurements and choose the smallest adjustment that satisfies the spec. Do not redesign the panel.

## 1. Establish the baseline

- [ ] Confirm the worktree state and preserve unrelated changes.
- [ ] Run the focused capture-panel and dashboard tests before editing.
- [ ] Start Storybook and open the isolated Capture Panel stories.
- [ ] At a 1200 × 900 viewport, record bounding rectangles for:
  - the outer capture panel;
  - the feedback row;
  - the speech bubble;
  - the composer form;
  - the textarea.
- [ ] Record the current Awaiting Input and Service Unavailable states. Expected approximate baseline:
  - Awaiting Input panel height: `154px`;
  - Service Unavailable panel height: `188px`;
  - service-unavailable bubble height: `151px`;
  - feedback column width: `270px`;
  - bubble width: `154px`.
- [ ] Also inspect 1440 × 900 and 390 × 844 so regressions can be distinguished from pre-existing behavior.

Do not use JSDOM geometry as visual-layout evidence; use the rendered Storybook browser.

## 2. Make Storybook expose the real feedback variants

Edit `src/features/dashboard/components/capture-panel/capture-panel.stories.tsx` before relying on it for final measurements.

- [ ] Replace the story-only `state` mapping with a story prop that accepts a complete `RatDialogueFeedback` value.
- [ ] Remove `feedbackFor()` if it becomes unnecessary.
- [ ] Keep localized sample input behavior.
- [ ] Preserve existing Awaiting Input, Success, Loading, Error, and Rate Limited coverage.
- [ ] Add the missing deterministic Extraction Failure story.
- [ ] Add a Session Expired story using `apiErrorSessionNotFound`.
- [ ] Add Spanish coverage for the longest representative feedback using Storybook's `locale: "es"` global.
- [ ] Give stories specific names such as `ServiceUnavailable` and `SessionExpired`; avoid a generic `Error` story when multiple error messages are under review.
- [ ] Do not duplicate translation text in story code. Stories should select translation keys through production `RatDialogueFeedback`.

The final story set must make every rat state reachable and make the longest layout-relevant details directly reviewable.

## 3. Shorten duplicated dialogue copy

Edit both translation dictionaries together:

- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`

Use the following target English copy:

| Key                           | Target copy                                 |
| ----------------------------- | ------------------------------------------- |
| `apiErrorInvalidRequest`      | `Check your input and try again.`           |
| `apiErrorSessionNotFound`     | `Session expired. Continue to start fresh.` |
| `apiErrorExpenseLimitReached` | `This session is full (100 expenses).`      |
| `apiErrorNoExpensesExtracted` | `Include what you bought and the amount.`   |
| `apiErrorServiceUnavailable`  | `Service unavailable. Try again.`           |
| `apiErrorInternal`            | `Try again.`                                |
| `apiErrorUnknown`             | `Try again.`                                |

Use the following target Spanish copy:

| Key                           | Target copy                                         |
| ----------------------------- | --------------------------------------------------- |
| `apiErrorInvalidRequest`      | `Revisá los datos e intentá de nuevo.`              |
| `apiErrorSessionNotFound`     | `La sesión venció. Continuá para empezar de nuevo.` |
| `apiErrorExpenseLimitReached` | `La sesión está llena (100 gastos).`                |
| `apiErrorNoExpensesExtracted` | `Incluí qué compraste y el monto.`                  |
| `apiErrorServiceUnavailable`  | `Servicio no disponible. Probá de nuevo.`           |
| `apiErrorInternal`            | `Probá de nuevo.`                                   |
| `apiErrorUnknown`             | `Probá de nuevo.`                                   |

- [ ] Review `extractionFailureDetail` and other fixed rat-detail keys for duplicated wording.
- [ ] Keep title/detail combinations natural; do not repeat the title in the detail.
- [ ] Keep `providerErrorTitle` unchanged unless browser evidence proves it still wraps in the widened bubble.
- [ ] Do not change session lifecycle or API behavior. This task only adopts the accurate expiration wording from the session-recovery spec.
- [ ] Update all exact-copy test expectations affected by these changes.

Likely affected tests:

- `src/features/dashboard/components/capture-panel/rat-dialogue.test.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`

Search the repository for every old phrase after editing. No stale user-facing copy or stale exact-string assertion should remain.

## 4. Rebalance the capture-panel grid

Edit `src/features/dashboard/components/capture-panel/capture-panel.tsx`.

- [ ] Change the desktop outer grid from `270px minmax(0, 1fr)` to `340px minmax(0, 1fr)`.
- [ ] Move only the outer feedback/composer stacking behavior from `680px` to `840px`:
  - outer panel changes to one column at `840px`;
  - feedback remains in column 1, row 1;
  - composer moves to column 1, row 2 at `840px`;
  - feedback removes its desktop minimum height when stacked at `840px`.
- [ ] Keep the compact feedback subgrid (`82px`) at `680px`; widths from 681px through 840px should retain the desktop mascot/subgrid sizing while using the stacked outer layout.
- [ ] Keep `ExpenseInput`'s textarea/button stacking behavior at `680px`.
- [ ] Do not edit `Mascot` sizing unless rendered evidence shows a regression.
- [ ] Preserve `minmax(0, 1fr)` and `min-w-0` containment so long input and localized text cannot create horizontal overflow.
- [ ] Preserve current spacing, borders, colors, radii, and speech-bubble pointer geometry.

Expected responsive structure:

```text
> 840px
340px rat feedback | flexible composer

681px–840px
full-width rat feedback
full-width composer with horizontal textarea/button row

<= 680px
compact rat feedback
full-width composer with stacked textarea/button
```

## 5. Add focused automated coverage

- [ ] Keep semantic `RatDialogue` tests focused on localized content and alert/live-region behavior.
- [ ] Add or extend cases for:
  - concise service-unavailable feedback;
  - concise session-expired feedback;
  - English and Spanish copy where the test utilities support locale selection;
  - extraction failure and rate limiting retaining their intended state semantics.
- [ ] Extend dashboard tests only where existing exact-copy assertions changed.
- [ ] Add a small `CapturePanel` component test only if it protects behavior visible to JSDOM, such as rendering a complete feedback object or preserving form semantics.
- [ ] Do not assert pixel dimensions or browser wrapping in JSDOM.
- [ ] Do not add a browser-test dependency solely for this change.

Storybook rendering and manual bounding-rectangle measurements are the authoritative layout checks for this task.

## 6. Validate desktop stability in Storybook

At both 1200 × 900 and 1440 × 900:

- [ ] Measure Awaiting Input, Loading, Success, Extraction Failure, Service Unavailable, Session Expired, Expense Limit, Internal Error, Unknown Error, and Rate Limited where stories expose them.
- [ ] Repeat the longest representative state in Spanish.
- [ ] Confirm each known state's bubble is no taller than the `116px` desktop mascot under default text settings.
- [ ] Confirm each known state's outer panel height matches the normal state within browser subpixel rounding.
- [ ] Confirm titles and details are fully visible.
- [ ] Confirm the textarea and button remain comfortably usable.
- [ ] Confirm the textarea remains at least approximately `260px` wide immediately above the desktop stacking breakpoint in the real application shell.
- [ ] Confirm changing state never changes the panel's outer width.

If a known message still makes the bubble taller than the mascot:

1. Check for redundant copy first.
2. If the copy cannot be shortened without losing meaning, increase the feedback column by the smallest practical amount.
3. Recheck the textarea width and breakpoint.
4. Do not solve the failure by hiding text or fixing height.

## 7. Validate responsive and enlarged-text behavior

- [ ] Check the real application shell immediately above and below `840px`.
- [ ] At 841px, confirm the two-column layout remains usable and produces no horizontal overflow.
- [ ] At 840px, confirm feedback moves above the composer without overlap.
- [ ] At 681px, confirm the composer input row remains horizontal and usable.
- [ ] At 680px, confirm the compact mascot layout and stacked input action still apply.
- [ ] At 390 × 844, check all principal states in English and the longest state in Spanish.
- [ ] Check 200% browser zoom or an equivalent reduced CSS viewport.
- [ ] Confirm enlarged text may grow the panel naturally and remains fully visible.
- [ ] Verify keyboard focus on the textarea and submit button.
- [ ] Verify urgent errors remain alerts and normal/loading/success feedback remains polite.

Treat small height changes caused by zoom or narrow wrapping as expected. The fixed-height requirement applies only to known messages at ordinary desktop widths and default text settings.

## 8. Run quality gates

Run in this order and fix only issues caused by this change:

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build-storybook`
- [ ] `npm run build`
- [ ] `git diff --check`

Do not contact Redis, OpenAI, or other live services.

## 9. Final audit and handoff

- [ ] Review the diff for unrelated changes.
- [ ] Confirm the session-expiration implementation itself was not changed.
- [ ] Search for obsolete copy and the old `270px` outer feedback column.
- [ ] Record final Storybook measurements beside the baseline.
- [ ] Summarize:
  - files changed;
  - final desktop and breakpoint measurements;
  - English and Spanish copy changes;
  - automated checks run and their results;
  - manual responsive/accessibility checks completed;
  - any accepted difference from the fixed decisions, with evidence.

## Expected File Inventory

### Edit

- `src/features/dashboard/components/capture-panel/capture-panel.tsx`
- `src/features/dashboard/components/capture-panel/capture-panel.stories.tsx`
- `src/features/dashboard/components/capture-panel/rat-dialogue.test.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-page.test.tsx`
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/es/translation.json`

### Create only if justified by focused behavior coverage

- `src/features/dashboard/components/capture-panel/capture-panel.test.tsx`

### Reference without planned production edits

- `src/features/dashboard/components/capture-panel/rat-dialogue.tsx`
- `src/features/dashboard/components/capture-panel/expense-input.tsx`
- `src/features/dashboard/components/capture-panel/mascot.tsx`
- `src/features/dashboard/components/dashboard-page/dashboard-page.tsx`
- `specs/post-release/session-expiration-recovery/spec.md`

## Completion Condition

Stop only when every known English and Spanish rat message is fully visible, ordinary desktop state changes no longer resize the capture panel, the composer remains usable across the revised breakpoint, responsive and enlarged-text layouts remain accessible, and every applicable quality gate passes.
