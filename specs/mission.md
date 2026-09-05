# Ratapp Mission

Ratapp is a playful, public demo that turns natural-language spending descriptions into categorized expenses. It showcases AI-assisted classification through a thoughtful bilingual interface; it is not a personal-finance system or a durable spending record.

## Core experience

- A visitor uses an anonymous session with no account. The session and its expenses expire after 48 hours.
- The visitor creates up to ten categories. **Unclassified** is an implicit fallback, not a category record.
- One English or Spanish message can contain several expenses. The server extracts them and classifies each against the current categories.
- The visitor can review extracted expenses and their assigned categories. Deleting a category moves its expenses to **Unclassified**.
- Lists, category totals, the overall total, and the spending chart stay synchronized after every change.
- Successful extraction clears the input and reports the accepted count. Failure adds nothing and preserves the input for retry.

## Product principles

- **Classification first:** features support capture, classification, review, or visualization.
- **Fast capture:** several expenses can be entered in one message.
- **Transparent results:** AI classifications are easy to inspect.
- **Playful clarity:** the rat is the concise system voice, while data and actions remain accessible.
- **Graceful failure:** provider and validation failures are recoverable and never discard the draft.
- **Honest boundaries:** Ratapp does not imply accounts, durable history, financial advice, or on-device AI.

## Demo limits

Up to 20 active demo users. Demo data expires 48 hours after the user’s first visit. Each user can create up to 10 custom categories and 100 expenses.

## Initial-release boundary

The initial release is a responsive English-and-Spanish web app with session-only categories and expenses, server-side AI classification, reviewable results, totals, and a chart.

Deferred work includes expense reclassification and deletion, plus custom-category descriptions supplied to the AI.
