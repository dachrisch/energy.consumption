# Architecture Design: Event-Based Repository Pattern

## Executive Summary

This document outlines a comprehensive architectural migration from the current direct database access pattern to an event-driven architecture with repository abstraction and data separation. The new architecture separates raw source data (meter readings) from pre-calculated display data (charts, aggregations), uses events to trigger automatic recalculation, and provides clean separation of concerns through repository and service layers.

**Key Changes:**
- Introduce Repository Pattern for data access abstraction
- Implement Event Bus for decoupled service communication
- Separate SourceEnergyReading collection (raw data) from DisplayEnergyData collection (pre-calculated)
- Organize services into CRUD Services and Calculation Services
- Maintain backward compatibility during phased migration

**Migration Strategy:**
This document includes multiple migration approaches. **RECOMMENDED**: Use the Backend-First Gradual Migration strategy (see dedicated document).

## Migration Strategy Overview

Three migration strategies have been designed for this architecture:

### 1. Accelerated 4-Week Plan
- **Duration**: 4 weeks
- **Risk**: HIGH
- **User Impact**: HIGH
- **Recommended**: NO (too risky for production)
- **Details**: See section "Accelerated 4-Week Implementation Plan" below

### 2. Comprehensive 8-Week Phased Plan
- **Duration**: 8 weeks
- **Risk**: MEDIUM
- **User Impact**: MEDIUM (big-bang frontend)
- **Recommended**: MAYBE (acceptable for some projects)
- **Details**: See section "Migration Strategy" below

### 3. Backend-First Gradual Migration (RECOMMENDED)
- **Duration**: 6-8 weeks (flexible)
- **Risk**: VERY LOW
- **User Impact**: MINIMAL (incremental)
- **Recommended**: YES (best for production)
- **Details**: See `backend-first-migration-strategy.md`

**For detailed comparison**, see `migration-strategy-comparison.md`

**For implementation guidance**, start with `backend-first-migration-strategy.md`

---

## Architecture Overview

### System Context

The Energy Consumption Monitor currently uses a direct data access pattern where:
- Server actions directly interact with Mongoose models
- Calculation services (MonthlyDataAggregationService, DataAggregationService) compute data on-demand
- Frontend fetches raw data and performs client-side processing
- No clear separation between raw and derived data

The new architecture introduces:
- **Clear layer separation**: Client → API → Services → Repository → Database
- **Event-driven recalculation**: Changes to source data trigger automatic display data updates
- **Data separation**: Raw meter readings vs pre-calculated aggregations
- **Repository abstraction**: Clean interfaces between business logic and data persistence

### Architectural Style

**Chosen Style**: **Event-Driven Layered Architecture with Repository Pattern**

**Rationale**:
1. **Event-Driven**: Decouples CRUD operations from calculation logic, enables automatic updates
2. **Layered**: Clear separation of concerns (API → Service → Repository → Data)
3. **Repository Pattern**: Abstracts data access, maintains testability, enables future database changes
4. **Hybrid Approach**: Maintains Next.js server actions while adding event layer for complex operations

