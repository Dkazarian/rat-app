# Delete Expenses

## Goal

Allow a visitor to delete an expense from their current session.

Deleting an expense should immediately remove it from the session data and update any derived totals shown in the UI.

## Requirements

- A visitor can delete an expense that belongs to their current session.
- A visitor cannot delete an expense from another session.
- Deleting an expense is idempotent. If the expense does not exist in the current session, the operation still succeeds.
- Deleting an expense removes it from Redis.
- Category totals and the overall expense total reflect the deletion immediately.
- The recent-expenses list no longer includes the deleted expense.
- The UI provides a delete action for individual expenses.
- The delete action should not require a full page reload.

## API

Add an authenticated/session-scoped expense deletion endpoint.

`DELETE /api/v1/expenses/:expenseId`

The endpoint should:

1. Resolve the current session.
2. Validate the expense ID format.
2. Delete the expense from Redis.
3. Return a successful response without exposing internal storage details.

Use the existing application error/response conventions.

## Domain and Storage

Deletion must remain scoped by `sessionId`.

The Redis expense layer should expose an operation for deleting one expense by ID for a given session.

## UI

Add a delete control to each expense item.

On successful deletion:

- remove the expense from the visible list;
- update category totals;
- update the overall total;
- update any recent-expense views affected by the deletion.

On failure:

- keep the expense visible;
- show an appropriate recoverable error state.

## Out of Scope

- Bulk expense deletion.
- Undo/restore.
- Soft deletion.
- Audit history.
- Cross-session administration.
- Confirmation dialogs.

## Validation

Verify that:

- deleting an existing expense succeeds;
- the deleted expense is removed from Redis;
- totals are recalculated correctly;
- the expense disappears from the recent-expenses list;
- invalid expense IDs are rejected;
- deleting the last expense leaves the UI in the correct empty state;
- existing category and expense flows continue to work.

## Acceptance Criteria

The feature is complete when a visitor can delete one of their expenses from the UI, the deletion is persisted in Redis and all affected totals and lists update correctly.