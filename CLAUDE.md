# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Energy Consumption Monitor** - a Next.js 16 application for tracking and visualizing household energy consumption (power and gas). The app uses MongoDB for data persistence, NextAuth for authentication, Chart.js for data visualization, and Font Awesome for action icons (edit, delete, add operations).

## Development Commands

```bash
# Development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run all tests (with Berlin timezone)
npm test

# Release management
npm run release              # Auto-versioned release
npm run release:patch        # Patch version bump
npm run release:minor        # Minor version bump
npm run release:major        # Major version bump
```

### Testing

- Tests use Jest with jsdom environment
- Test files follow pattern: `__tests__/*.test.tsx` or `__tests__/*.test.ts`
- Path alias `@/` maps to `src/`
- Tests run in `Europe/Berlin` timezone (set via `TZ` env var)
- Run specific test: `npm test -- path/to/test.test.tsx`
- Run tests with coverage: `npm test -- --coverage`

**Test Coverage** (as of latest update):
- Statements: 83.9% (9,140/10,893)
- Branches: 90.82% (683/752)
- Functions: 39.9% (160/401)
- Lines: 83.9% (9,140/10,893)

**Coverage Notes**:
- All critical user-facing components have comprehensive test coverage
- CSV import components (CSVFileUpload, CSVClipboardPaste) are fully tested
- Cost calculation handlers have extensive test coverage
- Custom hooks maintain 100% coverage
- Validation services maintain 100% coverage

## Architecture

### Authentication & User Isolation

The application implements **user-scoped data access** through Mongoose middleware:

- `src/models/sessionFilter.ts` contains the core isolation mechanism
- `applyPreFilter()` is called on Energy and Contract schemas to automatically:
  - Add `userId` filter to all queries (find, findOne, updates, deletes)
  - Inject `userId` into documents on save operations
- Session managed via NextAuth with JWT strategy
- Auth config in `src/pages/api/auth/[...nextauth].ts`

**Important**: All user-specific models (Energy, Contract) extend the `UserSpecific` type and apply `applyPreFilter()` to ensure data isolation.

### Data Models

Located in `src/models/`:

- **Energy**: Tracks consumption readings (type: "power" | "gas", amount, date)
- **Contract**: Stores energy contracts (type, dates, basePrice, workingPrice)
- **User**: User accounts with bcrypt password hashing
- **FeatureFlag**: Runtime feature toggles

All models use Mongoose with MongoDB connection via `src/lib/mongodb.ts`.

### Application Structure

**Next.js App Router** (`src/app/`):

- `/` - Root redirects to `/dashboard` if authenticated, else `/login`
- `/dashboard` - Main energy visualization page
- `/add` - Form for adding energy readings + CSV import
- `/contracts` - Contract management
- `/login` & `/register` - Authentication pages
- `/api/*` - API routes (contracts, energy, health)

**Server Actions** (`src/actions/`):

- Server actions handle database operations (add, delete, import CSV)
- Use "use server" directive for Next.js server-side execution
- Example: `addEnergyAction()`, `importCSVAction()` in `src/actions/energy.ts`

**Components** (`src/app/components/`):

- Organized by feature: `add/`, `contracts/`, `energy/`, `modals/`
- All components are client-side ("use client") React components
- Tests co-located in `__tests__/` subdirectories
- Components should focus on presentation and delegate logic to hooks/services

**Custom Hooks** (`src/app/hooks/`):

- `useEnergyData` - Energy data fetching with loading/error states
- `useToast` - Toast notification management
- `useTableSort` - Generic table sorting logic
- `useAuthRedirect` - Authentication check and redirect
- `useConfirmationModal` - Confirmation dialog state management

**Services** (`src/app/services/`):

- `ContractValidationService` - Contract validation logic (prices, dates, overlaps)
- `EnergyValidationService` - Energy reading validation
- Services follow SRP and are easily testable in isolation

**Constants** (`src/app/constants/`):

- `energyTypes.ts` - Energy type configurations (colors, labels, icons)
- `ui.ts` - UI constants (pagination, timeouts, styles)
- Single source of truth for configuration values

**Utilities** (`src/app/utils/`):

- `iconUtils.tsx` - Shared icon rendering logic
- `errorHandling.ts` - Standardized error handling utilities
- `dateUtils.ts` - Date formatting and parsing
- `csvUtils.ts` - CSV parsing logic

**Business Logic Handlers** (`src/app/handlers/`):

