# Phase 1 Requirements — React Project Foundation

## Objective

Establish the React development environment in which the approved Ratapp HTML mockup can be migrated and reviewed safely in the next phase.

This phase creates the application scaffold, Storybook workspace, source structure, and automated quality commands. It does not migrate the complete mockup, implement session behavior, or connect to OpenRouter.

## Required foundation

The repository must provide:

- A Next.js application using the App Router, React, and strict TypeScript.
- Tailwind CSS configured for application and component styling.
- Storybook configured for the project's React and Next.js environment.
- A minimal application page that proves the scaffold renders successfully.
- A representative, reusable component rendered by both the application and Storybook.
- At least one Storybook story that proves global styles and public mascot assets load correctly.
- A test environment suitable for React components and browser-oriented behavior.
- Formatting, linting, strict type-checking, testing, development, Storybook, and production-build commands.
- A committed dependency manifest and lockfile with no undeclared reliance on existing generated directories.
- Safe environment-variable guidance through `.env.example` without real credentials.

## Source structure

Establish clear locations for:

- App Router pages, layouts, and future route handlers.
- Reusable UI components.
- Storybook stories colocated with, or predictably adjacent to, their components.
- Typed English and Spanish message dictionaries.
- Shared domain types and utilities.
- Test setup and reusable test helpers.
- Static assets under `public`.

The structure must support the Phase 2 HTML migration without requiring a new scaffold or moving the whole application again.

## Development contracts

The package scripts must provide stable commands for:

- Starting the Next.js development server.
- Creating a production build and starting it locally.
- Starting Storybook and building its static output.
- Running the formatter or checking formatting.
- Running lint.
- Running strict TypeScript checks without emitting files.
- Running automated tests in a non-interactive mode suitable for CI.

Command names should follow familiar npm conventions and be documented in the repository README.

## Representative component

Create one small prop-driven component to verify the complete toolchain. It must:

- Use TypeScript props.
- Use Tailwind styles.
- Render an existing Ratapp mascot asset from `public/assets`.
- Have at least one Storybook story.
- Have a focused render test with an accessible query.
- Serve only as scaffold evidence; it must not preempt the component decomposition planned for Phase 2.

## Constraints

- Treat `docs/ui-mockup.html` as read-only visual reference material in this phase.
- Preserve the existing source mascot PNGs without recompression or replacement.
- Do not migrate the complete mockup yet.
- Do not implement category, expense, chart, locale-switching, or classification behavior.
- Do not add OpenRouter calls, API routes, rate limiting, persistence, or environment secrets.
- Do not use `localStorage`, IndexedDB, cookies, or a database.
- Keep runtime dependencies minimal and aligned with `specs/techstack.md`.
- Do not commit generated output such as `.next`, Storybook static builds, coverage reports, or dependency directories.
- Prefer configuration supported by the selected compatible package versions rather than legacy setup patterns.

## Documentation

The root README must explain:

- Required Node.js and package-manager prerequisites.
- Dependency installation.
- Application development and production-build commands.
- Storybook development and static-build commands.
- Formatting, linting, type-checking, and test commands.
- That the initial scaffold contains no live AI integration and requires no API key.
