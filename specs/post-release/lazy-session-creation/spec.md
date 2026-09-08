# Lazy Session Creation

## Goal

Create visitor sessions only when the visitor performs an action that actually requires server-side session state.

Simply opening or browsing the application should not create an unused session.

## Requirements

- Loading the application must not create a session solely because the page was visited.
- A session is created on the first operation that requires persisted visitor-specific state.
- Existing valid sessions continue to be reused.
- Session creation remains transparent to the visitor.
- Newly created sessions receive the configured 48-hour TTL.
- The session cookie is only issued when a session is actually created.
- Stateless reads or page rendering should remain session-free where possible.
- Session-dependent operations must continue to work when no session exists yet by creating one where appropriate.

## Stateful Operations

Examples of actions that may require lazy session creation include:

- creating a category;
- adding expenses;
- submitting an expense prompt;
- any future mutation that stores visitor-specific data.

Read operations should not create a session unless the requested resource genuinely requires one to exist.

## Expected Flow

Initial visit:

```text
GET /
→ render application
→ no Redis session created
→ no session cookie required
```

First stateful action:

```text
POST stateful endpoint
→ no valid session found
→ create session
→ assign 48h TTL
→ set session cookie
→ continue requested operation
```

Later actions:

```text
request with valid session cookie
→ reuse existing session
→ do not refresh session TTL
```

## Session Semantics

Session creation should be idempotent from the client's perspective.

The client should not need a separate explicit "create session" step before using the application.

The server-side session layer should be responsible for resolving an existing session or creating one when the operation requires it.

Session activity must not extend the session lifetime.

## Out of Scope

- User accounts or authentication.
- Explicit login/logout flows.
- Sliding expiration.
- Creating sessions for anonymous page views.
- Analytics-oriented visitor tracking.

## Validation

Verify that:

- opening the home page does not create a Redis session;
- opening the application without interacting does not issue a session cookie;
- the first stateful action creates exactly one session;
- that action succeeds without requiring a prior session-creation request;
- the newly created session receives a 48-hour TTL;
- subsequent stateful actions reuse the same session;
- subsequent actions do not refresh the session TTL;
- multiple stateful requests for the same visitor do not create unnecessary duplicate sessions;
- existing session-dependent behavior continues to work.

## Acceptance Criteria

The feature is complete when anonymous page visits remain session-free and a 48-hour visitor session is created automatically on the first operation that requires persisted state, then reused without TTL refresh for the remainder of its lifetime.