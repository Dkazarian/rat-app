# Simplify Session Data Reads

## Goal

Keep Redis modules focused on stored records, move response projection to API endpoints, avoid duplicate prompt reads, and remove the category/expense circular dependency.

## Requirements

### Redis collections

- Replace Redis `getCategories()` and `getExpenses()` with:

  ```ts
  listCategories(sessionId: string): Promise<StoredCategory[]>;
  listExpenses(sessionId: string): Promise<StoredExpense[]>;
  ```

- Return validated stored records, not API response DTOs.
- Preserve field-ID and record-ID validation and repository error handling.
- Make `createCategory()` return `StoredCategory`; add `totalMinor: 0` at the API boundary.
- Do not call `toCategoriesResponse()` or `toExpensesResponse()` inside `src/server/redis`.

### API endpoints

- `GET /api/v1/categories` loads both collections once and calls `toCategoriesResponse()`.
- `GET /api/v1/expenses` loads both collections once and calls `toExpensesResponse()`.
- Keep existing empty-session responses and public response shapes.
- Do not add query modules used only by these endpoints.

### Prompt submission

- Load `listCategories()` and `listExpenses()` once each before extraction.
- Derive category names, category IDs, expense count, and remaining capacity from those records.
- Keep `createExpenses()` authoritative: it must reread current data after the AI call before persisting.
- Do not add a prompt-context abstraction.

### Category deletion

- Move `deleteCategory()` to `src/server/redis/category-deletion.ts`.
- Read categories and expenses there using existing low-level readers.
- Preserve `category_not_found` for a missing category.
- Unclassify matching expenses and remove the category in one Redis transaction.
- Keep the operation inline and readable; do not pass a transaction into a helper.
- Import this command directly from the category DELETE endpoint.

Dependency direction must remain acyclic:

```text
category-deletion.ts -> categories.ts
category-deletion.ts -> expenses.ts
expenses.ts          -> categories.ts
categories.ts        -> no expense module
```

## Constraints

Do not change:

- Redis keys or hash layout;
- encoding or validation rules;
- API contracts or status codes;
- session, cookie, or TTL behavior;
- category or expense business rules;
- rate limiting or concurrency behavior.

Do not introduce a generic repository, service, query, or session-data abstraction.

## Validation

Verify that:

- Redis list operations return stored records;
- response projection occurs only in GET endpoints;
- prompt submission reads each collection once before extraction;
- expense creation retains its later validation reads;
- category deletion remains transactional and returns `category_not_found` when needed;
- `categories.ts` no longer imports `expenses.ts`;
- API behavior remains unchanged;
- tests use mocks or the in-memory Redis fake, never Upstash.

## Acceptance Criteria

Redis modules return stored records, endpoints own response projection, prompt submission avoids duplicate initial reads, and category deletion uses a dedicated command with no circular module dependency.
