# Energy Consumption Monitor - Agent Guidelines

This document serves as the primary technical reference for agentic coding agents operating within this repository. It outlines the technology stack, development workflows, code style, and security mandates.

## 🛠 Build & Development Commands

### General Commands
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with in-memory MongoDB. |
| `npm run build` | Build frontend and server. |
| `npm run lint` | Run ESLint across the project. |
| `npm test` | Run all unit tests using Vitest. |
| `npm run test:e2e` | Run Playwright E2E tests. |

### Specialized Testing
- **Run specific test file:** `npx vitest <path-to-file>`
- **Run tests in watch mode:** `npx vitest`
- **Coverage report:** `npx vitest --coverage`

## 🚀 CI/CD Pipelines

The project uses **CircleCI** for continuous integration and deployment.
- **Workflow:** `build_test_deploy`
- **Configuration:** `.circleci/config.yml`
- **Secrets required:** `DOCKER_USER`, `DOCKER_TOKEN` (for pushing images).

## 📏 Code Style & Guidelines

Follow the **Google TypeScript Style Guide** as a baseline.

**📖 Comprehensive Style Guide:** See [`STYLEGUIDE.md`](./STYLEGUIDE.md) for detailed patterns, conventions, and architectural decisions used throughout the codebase.

### 1. Naming Conventions
- **Files:** 
  - PascalCase for SolidJS components (`MyComponent.tsx`).
  - camelCase for logic, utilities, and services (`numberUtils.ts`, `readingService.ts`).
  - `.test.ts` or `.test.tsx` for test files.
- **Interfaces/Types:** `UpperCamelCase`. 
  - Avoid `I` prefix (e.g., use `Meter` not `IMeter`) for new types.
  - Note: Some legacy models still use the `I` prefix.
- **Variables/Functions:** `lowerCamelCase`.
- **Constants:** `CONSTANT_CASE` for global/exported constants.

### 2. Imports & Exports
- **ES6 Modules:** Use `import`/`export` exclusively. No `require`.
- **Named Exports:** Prefer named exports for utilities and libraries.
- **Default Exports:** Typically used for top-level Page components (SolidJS Router convention).
- **Import Grouping:**
  1. Standard libraries (e.g., `solid-js`, `express`).
  2. Third-party packages.
  3. Internal aliases/absolute paths (e.g., `../components`, `../lib`).
  4. Relative paths.

### 3. TypeScript & Types
- **No `any`:** Strictly forbidden in production code (`@typescript-eslint/no-explicit-any: error`). 
  - Use `unknown` with type guards or define specific interfaces.
  - `any` is permitted as a warning ONLY in test files.
- **Type Inference:** Use for simple assignments. Be explicit for function return types and complex objects.
- **Strict Null Checks:** Always handle `null` or `undefined`. Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately.

### 4. Component Structure (SolidJS)
- **State Management:** Use `createSignal` for local state and `createStore` for complex/nested state.
- **Reactivity:** Avoid destructuring props (breaks reactivity). Use `props.propName` or `splitProps`.
- **Modularity:** 
  - Adhere to `max-lines-per-function: 100`.
  - Adhere to `complexity: 10`.
  - Extract complex JSX into sub-components.
- **Styling:** Use Tailwind CSS 4 utility classes. Prefer DaisyUI components where applicable.

### 5. Backend & Database (Node.js/Mongoose)
- **API Architecture:** Integrated API middleware handled in `src/api/handler.ts`.
- **Security (Multi-tenancy):**
  - **CRITICAL:** Every database query MUST be isolated by `userId`.
  - All Mongoose models must use the `applyPreFilter` middleware from `src/models/sessionFilter.ts`.
  - Always pass `{ userId }` in `.setOptions()` when calling Mongoose queries:
    ```typescript
    const meters = await Meter.find({}).setOptions({ userId });
    ```
- **Validation:** Sanitize all incoming request bodies to prevent NoSQL injection.

### 6. Error Handling & Logging
- **Async/Await:** Wrap async operations in `try/catch` blocks.
- **API Responses:** Always return consistent JSON error objects: `{ error: "Message" }`.
- **Logging:** Use `console.warn` or `console.error` for legitimate issues. `console.log` is flagged by the linter and should be avoided in production code.

## 🧪 Testing Guidelines
- **TDD (Test-Driven Development):** Highly encouraged. Implement tests before logic.
- **Database Isolation:** Use `mongodb-memory-server` for all tests requiring a database.
- **Component Tests:** Use `@solidjs/testing-library` for UI testing.
- **Mocking:** Use Vitest's mocking capabilities for external services (like Gemini OCR).

## 📂 Project Structure Overview

- `src/api/`: Express server logic and main API handler.
- `src/components/`: Reusable SolidJS UI components.
- `src/context/`: SolidJS Context providers (Auth, Toast, etc.).
- `src/lib/`: Business logic, services (OCR, Pricing, Consumption), and utilities.
- `src/models/`: Mongoose schemas and models with multi-tenancy logic.
- `src/pages/`: Top-level route components.
- `src/types/`: Global TypeScript definitions and model interfaces.
- `scripts/`: Development and build scripts.
- `e2e/`: Playwright end-to-end tests.

## 🤖 AI Interaction Guidelines
- **Self-Correction:** If a linting error or test failure is introduced, fix it immediately.
- **Conventional Commits:** Use clear, descriptive commit messages.
- **Documentation:** Update this file or other relevant docs if project conventions evolve.
