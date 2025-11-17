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

### Timeline Slider Components (V3)

**Location**: `src/app/components/energy/RangeSlider/`

The timeline slider provides an interactive way to select date ranges with visual feedback showing measurement distribution over time.

**Main Components**:
- `RangeSlider.tsx` - Main orchestrator component, coordinates all sub-components
- `SliderVisualization.tsx` - SVG-based histogram showing measurement distribution
- `SliderTrack.tsx` - Slider track with selected range highlighting
- `SliderHandle.tsx` - Draggable handles with mouse, touch, and keyboard support
- `DateRangeDisplay.tsx` - Responsive date labels (full format on desktop, short on mobile)

**Custom Hooks**:
- `useHistogramData.ts` - Memoized data aggregation into buckets
- `useSliderDrag.ts` - Mouse/touch drag interactions with 60fps performance
- `useSliderKeyboard.ts` - Keyboard navigation (arrows, page up/down, home/end)
- `useSliderAnimation.ts` - Smooth preset button animations (300ms transitions)

**Services** (in `src/app/services/`):
- `DataAggregationService.ts` - Pure functions for bucketing measurements into time intervals
- `SliderCalculationService.ts` - Date ↔ Position calculations, clamping, and validation

**Design Decisions**:
- **Single color histogram**: User requirement "measurements in general is enough" (no separate Power/Gas colors)
- **Mobile-first**: Touch-optimized with 44x44px touch targets, responsive breakpoints
- **Performance**: Memoization, throttling (60fps drag), debouncing (200ms filter update)
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation and ARIA labels
- **Custom implementation**: Built from scratch (no library) for tight integration and performance control

**Usage Example**:
```typescript
import RangeSlider from '@/app/components/energy/RangeSlider';

<RangeSlider
  data={energyData}
  dateRange={{ start, end }}
  onDateRangeChange={(range) => setDateRange(range)}
  minDate={minDate}
  maxDate={maxDate}
/>
```

**Integration**:
- Used in `EnergyTableFilters` component
- Replaces react-datepicker for date range selection
- Synchronized with preset buttons (Last 7/30/90 days, This month/year, All time)
- Preset buttons animate slider handles to preset positions

### Monthly Charts Components

**Location**: `/src/app/charts/page.tsx` and `/src/app/components/energy/MonthlyMeterReadingsChart.tsx`

The monthly charts feature provides visualization of end-of-month meter readings with clear distinction between actual measurements, interpolated values, and extrapolated estimates. **Enhanced with dual y-axis visualization** to show both cumulative meter readings and monthly consumption in a unified chart.

**Service** (`src/app/services/`):
- `MonthlyDataAggregationService.ts` - Pure functions for calculating end-of-month readings and consumption
  - `calculateMonthlyReadings()` - Main aggregation function (returns 12 monthly data points)
  - `calculateMonthlyConsumption()` - **[NEW]** Calculates monthly consumption from meter readings
  - `findNearestReading()` - Finds actual reading within 3-day tolerance
  - `interpolateValue()` - Linear interpolation between two readings
  - `extrapolateValue()` - Extrapolation using trend from two readings
  - `getMonthEndDate()` - Month-end date calculation (handles leap years)

**Component**:
- `MonthlyMeterReadingsChart.tsx` - Renders two separate **dual-axis charts** (Power and Gas)
  - **Dual Y-Axes**: Left axis (meter readings), Right axis (monthly consumption)
  - **Mixed Chart Types**: Line chart (meter readings) + Bar chart (consumption)
  - Year navigation UI (prev/next buttons, dropdown)
  - Data quality indicators (actual, interpolated, extrapolated, derived)
  - Mobile-responsive with clamp(300px, 50vh, 500px) chart height
  - Custom legend showing line patterns and point styles
  - Enhanced tooltips showing both meter reading and consumption values

**Data Quality Indicators**:
- **Meter Readings** (Line Chart):
  - **Actual**: Solid line, filled circle point
  - **Interpolated**: Dashed line (5-5 pattern), hollow circle point
  - **Extrapolated**: Longer dashed line (10-5 pattern), hollow circle point
- **Consumption** (Bar Chart):
  - **Actual**: Solid border (both meter readings actual)
  - **Derived**: Dashed border (one or both readings interpolated/extrapolated)
  - Semi-transparent bars (70% opacity) to avoid obscuring line chart
  - Colors: Power (teal `rgba(124, 245, 220, 0.7)`), Gas (pink `rgba(255, 159, 128, 0.7)`)

**Dual-Axis Configuration**:
- **Left Y-Axis (`y-left`)**: Meter readings in kWh/m³, beginAtZero: false, grid visible
- **Right Y-Axis (`y-right`)**: Monthly consumption in kWh/m³, beginAtZero: true, grid hidden
- Both axes auto-scale independently
- Axis titles hidden on mobile (≤768px) to save space
- Bar chart renders behind line chart (order property controls layering)

