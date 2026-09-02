# Phase 2 Mockup Inventory

## References

- Visual source: `docs/ui-mockup.html`
- Desktop capture: `docs/ratapp-mockup-screenshot.png`
- Approved component map: `docs/ratapp-component-map-v2.png`
- Mascots: `public/assets/rat-mascot.png`, `rat-mascot-sniffing.png`, `rat-mascot-confused.png`, and `rat-mascot-error.png`

The reference HTML and mascot files remain read-only during migration.

## Component hierarchy

```text
AppShell
├─ Header
│  └─ LanguageControl
├─ CapturePanel
│  ├─ Mascot
│  ├─ RatDialogue
│  └─ ExpenseInput
├─ DashboardLayout
│  ├─ CategoryPanel
│  │  └─ CategoryItem × n
│  └─ ResultsPanel
│     ├─ SpendingSummary
│     │  ├─ SpendingChart
│     │  └─ CategorySpendingItem × n
│     └─ ExpenseList
│        └─ ExpenseListItem × n
└─ Footer
```

## Layout and responsive behavior

- The desktop shell uses a header, capture card, and two-column workspace with a 220px category rail.
- The capture card places feedback in a 270px column and the composer in the flexible column.
- The results panel stacks the spending summary above the expense list; the spending summary places a 190px chart beside its breakdown.
- At `680px` and below, the capture card, workspace, and spending summary become single-column layouts. Feedback moves above the composer, the input action stacks below the textarea, and the spending breakdown becomes one column.
- The mobile header hides the brand tagline but retains the language control.

## Visual tokens

The mockup defines paired light/dark values for canvas, surface, soft surface, text, muted text, borders, and ink. Category accents are coral, purple, teal, and yellow, with blue available as an additional accent. Panels use rounded borders, subtle contrast between nested surfaces, and tabular numeric values.

## Content and states

- English and Spanish cover the brand tagline, capture labels, feedback, categories, spending summary, expense list, chart description, controls, and mascot alternatives.
- Amounts are stored as integer minor units and shown as `$` followed by an ungrouped number with a `.` decimal separator and exactly two fractional digits in both languages (for example, `$1285.50`).
- Required fixture states are empty, loading, populated success, extraction failure, and provider error. Recoverable failures preserve the submitted input.
- Loading and success feedback are polite announcements. Error feedback is urgent.
- The chart requires a textual category breakdown and cannot rely on color alone.

## Preservation boundaries

- Phase 2 uses fixtures only: no provider calls, persistence, timers, or random values.
- Visual parity is established before intentional redesign.
- Category and expense controls are presentation callbacks only; Phase 3 owns their behavior.