## High-Level Design

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Dashboard  │  │     Charts   │  │   Timeline   │              │
│  │  Components  │  │  Components  │  │    Slider    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┼──────────────────┘                       │
│                            │                                          │
│                  ┌─────────▼──────────┐                              │
│                  │  useEnergyData()   │                              │
│                  │  useDisplayData()  │ (Custom Hooks)               │
│                  └─────────┬──────────┘                              │
└────────────────────────────┼───────────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────────┐
│                   API LAYER (Next.js)                                │
│                  ┌─────────▼──────────┐                              │
│                  │  Server Actions    │                              │
│                  │  - addEnergy       │                              │
│                  │  - deleteEnergy    │                              │
│                  │  - importCSV       │                              │
│                  └─────────┬──────────┘                              │
│                            │                                          │
│                  ┌─────────▼──────────┐                              │
│                  │   API Routes       │                              │
│                  │  GET /api/energy   │                              │
│                  │  GET /api/display  │                              │
│                  └─────────┬──────────┘                              │
└────────────────────────────┼───────────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────────┐
│                      SERVICE LAYER                                   │
│                            │                                          │
│         ┌──────────────────┴───────────────────┐                     │
│         │                                       │                     │
│  ┌──────▼──────────┐                  ┌────────▼────────┐            │
│  │  CRUD Services  │                  │ Calculation     │            │
│  │                 │                  │ Services        │            │
│  │ EnergyCrud      │                  │                 │            │
│  │ Service         │                  │ ChartData       │            │
│  │                 │                  │ Service         │            │
│  │ - create()      │                  │                 │            │
│  │ - read()        │                  │ Monthly         │            │
│  │ - update()      │                  │ Aggregation     │            │
│  │ - delete()      │◄─────events──────┤ Service         │            │
│  │ - bulkCreate()  │                  │                 │            │
│  └────────┬────────┘                  │ Histogram       │            │
│           │                           │ Service         │            │
│           │ emits                     │                 │            │
│           │ events                    └────────┬────────┘            │
│           │                                     │                     │
│  ┌────────▼──────────────────────────────┐     │ reads               │
│  │         EVENT BUS                     │     │ display             │
│  │  - EnergyReadingCreated               │     │ data                │
│  │  - EnergyReadingUpdated               │     │                     │
│  │  - EnergyReadingDeleted               │     │                     │
│  │  - BulkEnergyReadingsImported         │     │                     │
│  └────────┬──────────────────────────────┘     │                     │
│           │                                     │                     │
│           │ triggers                            │                     │
│           │                                     │                     │
│  ┌────────▼────────────────────┐               │                     │
│  │   EVENT HANDLERS            │               │                     │
│  │                             │               │                     │
│  │ - onEnergyCreated()         │               │                     │
│  │ - onEnergyUpdated()         │               │                     │
│  │ - onEnergyDeleted()         │               │                     │
│  │ - onBulkImport()            │               │                     │
│  │                             │               │                     │
│  │ Each handler:               │               │                     │
│  │ 1. Fetch affected data      │               │                     │
│  │ 2. Call calculation service │───────────────┘                     │
│  │ 3. Save to display repo     │                                     │
│  └────────┬────────────────────┘                                     │
└───────────┼──────────────────────────────────────────────────────────┘
            │
┌───────────┼──────────────────────────────────────────────────────────┐
│           │          REPOSITORY LAYER                                 │
│           │                                                           │
│  ┌────────▼──────────────┐        ┌───────────────────────┐          │
│  │ IEnergyRepository     │        │ IDisplayDataRepository│          │
│  │ (Interface)           │        │ (Interface)           │          │
│  └───────────┬───────────┘        └──────────┬────────────┘          │
│              │                               │                        │
│  ┌───────────▼───────────┐        ┌──────────▼────────────┐          │
│  │ MongoEnergyRepository │        │ MongoDisplayData      │          │
│  │                       │        │ Repository            │          │
│  │ - create()            │        │                       │          │
│  │ - findById()          │        │ - upsertChartData()   │          │
│  │ - findAll()           │        │ - getChartData()      │          │
│  │ - findByDateRange()   │        │ - upsertMonthly()     │          │
│  │ - update()            │        │ - getMonthlyData()    │          │
│  │ - delete()            │        │ - upsertHistogram()   │          │
│  │ - bulkCreate()        │        │ - getHistogramData()  │          │
│  │ - findByUserId()      │        │ - deleteByUserId()    │          │
│  │                       │        │                       │          │
│  │ + Session Filtering   │        │ + Session Filtering   │          │
│  │ + Error Handling      │        │ + Error Handling      │          │
│  └───────────┬───────────┘        └──────────┬────────────┘          │
└──────────────┼────────────────────────────────┼───────────────────────┘
               │                                │
