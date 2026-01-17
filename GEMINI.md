# Energy Consumption Monitor - Gemini Context

## Project Overview

**Energy Consumption Monitor** is a mobile-first Next.js 16 application designed to track and visualize household energy consumption (power and gas). It features interactive charts, contract management, and automatic cost calculations.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js (JWT strategy)
- **Styling**: Tailwind CSS 4
- **Visualization**: Chart.js, React Chartjs 2
- **Icons**: Font Awesome 6.5.1
- **Testing**: Jest, React Testing Library
- **Time Series**: Pond.js (for time series operations)

## Architecture

### Core Patterns
- **Event-Driven Architecture**: Backend uses an event bus to trigger side effects (e.g., cache invalidation) after data operations.
- **Repository Pattern**: Data access is abstracted via repositories (`src/repositories`) and interfaces.
- **Service Layer**: Business logic resides in services (`src/services`), separating it from data access and presentation.
- **User Isolation**: Critical security feature. Mongoose middleware (`src/models/sessionFilter.ts`) automatically filters queries and updates by `userId`.

### Data Flow
1.  **Frontend**: React Server Components & Client Components.
2.  **Server Actions**: Handle data mutations (`src/actions`).
3.  **Service Layer**: Executes business logic and emits events.
4.  **Repository Layer**: Interacts with MongoDB.
5.  **Events**: `EventBus` triggers handlers (e.g., to invalidate `DisplayEnergyData`).

## Active Feature: Phase 2 Frontend Adapter Layer

**Branch:** `feat/phase2-adapter-layer-with-test-fixes`
**Status:** Core Implementation Complete, Test Infrastructure Fixed.

**Goal:** Enable gradual, risk-free migration to the new backend using feature flags and an adapter layer.

**Key Components Implemented:**
- **Feature Flags**: `src/lib/backendFlags.ts` (Global & Component-level flags).
- **Adapter Hooks**: `useEnergyService` (Routes to old/new backend).
- **API v2**: `src/app/api/v2/` (New backend endpoints).
- **Server Actions**: Updated to support dual backends.

**Current Task:** Validation & Testing.
- Integration test infrastructure has been fixed (`jest.integration.setup.ts`, `__mocks__/next-auth.ts`).
- Ready to run full integration test suite.

## Key Commands

### Development
- **Start Dev Server**: `npm run dev` (Starts Next.js + In-memory MongoDB)
- **Start DB Only**: `npm run db:memory`
- **Start Next.js Only**: `npm run dev:next`

### Build & Production
- **Build**: `npm run build`
- **Start Production**: `npm start`
- **Docker Build**: `docker build -t energy-consumption .`

### Quality & Testing
- **Run All Tests**: `npm test` (Runs in `Europe/Berlin` timezone)
- **Test Specific File**: `npm test -- path/to/file.test.ts`
- **Run Integration Tests**: `npm test -- --selectProjects=integration` (Requires active DB or `npm run db:memory` first)
- **Test with Coverage**: `npm run test:coverage`
- **Lint**: `npm run lint`
- **Type Check**: `npm run type-check`
- **Full Quality Check**: `npm run quality:check`

## Project Structure

- `src/app/`: Next.js App Router pages and components.
- `src/actions/`: Server actions for data mutations.
- `src/models/`: Mongoose data models (Energy, Contract, User).
- `src/repositories/`: Data access layer (Interfaces & MongoDB implementations).
- `src/services/`: Business logic and event handling.
- `src/events/`: Event bus definition and event types.
- `src/lib/`: External library configs (MongoDB, Feature Flags).
- `feature-dev/`: Feature documentation and workflow guides.
- `__tests__/`: Co-located tests found throughout subdirectories.

## Development Workflow

Follow the established **Mobile-First** and **TDD** workflow:

1.  **Understand**: Read `feature-dev/WORKFLOW.md` and `CLAUDE.md`.
2.  **Plan**:
    - Mobile-first design (min touch target 44px).
    - Responsive behavior (mobile -> tablet -> desktop).
3.  **Implement**:
    - **Test-Driven Development (TDD)**: Write tests *before* implementation.
    - Use `src/app/constants` for configuration.
    - Ensure strict type safety (no `any`).
4.  **Verify**:
    - Run `npm test` to ensure no regressions.
    - Check test coverage.

## Coding Standards

- **TypeScript**: Strict mode enabled. No `any`, no `as` casting unless absolutely necessary.
- **Testing**:
    - Co-locate tests in `__tests__` directory next to the source file.
    - Naming: `filename.test.ts` or `filename.test.tsx`.
    - Maintain high coverage (>85%).
- **Styling**: Use Tailwind CSS utility classes.
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`).

## Important Files

- `CLAUDE.md`: Comprehensive project guidelines and architecture details.
- `README.md`: General project introduction and setup.
- `feature-dev/WORKFLOW.md`: Detailed development workflow.
- `package.json`: Dependencies and scripts.
- `docs/architecture/PHASE2-IMPLEMENTATION-SUMMARY.md`: Details on the active feature.