# Session Data TTL — Implementation Plan

## Objective

Implement the existing Session Data TTL spec with fixed, non-sliding expiration for the session metadata, category hash, and expense hash.

Use the existing `sessionTtlSeconds` configuration value. Its default and documented value are already `172_800` seconds (48 hours).

The key implementation rule is:

- a newly created Redis key receives the configured TTL;
- a key that already has a TTL keeps its current remaining TTL;
- reads, updates, and deletes never extend a TTL.

Use Redis `EXPIRE key seconds NX` when a write may create a hash. The `NX` option applies the expiration only when the key does not already have an expiration, so it protects newly created keys without turning mutations into sliding expiration.

## 1. Stop renewing sessions during bootstrap

Update `src/server/redis/session-repository.ts`:

- delete `renewSessionTtl()`;
- keep `getSessionId()` read-only;
- keep `saveSessionId()` as the session-metadata creation operation;
- change the metadata expiration in `saveSessionId()` to:

`expire(keys.meta, config.sessionTtlSeconds, "NX")`

Using `NX` makes a retry with the same ID unable to extend an existing session.

Update `src/server/session/resolve-session.ts`:

- remove the `renewSessionTtl` import and call;
- when a valid cookie points to a live metadata key, return the existing session immediately;
- create and save a replacement session only for a missing, malformed, or expired cookie.

Update `src/server/session/resolve-session.test.ts`:

- remove the `renewSessionTtl` mock;
- assert that resuming a live session reads it but does not save or mutate it;
- retain the replacement-session coverage.

Do not replace renewal with any other TTL write.

## 2. Make the browser cookie fixed-lifetime too

Update `src/app/api/v1/session/route.ts` so the session cookie is written only when `resolved.created` is `true`.

For a newly created or replacement session, keep the existing cookie settings and `maxAge: config.sessionTtlSeconds`.

For an existing live session:

- return `204 No Content`;
- do not emit a `Set-Cookie` header;
- do not restart the cookie's 48-hour lifetime.

Update `src/app/api/v1/session/route.test.ts`:

- remove `renewSessionTtl` from the repository mock;
- keep the new-session cookie assertions;
- in the live-session test, assert `set-cookie` is `null` as well as asserting no new session is saved;
- keep the production `Secure` assertion on newly created sessions.

This keeps the cookie and Redis metadata on the same fixed-lifetime model. Do not read `createdAt` to calculate a remaining cookie lifetime.

## 3. Apply category TTL only on hash creation

Update `src/server/redis/categories.ts`.

### `createCategory()`

Keep the existing transaction, but change:

`expire(keys.categories, config.sessionTtlSeconds)`

to:

`expire(keys.categories, config.sessionTtlSeconds, "NX")`

The first category creates the hash and receives a TTL. Later category creation leaves the existing TTL unchanged.

### `deleteCategory()`

Keep the existing category validation, expense reclassification, and transaction.

- remove the unconditional expiration of `keys.categories`;
- do not expire the category hash after `HDEL`;
- track whether at least one expense is reclassified;
- only when the transaction queues one or more expense `HSET`s, also queue:

`expire(keys.expenses, config.sessionTtlSeconds, "NX")`

The conditional `NX` expiration covers the edge case where the expense hash disappears between the initial read and the transaction and an `HSET` recreates it. It must not refresh a live expense hash.

Do not expire the metadata key or any unrelated key from category operations.

## 4. Apply expense TTL only on hash creation

Update `src/server/redis/expenses.ts`.

### `createExpenses()`

Keep the session existence check, limits, validation, and empty-candidate early return.

After queueing the expense `HSET`s, change the expiration to:

`expire(keys.expenses, config.sessionTtlSeconds, "NX")`

The first non-empty expense creation receives a TTL. Later expense creation leaves the remaining TTL unchanged. An empty candidate list must continue to create no key.

### `deleteExpense()`

Leave it as `HDEL` only. Do not add an expiration call.

Do not expire the metadata or category keys from expense operations.

## 5. Preserve TTLs during development seeding

Update `src/server/seed/seed-session.ts`.

Keep the production guard and live-session existence check.

In the seed transaction:

- keep the category and expense `HSET`s;
- remove expiration of `keys.meta` entirely;
- expire `keys.categories` with `config.sessionTtlSeconds` and `"NX"`;
- expire `keys.expenses` with `config.sessionTtlSeconds` and `"NX"`.

