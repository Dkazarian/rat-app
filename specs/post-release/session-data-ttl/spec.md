# Session Data TTL

## Goal

Use a simple fixed TTL strategy for all Redis data associated with a visitor session, while avoiding unnecessary TTL refreshes on every mutation.

The purpose of TTL is cleanup: session data must not remain in Redis indefinitely, and it must not disappear while the corresponding session is still expected to be usable.

## Requirements

- Session-related Redis keys use a fixed TTL of 48 hours.
- The session itself uses the same 48-hour lifetime.
- Categories, expenses, and any other session-scoped Redis collections receive a 48-hour TTL when their Redis key is first created.
- Ordinary reads and mutations must not refresh or extend the TTL.
- Existing `EXPIRE` calls whose only purpose is to refresh the full session TTL after each mutation should be removed.
- No session-scoped Redis key may be created without an expiration.
- Session activity must not create sliding expiration behavior.

## Expected Behavior

Example:

```text
session created
→ session key TTL = 48h

categories key first created
→ categories TTL = 48h

expenses key first created
→ expenses TTL = 48h

later HSET / HDEL operations
→ modify data only
→ do not modify TTL
```

It is acceptable for independently created keys to expire at slightly different times.

The important guarantees are:

- data does not persist indefinitely;
- data created for an active session has enough lifetime to remain available throughout normal session use;
- repeated activity does not keep old data alive forever.

## Implementation Notes

TTL assignment belongs to key creation, not to every domain mutation.

Operations such as:

- create/update/delete category;
- create/delete/reclassify expense;

should perform only the Redis writes required for that operation unless they are creating the underlying Redis key for the first time.

Avoid repeated patterns such as:

```ts
transaction.expire(keys.categories, config.sessionTtlSeconds);
transaction.expire(keys.expenses, config.sessionTtlSeconds);
```

after ordinary mutations.

## Out of Scope

- Sliding session expiration.
- Exact synchronization of expiration timestamps between Redis keys.
- Reading the remaining session TTL to derive child-key TTLs.
- `EXPIREAT`-based lifecycle coordination.
- Persistent user data.

## Validation

Verify that:

- session keys are created with a 48-hour TTL;
- category storage is created with a 48-hour TTL;
- expense storage is created with a 48-hour TTL;
- no session-scoped key is created without an expiration;
- subsequent category mutations do not change the category TTL;
- subsequent expense mutations do not change the expense TTL;
- deleting categories or expenses does not refresh unrelated TTLs;
- repeated activity does not extend session or data lifetime;
- expired session data is eventually removed automatically by Redis.

## Acceptance Criteria

The work is complete when all session-scoped Redis data has a fixed cleanup TTL, ordinary operations no longer refresh TTLs, and session activity cannot indefinitely extend stored data.