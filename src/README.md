# Source structure

```text
src/
  app/          Next.js page and anonymous-session HTTP routes
  components/   Reusable UI and application framing
  contracts/    Shared browser/server API wire contracts
  features/     Category, expense, and dashboard UI with focused Hooks
  server/       Server-only domain rules, Redis repositories, HTTP helpers, and seeder
  i18n/         Typed English and Spanish translations
  styles/       Global Tailwind styles
  test/         Shared test setup and route/rendering helpers
  utils/        Presentation-neutral browser/server helpers
```

## Boundaries

- `app/session/` contains thin route handlers. It validates transport input and delegates authoritative behavior to `server/`.
- `contracts/` contains stable JSON wire types. It imports neither React nor server implementations.
- `server/` is server-only. Redis credentials, persistence, stored records, category/expense rules, session identity, and deterministic seed data stay here.
- `features/dashboard/api/` is the browser HTTP boundary. It uses same-origin credentials and stable error envelopes and never reads Redis configuration.
- `usePageSession` owns only session readiness, retry, a page-wide one-at-a-time mutation gate, and a refresh signal.
- `DashboardResults` owns the categories query used by Category Panel and Spending Summary. Its nested expense section independently owns the expenses query. Both protect against aborted and stale responses.
- Category and expense writes run through the shared mutation gate and refresh server-authoritative data after success. No browser domain service or page-wide mutable snapshot remains.

## Runtime state and fixtures

Production sessions start with no real categories and no expenses. Unclassified is an implicit localized presentation bucket represented by `categoryId: null`; it is never stored as a category record. Food, Home, and Transport are ordinary category names.

The browser obtains or resumes an anonymous session through `POST /session`. Redis keys are scoped by environment prefix and session UUID, expire after the configured TTL, and are never exposed to the browser. The Phase 5 prompt route intentionally returns `501 classification_unavailable`; Phase 6 will replace that endpoint behavior.

Run `npm run seed:redis` to load `.env.development.local`, replace one exact non-production session family with deterministic backend fixtures, verify it through the repositories, and register it as the active seeded session. Pass a fixed ID with `npm run seed:redis -- --session-id <uuid>`. Production seeding is refused.

Storybook uses injected API-shaped fixtures and does not require Redis, cookies, or Upstash credentials. Tests and stories remain colocated with the code they cover; Redis integration tests use a unique prefix and exact-key cleanup.
