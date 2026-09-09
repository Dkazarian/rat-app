# Session Expiration Recovery

## Goal

Make session-expiration behavior and rat-dialogue messaging agree with the application's lazy-session model.

An expired anonymous session must not permanently break the application. The visitor should understand that the old session data is unavailable and that continuing with a stateful action will start a fresh session.

## Current Behavior

- Read endpoints treat an invalid or expired cookie as no active session and return empty collections without creating a replacement session.
- Create-category and prompt-submission endpoints lazily create a replacement session when the request begins without a valid session, complete the requested operation, and issue the new cookie.
- Delete endpoints require an existing session and can return `session_not_found` after expiration.
- A session can also expire between initial resolution and a later persistence check. In that race, the current operation can return `session_not_found`; a later stateful operation creates the replacement.
- The client refreshes dashboard data after receiving `session_not_found`, but it does not explicitly create a new session at that moment.
- The current message, `This anonymous session expired. Starting a new session…`, therefore claims that creation is already underway when it may not happen until the visitor's next stateful action.

## Requirements

### Recovery semantics

- Preserve lazy session creation: page visits and read-only requests must not create sessions.
- Treat an invalid or expired cookie as no active session on a stateful create or prompt request.
- The first stateful create or prompt request after expiration must create one replacement session, issue its cookie, and complete the requested operation without requiring a separate bootstrap request.
- Existing valid sessions must continue to be reused.
- Replacement sessions must receive the configured fixed TTL and must not revive or copy data from the expired session.
- Data from the expired anonymous session is permanently unavailable.
- A failed operation caused by the expiration race must leave the UI recoverable. Prompt drafts and other correctable user input must be preserved.
- Recovery must not automatically replay an AI request or another mutation when doing so could duplicate work or side effects.
- Delete requests against an expired session may fail because their targets no longer exist, but the failure must clear stale dashboard data and must not prevent a later stateful action from creating a fresh session.

### Client behavior

- On `session_not_found`, refresh the dashboard's server-authoritative reads so stale categories, expenses, and totals disappear.
- Do not claim that a replacement session has already been created unless the response actually issued one.
- Do not add a client-side session store or an eager session-creation request.
- Do not repeatedly retry a failed mutation automatically.
- Keep the application usable after the refresh; the next supported stateful action must follow the ordinary lazy-creation path.

### User-facing copy

- Replace `This anonymous session expired. Starting a new session…` with concise text that describes the actual state and next step.
- Recommended English: `Session expired. Continue to start fresh.`
- Recommended Spanish: `La sesión venció. Continuá para empezar de nuevo.`
- The message must make clear that the old session ended without implying that its data will be recovered.
- Keep the message short enough to satisfy the Capture Panel Layout Stability specification.
- Keep visible and accessible copy synchronized in the English and Spanish translation dictionaries.

## Expected Flows

Expired session followed by a read:

```text
GET session-scoped collection with expired cookie
→ resolve no active session
→ return an empty collection
→ do not create a session or issue a cookie
```

Expired session followed by a stateful create or prompt:

```text
POST stateful endpoint with expired cookie
→ resolve no active session
→ create one replacement session
→ perform the requested operation in the replacement session
→ issue the replacement cookie
→ return the ordinary successful response
```

Expiration detected after an operation began:

```text
mutation returns session_not_found
→ preserve unsent or correctable input
→ show accurate expiration feedback
→ refresh categories and expenses to empty state
→ do not automatically replay the mutation
→ next visitor-initiated stateful action creates a replacement session
```

## Validation

Verify that:

- reads with an expired cookie return empty data and create no Redis session;
- the first create-category request with an expired cookie creates exactly one replacement, succeeds, and sets the new cookie;
- the first prompt submission with an expired cookie creates exactly one replacement, succeeds, and sets the new cookie;
- a valid live session is reused without replacement;
- an expiration race returns recoverable feedback without automatically repeating the mutation;
- a failed prompt retains its exact draft;
- a session-expired delete clears stale dashboard data and leaves subsequent create/submit behavior usable;
- expired categories and expenses are not copied into the replacement session;
- English and Spanish display the revised message;
- the revised message uses the correct urgent rat-dialogue semantics;
- session, route, dashboard component, and Storybook tests cover the behavior without contacting live Redis or the AI provider.

## Out of Scope

- Restoring expired anonymous data.
- Sliding expiration or refreshing TTLs through activity.
- User accounts, authentication, or cross-device recovery.
- Eager session creation during page load or read-only requests.
- Automatically replaying AI calls or mutations after ambiguous failures.
- Changing the configured session lifetime.

## Acceptance Criteria

The work is complete when expired sessions degrade to an empty recoverable state, the next visitor-initiated stateful create or prompt transparently establishes a fresh session, risky operations are never replayed automatically, and the rat dialogue accurately explains the transition in concise English and Spanish.
