# Ratapp Mission

## Overview

Ratapp is a playful, publicly hosted classification demo that turns everyday descriptions of spending into organized expenses. A visitor can adjust a small set of categories, describe one or more expenses in natural language, review the AI's classifications, and see categorized results and a synchronized spending chart.

Ratapp demonstrates natural-language interaction, AI-assisted classification, and thoughtful interface design. It is not a personal-finance product or a durable record of spending.

## Target audience

- Demo viewers evaluating how natural-language input can simplify routine classification.
- Portfolio viewers assessing the product, UX, frontend, and AI-integration work behind the demo.

The initial release is anonymous, has no accounts or roles, and does not persist visitor categories, expenses, or language choices.

## Core experience

1. Every fresh page session starts with **Food**, **Home**, **Transport**, and permanent **Unclassified** categories.
2. Visitors can create categories and delete any category except **Unclassified**. Expenses in a deleted category move automatically to **Unclassified**.
3. A session can contain no more than ten categories, including **Unclassified**. Category names are trimmed, case-insensitively unique, non-empty, and limited to 24 characters. The interface assigns category colors from an accessible palette.
4. Visitors can enter one or more expenses in a natural-language message of up to 500 characters. Amounts may be written with or without a `$` symbol.
5. The system extracts separate expenses, gives them concise descriptions that retain useful details, and assigns each to the most appropriate current category. Unknown or uncertain category results go to **Unclassified**.
6. If at least one valid expense is extracted, all usable results are added to the current session, the input is cleared, and the rat reports **“Extracted X expenses.”** This is the normal success behavior even if some input was not extracted.
7. If no usable expense is extracted, or the provider request fails, nothing is added and the exact input remains available for correction or retry.
8. Visitors can reclassify or delete an extracted expense. They cannot edit its description or amount in the initial release.
9. Categorized lists, per-category totals, the overall total, and the spending chart update immediately after every change and accumulate across submissions in the current page session.
10. Visitors can switch the complete interface between English and Spanish without losing the current session.
11. Refreshing or closing the page resets categories, expenses, and language. Ratapp does not use browser storage or server-side persistence.

## Product principles

- **Classification first:** every feature should strengthen the natural-language extraction, classification, review, or visualization loop.
- **Fast capture:** entering several expenses should require one message and one submission.
- **User remains in control:** AI proposes classifications; visitors can inspect, correct, or remove the results.
- **Playful, not childish:** color, friendly copy, motion, and a rat mascot make the demo approachable without obscuring the data.
- **The rat is the system voice:** global success, error, warning, progress, and informational feedback appear as concise rat dialogue rather than generic notification banners.
- **Clarity before decoration:** amounts, category names, classification outcomes, and actions remain legible and accessible.
- **Graceful failure:** model, network, and parsing failures preserve the input and explain what can be retried.
- **Honest demo boundaries:** the interface does not imply accounts, durable records, financial advice, or private on-device classification.

## Initial release scope

- Responsive single-page experience for desktop and mobile browsers.
- Faithful React migration of the approved HTML mockup, organized as reusable components and inspectable Storybook stories.
- Four initial categories: **Food**, **Home**, **Transport**, and permanent **Unclassified**.
- Session-only category creation and deletion, with automatic accessible colors and a maximum of ten categories.
- Natural-language capture of one or multiple expenses per message in English or Spanish.
- Currency-neutral amounts displayed as `$` followed by an ungrouped number with a `.` decimal separator and exactly two fractional digits in both languages (for example, `$1285.50`).
- Server-side AI classification through OpenRouter, with the provider model kept configurable.
- Reclassification and deletion of extracted expenses.
- Cumulative categorized lists, totals, and an accessible donut or pie chart for the current session.
- Complete English and Spanish interface selected through a compact two-position language control.
- Rat dialogue and the approved mascot assets in suitable interface states.
- Public deployment on Vercel with server-only credentials, bounded requests, anonymous rate limiting, safe logging, and a concise external-AI privacy notice.

## Deferred work

- Category renaming, manual color selection, and category descriptions supplied to the AI as classification context.
- Renaming or otherwise editing extracted expenses and manually entering expenses.
- Authentication, accounts, persistence, synchronization, collaboration, and durable spending history.
- Bank, card, receipt, email, or accounting integrations.
- Budgets, income tracking, recurring transactions, forecasts, or financial advice.
- Currency codes, conversion, exchange rates, mixed-currency accounting, or languages beyond English and Spanish.
- Training or fine-tuning a model from user corrections.
- Native mobile applications.
- Additional mascot artwork or animation beyond explicitly approved design work.

## Success measures

The initial demo is successful when:

- A first-time visitor can understand the workflow and classify a multi-expense message without instruction outside the interface.
- Usable expenses receive concise descriptions and a current category, with unknown results normalized to **Unclassified**.
- The success message accurately reports how many expenses were extracted; any non-empty usable subset follows the normal success flow.
- A zero-expense result or provider failure adds nothing and preserves the exact input for correction or retry.
- Reclassification, expense deletion, and category deletion update lists, totals, and the chart immediately.
- Deleting a category moves its expenses to permanent **Unclassified**.
- Refreshing the page reliably returns the demo to its initial state without reading or writing stored user data.
- The workflow is usable on narrow mobile and desktop layouts, by keyboard, and without relying on color alone.
- The complete workflow and recovery messages work in English and Spanish.
- The public deployment protects provider credentials, limits anonymous abuse, and does not log raw expense text.