**Consumption Calculation**:
- **Formula**: `Consumption = Current Month Reading - Previous Month Reading`
- **First month (January)**: Consumption = null (no previous reading)
- **Null readings**: Consumption = null for affected months
- **Negative values**: Allowed (indicates meter reset), logged as warning
- **Data quality**: Consumption marked as "derived" if either endpoint is not actual

**Enhanced Tooltips**:
```
February 2024
Meter Reading: 1,234 kWh (Actual)
Consumption: 156 kWh
```
- Shows both meter reading and consumption values
- Displays data quality indicators for both datasets
- Graceful handling of null values (first month or gaps)
- Custom title shows month label and year

**Algorithm**:
1. For each month, check for actual reading within 3-day tolerance of month end
2. If no actual reading, try interpolation (requires readings before and after)
3. If interpolation not possible, try extrapolation (requires 2 readings on one side)
4. If no calculation possible, return null (gap in chart)
5. **[NEW]** Calculate consumption as difference between current and previous month
6. **[NEW]** Determine consumption quality based on source reading quality

**Usage Example**:
```typescript
import MonthlyMeterReadingsChart from '@/app/components/energy/MonthlyMeterReadingsChart';

<MonthlyMeterReadingsChart
  energyData={allEnergyReadings}
  selectedYear={2024}
  onYearChange={setYear}
  availableYears={[2024, 2023, 2022]}
/>
```

**Design Decisions**:
- **Dual-axis charts**: Shows both meter state (line) and consumption (bars) in unified view
- **Separate charts**: Power and Gas in separate charts with independent Y-axis scales
- **Month-end focus**: Shows meter state at end of each month
- **3-day tolerance**: Readings within 3 days of month end considered "actual"
- **Linear interpolation**: Simple, predictable, and sufficient for meter readings
- **Chart.js mixed type**: Leverages Chart.js v4 dual-axis and mixed chart support
- **Chart.js segment API**: Dynamic line styling based on data quality
- **Mobile-first**: Responsive font sizes, touch-friendly year navigation, axis titles hidden on mobile

**Integration**:
- `/charts` page - Dedicated route for monthly visualization
- Replaces old monthly view in UnifiedEnergyChart
- Uses existing ENERGY_TYPE_CONFIG for colors and labels
- No new dependencies (Chart.js, date-fns already in project)

**Performance**:
- Consumption calculation: O(12) = O(1) constant time
- All calculations memoized with useMemo
- Expected execution time: <5ms per chart
- No performance impact on existing functionality

### Backend Repository & Service Layer (Event-Based Architecture)

**Location**: Repositories in `/src/repositories/`, Services in `/src/services/`, Events in `/src/events/`

The application uses a modern **event-driven architecture** with repository pattern and service layer following the backend-first migration strategy. This architecture enables automatic display data recalculation when source data changes.

#### Architecture Overview

**Data Flow:**
```
Frontend → Server Actions → Service Layer → Repository Layer → Database
                              ↓ (emit events)
                           Event Bus
                              ↓ (handlers)
                      Display Data Invalidation
```

**Three-Layer Architecture:**
1. **Repository Layer** - Data access abstraction (MongoDB)
2. **Service Layer** - Business logic + event emission
3. **Event System** - Automatic cache invalidation

#### Data Models

**Source Data (Single Source of Truth):**
- `SourceEnergyReading` (model in `src/models/SourceEnergyReading.ts`)
  - Raw meter readings: type, amount, date, userId
  - Indexed: {userId, date}, {userId, type, date}
  - Protected by sessionFilter middleware (user isolation)

**Display Data (Pre-Calculated Cache):**
- `DisplayEnergyData` (model in `src/models/DisplayEnergyData.ts`)
  - Pre-calculated aggregations for charts/tables
  - Display types: monthly-chart-power, monthly-chart-gas, histogram-power, histogram-gas, table-data
  - Includes sourceDataHash for cache validation
  - Unique constraint: {userId, displayType}

#### Repository Pattern

**Interfaces** (`src/repositories/interfaces/`):
- `IEnergyRepository` - Energy data CRUD operations (11 methods)
- `IDisplayDataRepository` - Display data cache operations (6 methods)

**Implementations** (`src/repositories/mongodb/`):
- `MongoEnergyRepository` - MongoDB implementation for energy data
- `MongoDisplayDataRepository` - MongoDB implementation for display data

**Key Features:**
- User data isolation enforced at every query (userId always in filters)
- Dependency injection via interfaces (testable, swappable)
- 98.27% test coverage

