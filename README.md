# Ratapp

Ratapp is a playful expense-classification demo. This repository currently contains the Phase 1 React foundation: a minimal Next.js application, a representative component, Storybook, and automated quality tooling.

Phase 1 has no live AI integration and requires no API key. The approved interface in `docs/ui-mockup.html` remains reference material for Phase 2.

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
