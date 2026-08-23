# Phase 1 Plan — React Project Foundation

## Group 1 — Establish the application scaffold

- [x] Create the dependency manifest and lockfile using a compatible Next.js, React, TypeScript, and Node.js toolchain.
- [x] Configure the Next.js App Router and strict TypeScript.
- [x] Configure Tailwind CSS and global styles.
- [x] Create the root layout and a minimal application page.
- [x] Confirm existing public mascot assets resolve through the application.
- [x] Update `.gitignore` for generated application, Storybook, test, and coverage output.

## Group 2 — Establish source boundaries

- [x] Create predictable locations for reusable components, stories, localization, shared types, utilities, and tests.
- [x] Add typed placeholder English and Spanish message dictionaries without migrating full interface copy.
- [x] Define the convention for colocated component stories and tests.
- [x] Keep future server route handlers within the App Router boundary without creating the classification route yet.
- [x] Document the chosen structure briefly where it is not self-explanatory.

## Group 3 — Configure Storybook

- [x] Install and configure Storybook for the selected Next.js and React versions.
- [x] Load the same global Tailwind styles used by the application.
- [x] Configure useful desktop and narrow viewport presets.
- [x] Create one representative prop-driven component using an existing mascot asset.
- [x] Add stories that demonstrate the component, global styles, and public asset loading.
- [x] Verify both the Storybook development server and static Storybook build.

## Group 4 — Configure quality tooling

- [x] Configure formatting and a non-mutating formatting check.
- [x] Configure linting for the application, stories, and tests.
- [x] Add a strict no-emit TypeScript command.
- [x] Configure a React-compatible test runner and DOM testing utilities.
- [x] Add shared test setup only where required.
- [x] Add a focused accessible render test for the representative component.
- [x] Ensure all quality commands can run non-interactively.

## Group 5 — Document and validate the foundation

- [x] Add `.env.example` with safe placeholders or guidance and no credential values.
- [x] Document install, development, Storybook, test, type-check, lint, formatting, and production commands in the root README.
- [x] Document that Phase 1 has no live AI integration and requires no API key.
- [x] Run formatting check, lint, type-check, tests, Storybook static build, and Next.js production build.
- [x] Confirm generated output and dependency directories are not tracked.
- [x] Review the scaffold against `requirements.md` and record the results in `validation.md`.

## Completion handoff

After this phase passes validation, Phase 2 can decompose `docs/ui-mockup.html` into reusable React components and Storybook stories without changing the established toolchain or source boundaries.