This gives newly created fixture hashes a TTL while repeated seeding preserves the remaining TTL of the session and existing fixture hashes.

Do not renew the session to make seeding more convenient.

## 6. Teach the in-memory Redis test double `EXPIRE NX`

Update `src/test/in-memory-redis.ts` so both direct and transactional `expire()` accept the optional Redis expire mode used by production code.

Implement the `NX` behavior needed by this feature:

- return `0` when the key does not exist;
- return `0` without changing `expiresAt` when the option is `NX`/`nx` and the key already has an expiration;
- otherwise set `expiresAt` and return `1`.

Forward the option unchanged from `InMemoryRedisTransaction.expire()` to `InMemoryRedis.expire()`.

Do not weaken the test double by treating `NX` like an unconditional expiration.

## 7. Add focused fixed-TTL persistence coverage

Extend `src/server/redis/persistence.test.ts` with deterministic time control using Vitest fake timers and `vi.setSystemTime()`.

Use the existing test configuration value of `300` seconds. Add focused assertions for these exact cases:

1. `saveSessionId()` creates metadata with TTL `300`.
2. Reading the session later does not change its remaining TTL.
3. Creating the first category creates the category hash with TTL `300`.
4. Creating another category after advancing time leaves the category TTL reduced; it does not return to `300`.
5. Creating the first expense creates the expense hash with TTL `300`.
6. Creating another expense after advancing time leaves the expense TTL reduced.
7. Deleting a category does not refresh the category TTL.
8. Reclassifying expenses during category deletion does not refresh the expense TTL.
9. Deleting an expense does not refresh the expense TTL or any unrelated TTL.
10. After the last field is deleted and a later mutation recreates that hash, the recreated hash receives a fresh TTL.
11. Advancing beyond each key's fixed deadline causes the in-memory Redis implementation to remove it.

Use exact TTL assertions after controlled clock advances, for example `300` immediately after creation and `240` after advancing 60 seconds. Do not use broad `greaterThan(0)` assertions for the no-refresh behavior.

Retain the existing persistence coverage for round trips, isolation, limits, corruption handling, and idempotent expense deletion.

Restore real timers after the TTL tests so other suites are not affected.

## 8. Update seeder tests for non-renewal

Update `src/server/seed/seed-session.test.ts`.

Create the metadata key with an expiration in test setup, matching a real saved session rather than relying on the seeder to repair metadata.

With fake time, verify both paths:

- when category and expense hashes do not exist, seeding creates them with the configured TTL;
- when metadata, category, and expense keys already have reduced TTLs, repeated seeding updates fixture values without increasing any remaining TTL.

Keep the assertions that seeding does not touch another session, is forbidden in production, and rejects a missing/expired session.

## 9. Keep rate-limit expiration separate

Do not change `src/server/redis/ai-rate-limiter.ts`.

The session burst and global burst keys are operational rate-limit windows, not session data collections. Their existing one-minute `PEXPIRE` behavior is intentional. The lifetime request count remains a field in the fixed-lifetime session metadata hash and therefore expires with that hash.

## 10. Validation

Run, in this order:

1. `npm test`.
2. `npm run typecheck`.
3. `npm run lint`.
4. `npm run format:check`.
5. `npm run build`.

Verify from the tests that:

- the default session lifetime remains `172_800` seconds;
- new metadata, category, and expense keys always have an expiration;
- existing key TTLs decrease with time and never jump back to the configured duration after activity;
- reads perform no TTL writes;
- category and expense deletions perform no unrelated TTL writes;
- repeated session bootstrap does not renew Redis metadata or the browser cookie;
- repeated development seeding does not renew existing data;
- keys disappear after their independent fixed deadlines;
- existing API, dashboard, category, expense, AI, and seeding behavior still passes.

## Constraints

Do not:

- introduce sliding expiration;
- use `EXPIREAT`;
- derive child TTLs from the metadata key's remaining TTL;
- synchronize independent key expiration timestamps;
- add a background cleanup job;
- add a new configuration variable;
- replace the existing Redis key structure;
- change the 48-hour default;
- change rate-limit windows;
- refactor unrelated API or UI code.

Use `EXPIRE ... NX` for writes that may create a session-scoped hash, and use no expiration command at all for reads and delete-only operations.