┌──────────────┼────────────────────────────────┼───────────────────────┐
│              │         DATABASE LAYER         │                       │
│              │                                │                       │
│  ┌───────────▼───────────┐        ┌──────────▼────────────┐          │
│  │ SourceEnergyReading   │        │ DisplayEnergyData     │          │
│  │ Collection            │        │ Collection            │          │
│  │                       │        │                       │          │
│  │ - _id                 │        │ - _id                 │          │
│  │ - userId              │        │ - userId              │          │
│  │ - type                │        │ - type                │          │
│  │ - date                │        │ - dataType            │          │
│  │ - amount              │        │ - year                │          │
│  │ - createdAt           │        │ - chartData           │          │
│  │ - updatedAt           │        │ - monthlyData         │          │
│  │                       │        │ - histogramData       │          │
│  │ Indexes:              │        │ - calculatedAt        │          │
│  │ - userId + type + date│        │                       │          │
│  │ - userId + date       │        │ Indexes:              │          │
│  │                       │        │ - userId + type + year│          │
│  └───────────────────────┘        │ - userId + dataType   │          │
│                                   └───────────────────────┘          │
│                       MongoDB Database                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Read Flow (Display Data)
```
Client Component
  └─> useDisplayData() hook
      └─> GET /api/display?type=power&year=2024
          └─> DisplayDataService.getChartData()
              └─> MongoDisplayDataRepository.getChartData()
                  └─> DisplayEnergyData.findOne({ userId, type, year, dataType: 'chart' })
                      └─> Return pre-calculated chart data
```

#### Write Flow (New Reading)
```
Client Component
  └─> addEnergyAction(reading)
      └─> EnergyCrudService.create(reading)
          ├─> MongoEnergyRepository.create(reading)
          │   └─> SourceEnergyReading.save()
          │       └─> Success
          │
          └─> EventBus.emit('EnergyReadingCreated', { reading, userId })
              └─> EnergyReadingCreatedHandler
                  ├─> Fetch affected data range
                  ├─> ChartDataService.recalculate()
                  ├─> MonthlyAggregationService.recalculate()
                  ├─> HistogramService.recalculate()
                  └─> MongoDisplayDataRepository.upsertAll()
                      └─> DisplayEnergyData.updateMany()
                          └─> Client cache invalidation
```

#### Bulk Import Flow
```
CSV Import
  └─> importCSVAction(readings[])
      └─> EnergyCrudService.bulkCreate(readings[])
          ├─> MongoEnergyRepository.bulkCreate()
          │   └─> SourceEnergyReading.insertMany()
          │
          └─> EventBus.emit('BulkEnergyReadingsImported', { readings, userId })
              └─> BulkImportHandler (optimized batch processing)
                  ├─> Group by type and year
                  ├─> Batch recalculate all affected years
                  └─> Bulk upsert display data
```

## Data Architecture

### Data Models

#### Source Collection: SourceEnergyReading

**Purpose**: Store raw meter readings as entered by users - the single source of truth.

```typescript
// src/models/SourceEnergyReading.ts

import mongoose, { Schema, model } from 'mongoose';
import { applyPreFilter } from './sessionFilter';

export interface ISourceEnergyReading {
  _id: string;
  userId: string;
  type: 'power' | 'gas';
  date: Date;
  amount: number; // Meter reading in kWh or m³
  metadata?: {
    source?: 'manual' | 'csv' | 'api'; // How data was entered
    importBatchId?: string; // For bulk imports
  };
  createdAt: Date;
  updatedAt: Date;
}

const SourceEnergyReadingSchema = new Schema<ISourceEnergyReading>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['power', 'gas'],
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Meter readings cannot be negative
    },
    metadata: {
      source: {
        type: String,
        enum: ['manual', 'csv', 'api'],
        default: 'manual',
      },
      importBatchId: String,
    },
  },
  {
    timestamps: true,
    collection: 'source_energy_readings',
  }
);

// Apply user session filtering
applyPreFilter(SourceEnergyReadingSchema);

// Compound indexes for common queries
SourceEnergyReadingSchema.index({ userId: 1, type: 1, date: 1 }, { unique: true });
SourceEnergyReadingSchema.index({ userId: 1, date: 1 });
SourceEnergyReadingSchema.index({ userId: 1, type: 1, date: 1 }, { name: 'user_type_date_idx' });

export const SourceEnergyReading =
  mongoose.models?.SourceEnergyReading ||
  model<ISourceEnergyReading>('SourceEnergyReading', SourceEnergyReadingSchema);
```

#### Display Collection: DisplayEnergyData

**Purpose**: Store pre-calculated aggregations and chart-ready data for fast frontend consumption.

