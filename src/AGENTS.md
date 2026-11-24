# `src/` — Agent guidelines

This is the whole application: the SolidJS browser frontend, the integrated Express API, and the Mongoose data layer. Repo-wide commands, CI and general style live in [`../AGENTS.md`](../AGENTS.md); this file holds the rules that are specific to `src/`.

## Layout

| Path | Contents |
| :--- | :--- |
| `src/api/` | Express API mounted into Vite (`handler.ts` → `router.ts` → `controllers/`); `validation.ts` holds request validation. |
| `src/components/` | Reusable SolidJS components; component tests sit in `src/components/__tests__/` or beside the component as `*.test.tsx`. |
| `src/context/` | SolidJS context providers (Auth, Toast). |
| `src/lib/` | Business logic and services (consumption, pricing, OCR, import/export), plus the `google/` and `intake/` submodules with their own `__tests__/`. |
| `src/models/` | Mongoose schemas. Every schema must call `applyPreFilter` from `sessionFilter.ts`. |
| `src/pages/` | Top-level routed page components; these are the usual default exports. |
| `src/types/` | Shared TypeScript definitions. |
| `src/assets/`, `src/index.css` | Static assets and Tailwind CSS 4 / DaisyUI styling. |

## Frontend (SolidJS)

- **State:** Use `createSignal` for local state and `createStore` for complex/nested state.
- **Reactivity:** Avoid destructuring props (breaks reactivity). Use `props.propName` or `splitProps`.
- **Modularity:** Keep functions under 100 lines and cyclomatic complexity under 10; extract complex JSX into sub-components.
- **Styling:** Use Tailwind CSS 4 utility classes; prefer DaisyUI components where applicable.

## Backend & database (multi-tenancy is critical)

- The API is integrated middleware, not a separate service: `src/api/handler.ts` connects to MongoDB, authenticates the session and dispatches protected requests to `src/api/router.ts`, which maps paths to controllers in `src/api/controllers/`. The production server bundle is built from `src/api/server.ts`.
- **CRITICAL:** Every database query MUST be isolated by `userId`. All Mongoose models must call `applyPreFilter(schema)` from `src/models/sessionFilter.ts`. Its pre-hooks read `userId` from the query options and inject the tenant filter into `find`/`findOne`/`countDocuments`/aggregates/updates/deletes. Forgetting to pass the option drops the filter.
- Always pass `{ userId }` in `.setOptions()` when calling Mongoose queries:
  ```typescript
  const meters = await Meter.find({}).setOptions({ userId });
  ```
- Sanitize and validate all incoming request bodies (`src/api/validation.ts`) before use to prevent NoSQL injection.
- API errors are always a consistent JSON object: `{ error: "Message" }`. Unauthenticated requests get `401 { error: "Unauthorized" }` from `handler.ts`.
- Wrap async operations in `try/catch`; log legitimate issues with `console.warn` / `console.error` only (`console.log` is flagged by oxlint).

## Unit tests (Vitest)

- Run them from the repo root with `npm test` / `npx vitest` — the command variants are in [`../AGENTS.md`](../AGENTS.md#-build--development-commands).
- Vitest is configured in `vite.config.ts`: jsdom environment, globals enabled, `@testing-library/jest-dom` setup file, `e2e/` excluded, JUnit results written to `test-results/junit.xml`.
- Tests live either in colocated `*.test.ts(x)` files or in `__tests__/` folders next to the code; both are discovered. Mixing is fine — follow what the neighbouring code does.
- Use `mongodb-memory-server` for any test that needs a database, `@solidjs/testing-library` for component tests, and Vitest mocks for external services (Gemini OCR, Google APIs).
- TDD is encouraged: write the test before the logic.
- Note: oxlint's `ignorePatterns` skip `**/__tests__/**` and `e2e/**`, but not colocated `*.test.ts(x)` files, so those still need to lint clean.
