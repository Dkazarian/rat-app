# Delete Expenses — Implementation Plan

## Objective

Implement the existing Delete Expenses spec end-to-end using the application's existing mutation and refresh architecture.

Keep the change narrow and reuse existing patterns.

## 1. Redis deletion

Add `deleteExpense(sessionId, expenseId): Promise<void>` to the Redis expense layer.

Expenses are stored as fields in the session expenses hash.

Use:

`HDEL <session-expenses-hash> <expenseId>`

Deletion is idempotent:

- deleting an existing expense succeeds;
- deleting a missing expense also succeeds;
- do not perform a separate existence check.

Do not delete the entire expenses hash.

Do not modify TTL/session behavior as part of this feature.

Add focused tests for existing, missing, and unrelated expenses.

## 2. DELETE endpoint

Implement:

`DELETE /api/v1/expenses/[expenseId]`

Flow:

1. Resolve the current session.
2. Read `expenseId` from route params.
3. Validate it using the existing UUID validation utility.
4. Call `deleteExpense(sessionId, expenseId)`.
5. Return `204 No Content`.

Deleting an unknown expense still returns `204`.

Follow existing application error conventions for malformed IDs and missing sessions.

## 3. Session API client

Extend `SessionApi` with:

`deleteExpense(expenseId: string): Promise<void>`

Implement it in `browserSessionApi` by reusing the existing `request()` helper:

`DELETE /api/v1/expenses/${encodeURIComponent(expenseId)}`

Mirror the existing `deleteCategory` implementation rather than introducing another client abstraction.

## 4. Integrate deletion with the existing dashboard mutation flow

Keep `DashboardResults` as the coordinator for mutations that affect dashboard data.

The application already has:

- `runMutation(...)` for globally coordinating mutations;
- `isMutating` for disabling mutation controls;
- `onDataChanged()` for incrementing the shared `refreshCounter`;
- that same `refreshCounter` refreshes both category/totals data and expense data.

Reuse this architecture.

In `DashboardResults`, expose expense deletion through the existing mutation helper:

`mutate(() => api.deleteExpense(expenseId))`

After success, `mutate()` already calls `onDataChanged()`.

Do not manually recalculate totals or manually remove expenses from local state.

The existing refresh flow should automatically:

- rerun the category query;
- update category totals;
- update the overall total;
- rerun the expense query;
- update the recent-expenses list.

## 5. Pass the delete action through the expense components

Pass the handler through:

`DashboardResults`
→ `ApiExpenseList`
→ `ExpenseList`
→ `ExpenseListItem`

### ApiExpenseList

Add props for:

- deleting an expense;
- mutation disabled state if needed.

Do not perform the API mutation directly here.

Continue to own expense querying and API-to-view-model mapping only.

### ExpenseList

Accept the delete callback and disabled state.

Pass them to each `ExpenseListItem`.

Keep this component presentation-focused.

### ExpenseListItem

Add a delete button for the expense.

The button should:

- call the callback with `expense.id`;
- have an accessible localized label;
- fit the existing row layout;
- preserve responsive/mobile behavior;
- respect the existing mutation-disabled state.

Reuse an existing button/icon pattern if available.

Do not introduce a new UI library.

## 6. Mutation state

Reuse the existing dashboard-wide `isMutating` mechanism.

Do not add a second pending-expense state unless there is a concrete UX requirement for concurrent expense deletions.

The current application intentionally permits only one mutation at a time through `runMutation`.

While a mutation is active, disable the relevant deletion controls consistently with category mutation controls.

## 7. Error handling

Expense deletion errors should follow the existing mutation error flow.

For `session_not_found`:

- call the existing `onSessionExpired` behavior.

For other failures:

- route the error through the existing `onOperationError` behavior.

Do not replace the expense query with a query error just because a delete mutation failed.

Since deletion is idempotent, a missing expense is not an error.

## 8. Localization

Add English and Spanish translations for any new visible or accessible delete-expense text.

Do not hardcode user-facing strings.

## 9. Storybook and tests

Update expense list/item stories to include the deletion interaction.

Add component tests covering:

- delete control renders;
- clicking it passes the correct expense ID;
- disabled mutation state disables deletion;
- existing expense rendering remains unchanged;
- empty-list behavior remains unchanged.

Update dashboard tests to verify that successful expense deletion:

1. calls `api.deleteExpense()` with the correct ID;
2. triggers the existing data refresh;
3. causes expense data and category/totals data to be reloaded.

Also cover deletion failure and session expiration using the same behavior as existing category mutations.

## 10. Validation

Verify:

- expense deletion returns `204`;
- Redis removes only the requested expense;
- deleting a missing expense succeeds;
- deleting through the UI removes the expense after refresh;
- category totals refresh;
- overall total refreshes;
- unclassified total refreshes when applicable;
- deleting the last expense shows the existing empty state;
- mutation controls respect `isMutating`;
- session expiration handling remains consistent;
- category creation/deletion still works;
- prompt expense creation still works.

## Constraints

Do not:

- refactor the dashboard refresh architecture;
- add optimistic state management;
- introduce React Query or another state library;
- modify TTL/session lifecycle;
- implement reclassification;
- add bulk deletion;
- add undo;
- add confirmation dialogs;
- refactor unrelated code.

Use the existing `runMutation → onDataChanged → refreshCounter` flow.