**Usage Example:**
```typescript
import { MongoEnergyRepository } from '@/repositories/mongodb/MongoEnergyRepository';

const repository = new MongoEnergyRepository();
const readings = await repository.findAll(userId, {
  type: 'power',
  dateRange: { start, end }
});
```

#### Event System

**Event Bus** (`src/events/EventBus.ts`):
- In-memory publish/subscribe pattern
- Synchronous event processing (FIFO order)
- Error isolation (one handler failure doesn't stop others)
- 100% test coverage

**Event Types** (`src/events/types/EnergyEvents.ts`):
- `ENERGY_READING_CREATED` - Single reading created
- `ENERGY_READING_UPDATED` - Reading modified
- `ENERGY_READING_DELETED` - Reading removed
- `ENERGY_READINGS_BULK_IMPORTED` - Multiple readings imported (bulk)

**Event Factory** (`src/events/factories/EnergyEventFactory.ts`):
- Type-safe event creation
- Automatic eventId generation (UUID)
- Automatic timestamp generation
- Optional metadata support

**Usage Example:**
```typescript
import { getEventBus, EnergyEventFactory, EnergyEventTypes } from '@/events';

// Get singleton EventBus
const eventBus = getEventBus();

// Register handler
eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  console.log('New reading:', event.data);
  // Invalidate cache, send notifications, etc.
});

// Emit event
const event = EnergyEventFactory.createCreatedEvent(reading);
await eventBus.emit(event);
```

#### Service Layer

**Energy CRUD Service** (`src/services/energy/EnergyCrudService.ts`):
- Wraps IEnergyRepository with event emission
- CRUD operations: create, createMany, update, delete, deleteMany
- Read operations: findById, findAll, findByDateRange, count, getMinMaxDates
- Emits events AFTER successful database operations
- 100% test coverage

**Display Data Calculation Service** (`src/services/display/DisplayDataCalculationService.ts`):
- Calculates and caches pre-computed display data
- Methods: calculateMonthlyChartData, calculateHistogramData, invalidateAllForUser
- Uses existing MonthlyDataAggregationService and DataAggregationService
- Generates SHA256 hash for cache validation
- Tracks metadata (source count, calculation time)
- 100% test coverage

**Display Data Event Handler** (`src/services/handlers/DisplayDataEventHandler.ts`):
- Connects energy events to display data invalidation
- Automatically invalidates cache on any source data change
- Registers handlers for all energy event types
- Simple invalidation strategy for Phase 1 (invalidate all on any change)

**Service Factory** (`src/services/serviceFactory.ts`):
- Singleton pattern for service instances
- Lazy initialization
- Proper dependency injection
- Testing-friendly (resetServices() for clean state)

**Usage Example:**
```typescript
import { getEnergyCrudService } from '@/services';

const service = getEnergyCrudService();

// Create reading (automatically emits CREATED event)
const reading = await service.create({
  userId: 'user123',
  type: 'power',
  amount: 150.5,
  date: new Date(),
});

// Event → Handler → Display data invalidated automatically
```

#### Integration with Existing Code

**Current Status (Phase 1 Complete):**
- ✅ Backend infrastructure fully implemented
- ✅ 731 tests, 98-100% coverage
- ✅ Zero frontend changes (backward compatible)
- ⏳ NOT YET INTEGRATED with existing server actions/API routes

**Next Phase (Phase 2 - Not Yet Implemented):**
- Create adapter layer hooks (useEnergyService, useDisplayData)
- Update server actions to use services instead of direct Mongoose calls
- Gradually migrate frontend components with feature flags
- Enable display data caching in production

**For Now:**
- Existing code still uses direct Mongoose models (Energy, Contract)
- New backend runs in parallel (not yet connected to frontend)
- Zero user impact during Phase 1

#### Key Patterns

**1. Repository Pattern:**
- Abstracts data access behind interfaces
- Enables database migration (MongoDB → PostgreSQL possible)
- Makes testing easier (mock repositories)

**2. Event-Driven Architecture:**
- Loose coupling between components
- Automatic display data invalidation
- Easy to add new event handlers (webhooks, notifications, analytics)

**3. Service Layer:**
- Encapsulates business logic
- Coordinates repositories and events
- Single responsibility (CRUD vs Calculation)

**4. SOLID Principles:**
- Single Responsibility: Each class has one reason to change
- Open/Closed: Extend via events without modifying existing code
- Liskov Substitution: Implementations satisfy interfaces
- Interface Segregation: Focused interfaces (IEnergyRepository, IDisplayDataRepository)
- Dependency Inversion: Depend on abstractions (interfaces), not concrete classes

**5. User Data Isolation:**
- Double protection: Repository methods + Mongoose middleware
- Every query filters by userId
- No cross-user data leaks (verified in 731 tests)

#### Testing Strategy

**Test-First Development:**
- Tests written BEFORE implementation (TDD)
- 731 comprehensive tests
- 98-100% code coverage

**Test Organization:**
- `src/repositories/__tests__/` - Repository tests (62 tests)
- `src/events/__tests__/` - Event system tests (68 tests)
- `src/services/__tests__/` - Service layer tests (99 tests)
- Integration tests verify end-to-end flow (create → event → invalidation)

**Running Tests:**
```bash
# All backend tests
npm test -- src/{repositories,events,services}

# Specific layer
npm test -- src/repositories
npm test -- src/events
npm test -- src/services

# With coverage
npm test -- --coverage --collectCoverageFrom='src/{repositories,events,services}/**/*.ts'
```

#### Documentation

**Architecture Docs:**
- `docs/architecture/event-based-repository-design.md` - Complete architecture design
- `docs/architecture/backend-first-migration-strategy.md` - Migration strategy
- `docs/architecture/GETTING-STARTED.md` - Day-by-day implementation guide
- `src/events/README.md` - Event system documentation
- `src/repositories/README.md` - Repository pattern documentation
- `src/services/README.md` - Service layer documentation

#### Future Enhancements (Post-Phase 1)

**Phase 2 - Frontend Integration:**
- Create adapter layer hooks
- Update server actions to use services
- Migrate components incrementally with feature flags

**Phase 3 - Optimization:**
- Smart invalidation (only invalidate affected display data)
- Event persistence for audit trail
- Performance monitoring and metrics
- Caching strategy refinement

**Phase 4 - Advanced Features:**
- Webhook support via event system
- Real-time updates via WebSockets
- Analytics event handlers
- Notification system

**Custom Hooks** (`src/app/hooks/`):

- `useEnergyData` - Energy data fetching with loading/error states
- `useToast` - Toast notification management
- `useTableSort` - Generic table sorting logic
- `useAuthRedirect` - Authentication check and redirect
- `useConfirmationModal` - Confirmation dialog state management

**Timeline Slider Hooks** (`src/app/components/energy/RangeSlider/hooks/`):
- `useHistogramData` - Memoized data aggregation for histogram visualization
- `useSliderDrag` - Mouse and touch drag interaction management
- `useSliderKeyboard` - Keyboard navigation and shortcuts
- `useSliderAnimation` - Smooth transitions for preset selections

**Services** (`src/app/services/`):

- `ContractValidationService` - Contract validation logic (prices, dates, overlaps)
- `EnergyValidationService` - Energy reading validation
- `DataAggregationService` - Time series data bucketing for histogram visualization
- `SliderCalculationService` - Date-position calculations for range slider
- `MonthlyDataAggregationService` - Monthly meter reading calculations with interpolation/extrapolation
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
- Exposes port 3100

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
- `MonthlyDataPoint` - End-of-month meter reading with quality indicators
- `MonthlyConsumptionPoint` - Monthly consumption calculated from meter readings (month, consumption, isActual, isDerived, sourceReadings)

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

## Development Workflow

**IMPORTANT**: Follow this complete workflow when implementing features or making changes:

### 1. Planning
- Use `TodoWrite` tool for complex/multi-step tasks
- Break down features into manageable steps
- Track progress with in_progress/completed status

### 2. Implementation
- **Read existing files first** - Never edit without reading
- Check CLAUDE.md for project patterns
- Use proper tools (Read/Edit/Write, not bash for file operations)
- Follow SOLID principles
- Extract logic to services/handlers/hooks (not in components)
- Use constants from `src/app/constants/` - no hardcoded values
- Components focus on presentation only
- **Always add/update TypeScript types in `src/app/types.ts`**
- **Always consider mobile responsiveness (mobile-first approach)**

### 3. Testing - CRITICAL
- **Always ensure all tests are running when changing code**
- Run `npm test` after making changes
- Fix broken tests immediately
- **Write tests for NEW features proactively** (not just fix broken ones)
- Co-locate tests in `__tests__/` subdirectories
- Follow existing patterns (Jest + React Testing Library)
- Ensure all tests pass before committing

### 4. Error Handling
- Fix errors automatically as they appear
- Fix test failures, linting errors, and runtime errors without asking
- No permission needed to fix errors during development

### 5. Documentation
- **Update CLAUDE.md when adding:**
  - New patterns or architectural decisions
  - New features that change project structure
  - New dependencies or tools
  - New conventions or best practices

### 6. Commit
- Use conventional commit format (`feat:`, `fix:`, `refactor:`, `test:`)
- Write detailed commit messages with context
- Include `Co-Authored-By: Claude <noreply@anthropic.com>`
- Include Claude Code link: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

### Complete Feature Checklist
When adding a new feature:
- Always check if you have an agent fit for the users request
