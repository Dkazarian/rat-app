# Source structure

- `app/` owns App Router layouts, pages, and later `app/api/**/route.ts` handlers.
- `components/` groups composite components with their owned child components, stories, and tests. Standalone single-file components live directly in `components/` rather than in one-file directories.
- `localization/` contains typed message dictionaries, `LanguageProvider`, and the `useLanguage` context hook.
- Future shared domain types and framework-independent helpers belong in `types/` and `utils/` when they have real consumers.
- `test/` contains test setup and reusable render helpers.

Static files remain under the repository-level `public/` directory. Future server route handlers stay inside `app/api`; Phase 1 intentionally defines no API route.
