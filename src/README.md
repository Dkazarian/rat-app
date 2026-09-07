# Source structure

```text
src/
  app/          Next.js page and anonymous-session HTTP routes
  components/   Reusable UI and application framing
  contracts/    Shared browser/server API wire contracts
  features/     Category, expense, and dashboard UI with focused Hooks
  server/       Server-only domain rules, concrete Redis modules, HTTP helpers, and seeder
  i18n/         Typed English and Spanish translations
  styles/       Global Tailwind styles
  test/         Shared test setup and route/rendering helpers
  utils/        Presentation-neutral browser/server helpers
```

## Boundaries

- `app/api/v1/` contains thin browser-facing route handlers. They resolve the cookie session, validate transport input, and call `server/` functions directly.
- `contracts/` contains stable JSON wire types. It imports neither React nor server implementations.
- `server/` is server-only. Redis credentials, persistence, stored records, category/expense rules, session identity, and deterministic seed data stay here.
- `features/dashboard/api/` is the browser HTTP boundary. It uses same-origin credentials and stable error envelopes and never reads Redis configuration.
- `useSessionBootstrap` owns only cookie-session readiness, initialization error, and retry. `DashboardPage` owns the page-wide one-at-a-time mutation gate and refresh signal.
- `DashboardResults` owns the categories query used by Category Panel and Spending Summary. Its nested expense section independently owns the expenses query. Both protect against aborted and stale responses.
- Category and prompt writes run through the shared mutation gate and refresh server-authoritative data after success. Expenses are read-only in the initial release. No browser domain service or page-wide mutable snapshot remains.

## Runtime state and fixtures

Production sessions start with no real categories and no expenses. Unclassified is an implicit localized presentation bucket represented by `categoryId: null`; it is never stored as a category record. Food, Home, and Transport are ordinary category names.

The browser obtains or resumes an anonymous session through `POST /api/v1/session`. The `ratapp_session` HttpOnly cookie is the only browser-facing session identity; resource requests use same-origin credentials and never include a session ID in their URLs or payloads. The cookie and environment-scoped Redis keys share the configured 48-hour TTL. `POST /api/v1/expenses/prompt` sends only the exact prompt, locale, and current real-category names to the server-only OpenRouter extractor. The server validates candidates, assigns IDs and timestamps, persists accepted expenses, and returns safe error envelopes. Configure `OPENROUTER_API_KEY` and `OPEN_ROUTER_MODEL` only in the server environment; the accepted model is `google/gemma-4-26b-a4b-it:free`.

For a manual development test, first create a normal session through `POST /api/v1/session`, inspect the development-only `ratapp_session` cookie value in browser developer tools, then run `npm run seed:redis -- --session-id <uuid>`. The API itself never returns the ID. The command loads `.env.development.local`, verifies that the session already exists, writes trusted deterministic category and expense fixtures directly with the concrete Redis client, and renews the configured TTL. It never creates or registers a session, and production seeding is refused.

Storybook uses injected API-shaped fixtures and does not require Redis, cookies, or Upstash credentials. Tests and stories remain colocated with the code they cover; Redis tests use an in-memory mock and never contact Upstash.
