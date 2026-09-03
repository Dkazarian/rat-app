# Ratapp

Ratapp is a bilingual expense-classification demo built with Next.js, React, and TypeScript. It supports session-only category management, expense capture, reclassification and deletion, and a synchronized spending summary in English and Spanish.

The current implementation includes the Phase 4.5 category and expense services. Capture uses a fixed demo batch (lunch, coffee, and taxi), regardless of the submitted text; live AI extraction is planned for Phase 5. No API key or environment configuration is required to run the current demo. Refreshing resets the session and language.

## Project map

- [`src/app`](src/app) — Next.js route entry points and root layout.
- [`src/features`](src/features) — category and expense UI, feature Hooks, and dashboard coordination.
- [`src/services`](src/services) — framework-independent category and expense services, domain types, errors, and service tests.
- [`src/components`](src/components) — common UI and application layout components.
- [`src/i18n`](src/i18n), [`src/styles`](src/styles), and [`src/utils`](src/utils) — translations, global styles, and shared helpers.
- [`public/assets`](public/assets) — mascot images served by the application.
- [`docs`](docs) — approved mockup and design references.
- [`specs/roadmap.md`](specs/roadmap.md) — delivery status and links to phase requirements and validation evidence.

See [`src/README.md`](src/README.md) for placement and dependency rules, and [`specs/techstack.md`](specs/techstack.md) for the current architecture and planned server boundary.

## Prerequisites

- Node.js 24 or newer (active LTS)
- npm 11 or newer

## Install

```sh
npm install
```

## Application

Start the development server at `http://localhost:3000`:

```sh
npm run dev
```

Create and serve a production build:

```sh
npm run build
npm run start
```

## Storybook

Start Storybook at `http://localhost:6006` or create its static output:

```sh
npm run storybook
npm run build-storybook
```

Story files are colocated with components as `*.stories.tsx`. Component tests use `*.test.tsx` beside the component; shared test setup and helpers live in `src/test`.

## Quality commands

```sh
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
```

The formatting check, lint, type-check, tests, Storybook build, and Next.js build all run non-interactively and are suitable for CI.