- `timeSeries.ts` - Converts energy data to TimeSeries objects using Pond library
- `chartData.ts` - Prepares data for Chart.js visualization
- `energyHandlers.ts` - Filtering, sorting, pagination logic
- `contractsHandler.ts` - Contract-related business logic
- `interpolation.ts` - Data interpolation for time series

### Time Series Data

The app uses the **Pond library** (type definitions in `src/lib/pond/`) for time series operations:

- Raw energy readings converted to TimeSeries objects
- `differences()` function calculates consumption between readings
- Supports aggregation, interpolation, and windowing operations

### Feature Flags

- Runtime feature toggles stored in MongoDB (FeatureFlag model)
- Check via `isFeatureEnabled(featureName)` from `src/lib/featureFlags.ts`
- Server-side only ("use server")

### Styling

- Tailwind CSS 4 with PostCSS
- Global styles in `src/app/layout/main.css`
- Geist font family (sans & mono) loaded via `next/font`
- **Font Awesome 6.5.1** for action icons (installed via `@fortawesome/fontawesome-free`)
  - Used for action icons: edit, delete, add, menu
  - NOT used for visual card icons (power, gas, etc.) - those remain custom SVGs
  - Imported in `src/app/layout/main.css`

## Environment Variables

Required:
- `MONGODB_URI` - MongoDB connection string (database name: "energy_consumption")
- NextAuth configuration (see NextAuth docs)

## Docker

Multi-stage Dockerfile provided:
- Builder stage: installs deps and builds Next.js app
- Production stage: runs optimized build with health check on `/api/health`
- Exposes port 3000

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `ci.yaml` - Main pipeline (triggered on tags): build → test → deploy
- Uses reusable workflows for Node build, Docker test, Docker push
- Pushes Docker image to `dachrisch/energy.consumption`

## Type System

Central types in `src/app/types.ts`:
- `EnergyBase` / `EnergyType` - Energy readings
- `ContractBase` / `ContractType` - Energy contracts
- `UserSpecific` - Base type for user-scoped data (includes `userId`)
- `EnergyOptions` - "power" | "gas"
- `EnergyTimeSeries` - Record mapping energy types to TimeSeries

## Key Patterns

1. **Server Actions**: Use "use server" for database operations, call from client components
2. **User Data Isolation**: Always apply `applyPreFilter()` to user-specific schemas
3. **Type Safety**: Mongoose models typed with TypeScript interfaces from `types.ts`
4. **Component Testing**: Co-locate tests in `__tests__/` subdirectories
5. **CSV Import**: Handles duplicate detection by date+type, returns success/skipped/error counts
6. **Custom Hooks**: Extract stateful logic into reusable hooks (see `src/app/hooks/`)
7. **Validation Services**: Use service classes for validation logic (see `src/app/services/`)
8. **Constants**: Use shared constants from `src/app/constants/` - never hardcode values
9. **Utilities**: Shared utilities in `src/app/utils/` - DRY principle
10. **Error Handling**: Use `ApplicationError` and `Result<T>` types for consistent error handling

## Code Organization Principles (SOLID)

This codebase follows SOLID principles and clean code practices:

**Single Responsibility Principle (SRP)**:
- Components focus on presentation only
- Business logic extracted to services and hooks
- Validation logic in dedicated service classes

**Open/Closed Principle (OCP)**:
- Energy types configured in `ENERGY_TYPE_CONFIG` - easy to extend
- New energy types can be added without modifying existing code
- Configuration-driven chart colors and labels

**Dependency Inversion Principle (DIP)**:
- Components depend on hooks and services, not direct implementations
- Validation services provide abstractions over business rules

**Don't Repeat Yourself (DRY)**:
- Shared constants for UI values, timeouts, pagination
- Reusable hooks for common patterns (sorting, modals, data fetching)
- Centralized icon rendering via `getTypeIcon()`

## Adding New Features

**To add a new energy type** (e.g., "water"):
1. Add to `ENERGY_TYPES` in `src/app/constants/energyTypes.ts`
2. Add configuration to `ENERGY_TYPE_CONFIG` (colors, label)
3. Add icon to `getTypeIcon()` in `src/app/utils/iconUtils.tsx`
4. Update database schema enum in `src/models/Energy.ts` and `Contract.ts`

**To add a new validation rule**:
1. Add method to appropriate service in `src/app/services/validationService.ts`
2. Return `ValidationResult` type
3. Use in component via the service

**To add a new custom hook**:
1. Create in `src/app/hooks/`
2. Follow naming convention: `use[FeatureName].ts`
3. Return object with state and handlers
4. Document with JSDoc comments
- add to memory: always ensure all tests are running when changing code