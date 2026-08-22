# Ratapp Mission

## Overview

Ratapp is a playful, single-page web demo that turns everyday descriptions of spending into organized expenses. A user defines their own categories, writes one or more expenses in normal language, and receives an immediately updated categorized list and spending chart.

## Problem and motivation

Recording expenses is often more tedious than the insight it provides. Traditional trackers make users fill in a form and choose a category for every transaction. This project demonstrates a lighter interaction: describe spending naturally, let AI do the initial organization, and keep the result easy to inspect and correct.

## Target users

- People who want a quick visual summary of personal spending without setting up a full finance system.
- Demo viewers evaluating how natural-language input can simplify routine data entry.

The first release has one local user and does not distinguish roles.

## Core outcomes and capabilities

1. Users start with **Food**, **Home**, **Transport**, **Fun**, and **Unclassified**, and can create, rename, recolor, or delete any category, including those defaults.
2. Users can enter one or multiple `$`-denominated expenses in a single natural-language message.
3. The system extracts separate expenses and assigns each one to the most appropriate current category; an extracted expense with an unknown category goes to **Unclassified**.
4. If at least one valid expense is extracted, the usable results are saved and the interaction behaves as a normal success even when other parts of the input could not be extracted.
5. If no usable expense can be extracted, nothing is saved, the confused rat explains the failure, and the original textarea content remains available for correction or retry.
6. Users can correct an assigned category, edit an extracted expense, or delete it.
7. Categorized lists, category totals, overall total, and a category spending chart stay synchronized after every change.
8. Users can switch the complete interface between English and Spanish without losing their work.
9. The demo survives a browser refresh on the same device.

## Product principles

- **Fast capture:** entering several expenses should require one message and one submission.
- **User remains in control:** AI proposes organization; users can see and correct the result.
- **Playful, not childish:** color, friendly copy, motion, and a rat mascot should make expense tracking feel approachable without obscuring the data. The current mascot uses minimal geometric forms, a calm intelligent expression, and recognizable rat proportions: smaller ears and eyes, a broad head, stocky body, and thick segmented tail.
- **The rat is the system voice:** global success, error, warning, and informational feedback should appear as concise dialogue or speech bubbles spoken by the rat instead of generic notification banners. Critical meaning must remain clear from words and accessible semantics, not character art alone.
- **Clarity before decoration:** amounts, category names, classification outcomes, and actions must remain legible and accessible.
- **Graceful failure:** model, network, parsing, and storage failures should preserve the user's input and explain what can be retried.
- **Demo-sized scope:** prefer a convincing, reliable core workflow over broad personal-finance features.

## Initial release scope

- Responsive single-page experience for desktop and mobile browsers.
- Five initial categories—**Food**, **Home**, **Transport**, **Fun**, and **Unclassified**—with the same rename, recolor, and deletion controls as later user-created categories.
- Natural-language capture of one or multiple expenses per message.
- Currency-neutral amounts displayed only with the `$` symbol, with a complete English and Spanish interface selected through a compact two-position language control.
- AI classification through OpenRouter using `google/gemma-4-26b-a4b-it:free` as the initial model.
- Correction of classifications, including expenses placed in **Unclassified**.
- Categorized expense lists and a donut or pie chart showing spending distribution.
- Local, single-device persistence without an account.
- A playful visual system built around the selected minimal geometric rat mascot, with appearances in suitable interface states.
- Rat dialogue bubbles for global system feedback, with ordinary inline validation retained beside the field or item that needs correction.

## Non-goals and deferred work

- Authentication, user accounts, synchronization, or collaboration.
- Bank, card, receipt, email, or accounting integrations.
- Budgets, income tracking, recurring transactions, forecasts, or financial advice.
- Currency codes, currency conversion, exchange rates, mixed-currency accounting, languages beyond English and Spanish, or shared household ledgers.
- Training or fine-tuning a model from user corrections.
- Native mobile applications.
- Optional user-authored category descriptions that provide the AI with additional classification context; this is a post-MVP enhancement.
- Additional mascot poses, expressions, animation, or a human-drawn replacement; the current static PNG is sufficient for the initial release and may be replaced later through an explicit design decision.

## Success measures

The initial demo is successful when:

- A first-time user can create categories and convert a multi-expense sentence into separate categorized expenses without instruction outside the interface.
- Every saved expense is assigned to a current category, with unknown category results normalized to **Unclassified**.
- A partially successful extraction saves the usable expenses and shows the ordinary success state.
- A completely unsuccessful extraction saves nothing, shows the confused-rat error, and leaves the submitted text in the textarea.
- Corrections update lists, totals, and the chart immediately and persist after refresh.
- Failure of the AI request does not lose the user's text or create invalid records.
- The core workflow is usable on both narrow mobile and desktop layouts, including by keyboard and without relying on color alone.
- The complete core workflow, including rat dialogue and recovery messages, is available in both English and Spanish and can be switched without reload or data loss.
