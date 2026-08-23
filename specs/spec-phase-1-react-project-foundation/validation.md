# Phase 1 Validation — React Project Foundation

Phase 1 is complete only when the project foundation passes the following checks.

Validated on 2026-08-23 with Node.js 24.16.0 and npm 11.13.0. The documented formatting, lint, strict type-check, test, Storybook static-build, and Next.js production-build commands passed. The Storybook development server and production application each returned HTTP 200. A separate `npm ci` followed by `npm run build` passed from a clean temporary directory.

## Application scaffold

- [x] The repository has a dependency manifest and lockfile ready to commit.
- [x] Next.js uses the App Router with React and strict TypeScript.
- [x] Tailwind CSS is configured and visible in the rendered application.
- [x] The minimal application page renders without a runtime error.
- [x] An existing mascot image loads from `public/assets` without modifying the source file.
- [x] The production application build succeeds.
- [x] The scaffold does not depend on a pre-existing `node_modules` or generated build directory.

## Source structure

- [x] App Router files, reusable components, stories, localization, shared types, utilities, and tests have clear locations.
- [x] Typed placeholder English and Spanish dictionaries compile successfully.
- [x] The structure is ready for Phase 2 component migration without a broad reorganization.
- [x] No classification route, persistence layer, or application workflow has been implemented prematurely.

## Storybook

- [x] Storybook starts through the documented package command.
- [x] Storybook uses the same global Tailwind styles as the application.
- [x] The representative component has typed props and at least one story.
- [x] The story renders an existing public mascot asset successfully.
- [x] Desktop and narrow viewport presets are available for later responsive review.
- [x] The static Storybook build succeeds.

## Quality tooling

- [x] The formatting check passes without modifying files.
- [x] Lint passes for application, story, and test files.
- [x] Strict TypeScript checking passes without emitting files.
- [x] Automated tests run non-interactively and pass.
- [x] A focused component test uses an accessible query rather than implementation-only selectors.
- [x] The production application build passes after all other checks.

## Documentation and repository hygiene

- [x] The README documents prerequisites, installation, development, Storybook, tests, formatting, linting, type-checking, and production build.
- [x] The README states that the scaffold has no live AI integration and needs no API key.
- [x] `.env.example` contains no real credential or sensitive value.
- [x] `.next`, Storybook static output, coverage output, and `node_modules` are ignored and untracked.
- [x] `docs/ui-mockup.html` remains unchanged.
- [x] The original mascot source assets remain unchanged.

## Scope review

- [x] The complete HTML mockup has not been migrated in this phase.
- [x] Category, expense, chart, language-control UI, and AI-classification workflows remain for later phases. At the user's direction, the typed localization scaffold includes a context-level language toggle but no language control is rendered.
- [x] No browser or server-side persistence has been added.
- [x] Runtime dependencies are limited to responsibilities approved by `specs/techstack.md`.