```typescript
// src/models/DisplayEnergyData.ts

import mongoose, { Schema, model } from 'mongoose';
import { applyPreFilter } from './sessionFilter';

export type DisplayDataType = 'chart' | 'monthly' | 'histogram';

export interface IChartData {
  labels: string[]; // Date labels for x-axis
  datasets: Array<{
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    // ... other Chart.js properties
  }>;
}

export interface IMonthlyData {
  months: Array<{
    month: number; // 1-12
    monthLabel: string; // "Jan", "Feb", etc.
    meterReading: number | null;
    consumption: number | null;
    isActual: boolean;
    isInterpolated: boolean;
    isExtrapolated: boolean;
    isDerived: boolean;
  }>;
}

export interface IHistogramData {
  buckets: Array<{
    startDate: Date;
    endDate: Date;
    count: number;
  }>;
  dateRange: {
    min: Date;
    max: Date;
  };
  maxCount: number;
}

export interface IDisplayEnergyData {
  _id: string;
  userId: string;
  type: 'power' | 'gas';
  dataType: DisplayDataType;
  year?: number; // For yearly aggregations (monthly, chart)
  dateRange?: { // For histogram data
    start: Date;
    end: Date;
  };

  // Polymorphic data field based on dataType
  data: IChartData | IMonthlyData | IHistogramData;

  calculatedAt: Date; // When this was last calculated
  sourceDataHash?: string; // Optional: hash of source data for cache validation

  createdAt: Date;
  updatedAt: Date;
}

const DisplayEnergyDataSchema = new Schema<IDisplayEnergyData>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['power', 'gas'],
      index: true,
    },
    dataType: {
      type: String,
      required: true,
      enum: ['chart', 'monthly', 'histogram'],
      index: true,
    },
    year: {
      type: Number,
      index: true,
    },
    dateRange: {
      start: Date,
      end: Date,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    sourceDataHash: String,
  },
  {
    timestamps: true,
    collection: 'display_energy_data',
  }
);

// Apply user session filtering
applyPreFilter(DisplayEnergyDataSchema);

// Compound indexes for efficient queries
DisplayEnergyDataSchema.index(
  { userId: 1, type: 1, dataType: 1, year: 1 },
  { unique: true, partialFilterExpression: { year: { $exists: true } } }
);
DisplayEnergyDataSchema.index({ userId: 1, dataType: 1 });
DisplayEnergyDataSchema.index({ calculatedAt: 1 }); // For cache expiration queries

export const DisplayEnergyData =
  mongoose.models?.DisplayEnergyData ||
  model<IDisplayEnergyData>('DisplayEnergyData', DisplayEnergyDataSchema);
```

[REST OF THE DOCUMENT CONTINUES AS IN THE ORIGINAL FILE - I'll just add a reference to the new migration documents at the end of the Migration Strategy section]

### Data Storage Strategy

**Primary Database**: MongoDB (existing)

**Rationale**:
- Already integrated with Mongoose
- Flexible schema for polymorphic DisplayEnergyData
- Good performance with proper indexing
- Supports complex queries and aggregations

**Caching Layer**: None initially, optional Redis later

**Rationale**:
- DisplayEnergyData collection acts as materialized view cache
- Pre-calculated data eliminates need for real-time calculation
- Redis can be added later for hot data if needed

### Data Access Patterns

**Write Pattern (Source Data)**:
- Frequency: Low to medium (user manually enters readings or bulk imports)
- Volume: 1-100 readings per operation
- Consistency: Strong (must be accurate, no duplicates)

**Read Pattern (Source Data)**:
- Direct reads rare (only for editing/deletion)
- Primarily read by event handlers for recalculation

**Write Pattern (Display Data)**:
- Frequency: After each source data change (event-driven)
- Volume: 1-10 display documents per event
- Consistency: Eventual (acceptable lag of <1 second)

**Read Pattern (Display Data)**:
- Frequency: High (every page load, chart interaction)
- Volume: 1-5 documents per request
- Consistency: Eventual (pre-calculated data may be slightly stale)

### Indexing Strategy

**SourceEnergyReading Indexes**:
```typescript
// Primary unique constraint - prevents duplicate readings
{ userId: 1, type: 1, date: 1 } // unique

// User data access
{ userId: 1, date: 1 }

// Date range queries
{ userId: 1, type: 1, date: 1 }
```

**DisplayEnergyData Indexes**:
```typescript
// Fetch specific display data
{ userId: 1, type: 1, dataType: 1, year: 1 } // unique (when year exists)

// List all display types for user
{ userId: 1, dataType: 1 }

// Cache expiration cleanup
{ calculatedAt: 1 }
```

[Continue with the rest of the sections as in original document through to the Migration Strategy section, then add the new reference]

## Migration Strategy

**IMPORTANT**: This document contains an older 8-week phased migration approach. For production implementation, **use the Backend-First Gradual Migration** strategy instead.

### Migration Strategy Options

**Three strategies are available**:

1. **Accelerated 4-Week Plan** (see below) - NOT RECOMMENDED for production
2. **Comprehensive 8-Week Phased Plan** (see below) - Acceptable for some projects
3. **Backend-First Gradual Migration** (RECOMMENDED) - See dedicated documents

**For detailed comparison**, see:
- `docs/architecture/migration-strategy-comparison.md` - Side-by-side comparison
- `docs/architecture/backend-first-migration-strategy.md` - Full implementation guide

**Recommendation**: Start with `backend-first-migration-strategy.md` for lowest-risk implementation.

### Phased Implementation Approach

**Phase 1: Foundation (Week 1-2)**
- **Goal**: Add repository layer without breaking existing functionality
- **Tasks**:
  - Create `IEnergyRepository` interface
  - Implement `MongoEnergyRepository`
  - Wrap existing `Energy` model calls with repository
  - Add unit tests for repository
- **Risk**: Low (no functional changes, just abstraction)
- **Rollback**: Remove repository layer, revert to direct model access

**Phase 2: Display Collection (Week 2-3)**
- **Goal**: Create display data collection and migration scripts
- **Tasks**:
  - Create `DisplayEnergyData` model with schema
  - Create `IDisplayDataRepository` interface
  - Implement `MongoDisplayDataRepository`
  - Write migration script to create collection
  - Write backfill script to populate from source data
- **Risk**: Medium (schema changes, data migration)
- **Rollback**: Drop `display_energy_data` collection

**Phase 3: Event System (Week 3-4)**
- **Goal**: Implement event bus and basic handlers
- **Tasks**:
  - Create `EventBus` class
  - Define event types (`EnergyEvents.ts`)
  - Implement event handlers (created, updated, deleted)
  - Add event registration on app startup
  - Add unit tests for events and handlers
- **Risk**: Medium (new subsystem)
- **Rollback**: Disable event bus initialization

**Phase 4: Service Layer (Week 4-5)**
- **Goal**: Introduce CRUD and Calculation services
- **Tasks**:
  - Create `EnergyCrudService` with event emission
  - Create `DisplayDataCalculationService`
  - Refactor existing calculation services to be stateless
  - Update server actions to use `EnergyCrudService`
  - Integration tests for service layer
- **Risk**: Medium (changes request flow)
- **Rollback**: Revert server actions to direct repository calls

**Phase 5: Frontend Integration (Week 5-6)**
- **Goal**: Update frontend to consume display data
- **Tasks**:
  - Create `useDisplayData` hook
  - Create `/api/display` route
  - Update chart components to use `useDisplayData`
  - Update timeline slider to use histogram display data
  - E2E tests for frontend flows
- **Risk**: High (user-visible changes)
- **Rollback**: Feature flag to switch between old/new data source

**Phase 6: Optimization & Cleanup (Week 6-7)**
- **Goal**: Optimize performance and remove old code
- **Tasks**:
  - Add bulk operations optimization
  - Implement retry logic for events
  - Performance testing (load tests)
  - Remove old calculation code paths
  - Update documentation
- **Risk**: Low (polish phase)
- **Rollback**: Keep old code 1-2 weeks

**Phase 7: Production Hardening (Week 7-8)**
- **Goal**: Production-ready monitoring and observability
- **Tasks**:
  - Add application metrics (event processing time, etc.)
  - Error tracking integration (Sentry/Datadog)
  - Database query performance monitoring
  - Alerting for stale display data
  - Runbook for operational issues
- **Risk**: Low (observability only)
- **Rollback**: N/A

[Rest of document continues as original...]

