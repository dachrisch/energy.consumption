# Backend-First Gradual Migration Strategy

## Executive Summary

This document outlines a **Backend-First Gradual Migration** approach that minimizes risk by:

1. **Building the complete new backend architecture in parallel** with existing code
2. **Zero frontend changes until backend is fully tested** and validated
3. **Incremental frontend migration** component by component with feature flags
4. **Independent rollback** for each component migration
5. **Both systems running simultaneously** during transition period

**Key Advantage**: Each step is independently reversible with minimal user impact.

## Architecture Overview

### Parallel Systems Design

During migration, both old and new systems run side-by-side:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                                │
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Dashboard     │  │    Charts       │  │   Timeline      │      │
│  │   Components    │  │   Components    │  │    Slider       │      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │
│           │                     │                     │                │
│           │ Initially uses      │ Gradually           │                │
│           │ OLD system          │ migrates to         │                │
│           │                     │ NEW system          │                │
│           │                     │ (feature flagged)   │                │
└───────────┼─────────────────────┼─────────────────────┼───────────────┘
            │                     │                     │
            │                     │                     │
┌───────────▼─────────────────────▼─────────────────────▼───────────────┐
│                      ADAPTER LAYER (Phase 2)                           │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐         │
│  │  Feature Flag Router                                     │         │
│  │  - Routes requests to OLD or NEW backend based on flags  │         │
│  │  - Per-component feature flags                           │         │
│  │  - Percentage-based rollout                              │         │
│  └──────────────┬───────────────────────────┬───────────────┘         │
└─────────────────┼───────────────────────────┼──────────────────────────┘
                  │                           │
                  │                           │
    ┌─────────────▼─────────┐   ┌────────────▼──────────┐
    │   OLD SYSTEM          │   │   NEW SYSTEM          │
    │   (Existing)          │   │   (Phase 1)           │
    │                       │   │                       │
    │ - Server Actions      │   │ - Repository Layer    │
    │ - Direct Model Access │   │ - Event Bus           │
    │ - On-demand Calcs     │   │ - Services Layer      │
    │                       │   │ - Display Collection  │
    └───────────┬───────────┘   └────────────┬──────────┘
                │                            │
    ┌───────────▼───────────┐   ┌────────────▼──────────┐
    │   Energy Collection   │   │ SourceEnergyReading   │
    │   (Existing)          │   │ + DisplayEnergyData   │
    └───────────────────────┘   └───────────────────────┘
                │                            │
                └────────────┬───────────────┘
                             │
                    ┌────────▼──────────┐
                    │  MongoDB Database │
                    └───────────────────┘
```

### Data Synchronization Strategy

**Option A: Dual-Write (Recommended for safety)**

```
User writes data
    │
    ▼
Server Action (OLD)
    │
    ├──> Write to Energy (existing collection)
    │    │
    │    └──> Success
    │
    └──> Write to SourceEnergyReading (new collection)
         │
         └──> Event triggered → DisplayEnergyData updated
```

**Advantages**:
- Guarantees data consistency between systems
- New system always has latest data
- Can switch frontend components immediately
- Easy validation (compare old vs new)

**Disadvantages**:
- More code (dual-write logic)
- Slight performance overhead
- Need to keep both writes in sync

**Option B: Sync Job (Simpler implementation)**

```
User writes data
    │
    ▼
Server Action (OLD)
    │
    └──> Write to Energy (existing collection) only
         │
         └──> Success

Background Job (every 5 minutes):
    │
    ├──> Find new/updated Energy documents
    │
    └──> Copy to SourceEnergyReading
         │
         └──> Event triggered → DisplayEnergyData updated
```

**Advantages**:
- Minimal code changes to existing system
- Old system works unchanged
- Simpler to implement

**Disadvantages**:
- 5-minute lag in new system
- Need background job infrastructure
- Harder to test real-time behavior

**Recommendation**: Use **Option A (Dual-Write)** for production. The safety and consistency benefits outweigh the extra code.

---

## Phase 1: Backend Foundation (Zero User Impact)

**Duration**: 2-3 weeks

**Goal**: Build complete new backend architecture WITHOUT changing any frontend code.

### What Gets Built

#### Week 1: Repository Layer & Models

**Day 1-2: Repository Interfaces**
```typescript
// src/repositories/IEnergyRepository.ts
// src/repositories/IDisplayDataRepository.ts
```
- Define interfaces for all repository methods
- Document expected behavior
- Create TypeScript types

**Day 3-4: MongoDB Implementations**
```typescript
// src/repositories/MongoEnergyRepository.ts
// src/repositories/MongoDisplayDataRepository.ts
```
- Implement repository interfaces
- Add error handling
- Session filtering integration

**Day 5: Database Models**
```typescript
// src/models/SourceEnergyReading.ts
// src/models/DisplayEnergyData.ts
```
- Create Mongoose schemas
- Add indexes
- Apply session filters

**Deliverables**:
- Repository interfaces defined
- MongoDB implementations complete
- Unit tests for repositories (>80% coverage)
- Models with proper indexes

#### Week 2: Event System & Services

**Day 6-8: Event Bus & Event Types**
```typescript
// src/events/EventBus.ts
// src/events/EnergyEvents.ts
// src/events/handlers/index.ts
```
- Implement EventBus singleton
- Define all event types
- Create handler registration system

**Day 9-10: Event Handlers**
```typescript
// src/events/handlers/EnergyReadingCreatedHandler.ts
// src/events/handlers/EnergyReadingUpdatedHandler.ts
// src/events/handlers/EnergyReadingDeletedHandler.ts
// src/events/handlers/BulkImportHandler.ts
```
- Implement all event handlers
- Add logging and error handling
- Optimize bulk operations

**Day 11-12: Services Layer**
```typescript
// src/services/EnergyCrudService.ts
// src/services/DisplayDataCalculationService.ts
```
- EnergyCrudService with event emission
- DisplayDataCalculationService wrapping existing logic
- Integration tests for service layer

**Deliverables**:
- EventBus operational
- All event handlers implemented
- Services layer complete
- Integration tests passing

#### Week 3: Database Migration & API Routes

**Day 13-14: Migration Scripts**
```typescript
// scripts/migrations/001_create_display_collection.ts
// scripts/migrations/002_backfill_display_data.ts
```
- Collection creation script
- Data backfill script
- Rollback scripts

**Day 15-16: New API Routes**
```typescript
// src/app/api/v2/energy/route.ts
// src/app/api/v2/display/route.ts
```
- Version 2 API endpoints
- Authentication integration
- Error handling

**Day 17: Testing & Validation**
- End-to-end integration tests
- Performance benchmarking
- Data consistency validation

**Deliverables**:
- Display collection created and backfilled
- New API routes functional
- Performance benchmarks met (<5ms display queries)
- All tests passing

### Testing Strategy (Phase 1)

**Unit Tests**:
```bash
# Repository tests
npm test -- src/repositories/__tests__/

# Service tests
npm test -- src/services/__tests__/

# Event handler tests
npm test -- src/events/handlers/__tests__/
```

**Integration Tests**:
```typescript
// tests/integration/event-flow.test.ts
describe('Event Flow Integration', () => {
  it('should update display data when reading created', async () => {
    const service = new EnergyCrudService(repository);

    // Create reading
    await service.create(userId, reading);

    // Verify display data updated
    const displayData = await displayRepo.getMonthlyData(userId, 'power', 2024);
    expect(displayData).toBeDefined();
  });
});
```

**Performance Tests**:
```typescript
// tests/performance/display-queries.test.ts
describe('Display Data Performance', () => {
  it('should fetch monthly data in <5ms', async () => {
    const start = Date.now();
    await displayRepo.getMonthlyData(userId, 'power', 2024);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5);
  });
});
```

**Manual Testing**:
```bash
# Test API routes directly (not through frontend)
curl -X GET http://localhost:3100/api/v2/display?type=power&year=2024&dataType=monthly

# Test CRUD operations
curl -X POST http://localhost:3100/api/v2/energy \
  -d '{"type":"power","date":"2024-11-01","amount":12345}'
```

### Acceptance Criteria (Phase 1)

- [ ] All repository unit tests pass (>80% coverage)
- [ ] All service unit tests pass (>80% coverage)
- [ ] Integration tests validate event flow
- [ ] Display data stays synchronized with source data
- [ ] Performance benchmarks met:
  - Display query: <5ms
  - Event processing: <500ms for bulk operations
  - Repository operations: <10ms
- [ ] Migration scripts tested with rollback
- [ ] API routes return correct data
- [ ] Zero frontend code changed
- [ ] Zero user-visible changes

---

## Phase 2: Adapter Layer & Feature Flags

**Duration**: 3-5 days

**Goal**: Create infrastructure to switch between old and new backends without changing component code.

### What Gets Built

#### Day 1-2: Feature Flag System

**Enhanced Feature Flag Model**:
```typescript
// src/models/FeatureFlag.ts (Enhanced)

export interface IFeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercent: number; // 0-100
  componentScope?: string; // 'dashboard' | 'charts' | 'timeline' | etc.
  createdAt: Date;
  updatedAt: Date;
}

// New feature flags
export const FEATURE_FLAGS = {
  // Global
  NEW_BACKEND_ENABLED: 'new_backend_enabled',

  // Per-component
  DASHBOARD_NEW_BACKEND: 'dashboard_new_backend',
  ENERGY_TABLE_NEW_BACKEND: 'energy_table_new_backend',
  TIMELINE_SLIDER_NEW_BACKEND: 'timeline_slider_new_backend',
  MONTHLY_CHARTS_NEW_BACKEND: 'monthly_charts_new_backend',
  CSV_IMPORT_NEW_BACKEND: 'csv_import_new_backend',
  ENERGY_FORMS_NEW_BACKEND: 'energy_forms_new_backend',
} as const;
```

**Flag Evaluation Logic**:
```typescript
// src/lib/featureFlags.ts (Enhanced)

export interface FeatureFlagContext {
  userId: string;
  component?: string;
}

export async function shouldUseNewBackend(
  context: FeatureFlagContext
): Promise<boolean> {
  // 1. Check global flag
  const globalFlag = await getFeatureFlag(FEATURE_FLAGS.NEW_BACKEND_ENABLED);
  if (!globalFlag?.enabled) return false;

  // 2. Check component-specific flag if provided
  if (context.component) {
    const componentFlag = await getFeatureFlag(
      `${context.component}_new_backend`
    );
    if (!componentFlag?.enabled) return false;

    // 3. Check percentage rollout
    if (componentFlag.rolloutPercent < 100) {
      const userHash = hashUserId(context.userId);
      const inRollout = (userHash % 100) < componentFlag.rolloutPercent;
      if (!inRollout) return false;
    }
  }

  return true;
}
```

#### Day 3-4: Adapter Hooks

**Pattern: Dual-Mode Hook**
```typescript
// src/app/hooks/useEnergyDataV2.ts

import { useEnergyData as useEnergyDataOld } from './useEnergyData';
import { useDisplayData as useDisplayDataNew } from './useDisplayData';
import { shouldUseNewBackend } from '@/lib/featureFlags';

interface UseEnergyDataOptions {
  forceOld?: boolean; // Override flag (for testing)
  component?: string; // Component name for flag check
}

/**
 * Adapter hook that routes to OLD or NEW backend based on feature flags
 *
 * During migration:
 * - Checks feature flags to decide which backend to use
 * - Returns same data structure regardless of backend
 * - Allows gradual component-by-component migration
 */
export function useEnergyDataV2(options: UseEnergyDataOptions = {}) {
  const { forceOld = false, component } = options;
  const [userId, setUserId] = useState<string | null>(null);
  const [useNewBackend, setUseNewBackend] = useState(false);

  // Fetch user ID from session
  useEffect(() => {
    async function fetchUserId() {
      const session = await getSession();
      setUserId(session?.user?.id || null);
    }
    fetchUserId();
  }, []);

  // Check feature flags
  useEffect(() => {
    async function checkFlags() {
      if (forceOld || !userId) {
        setUseNewBackend(false);
        return;
      }

      const shouldUse = await shouldUseNewBackend({ userId, component });
      setUseNewBackend(shouldUse);
    }
    checkFlags();
  }, [userId, forceOld, component]);

  // Route to appropriate backend
  const oldHook = useEnergyDataOld();
  const newHook = useDisplayDataNew({ enabled: useNewBackend });

  // Return unified interface
  return useNewBackend ? newHook : oldHook;
}
```

**Backward-Compatible Data Transform**:
```typescript
// src/app/adapters/DisplayDataAdapter.ts

/**
 * Transforms new DisplayEnergyData format to old EnergyType[] format
 * Ensures frontend components see identical data structure
 */
export class DisplayDataAdapter {
  static toEnergyTypeArray(
    monthlyData: IMonthlyData,
    type: EnergyOptions
  ): EnergyType[] {
    // Transform monthly data to flat array of readings
    return monthlyData.months
      .filter(m => m.meterReading !== null)
      .map(m => ({
        _id: `${type}-${m.month}`,
        userId: '', // Filled by hook
        type,
        date: new Date(2024, m.month - 1, 1), // Month-end date
        amount: m.meterReading!,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  }
}
```

#### Day 5: Monitoring & Logging

**Usage Tracking**:
```typescript
// src/lib/monitoring/BackendUsageTracker.ts

export class BackendUsageTracker {
  static async logBackendUsage(event: {
    component: string;
    backend: 'old' | 'new';
    userId: string;
    duration: number;
    success: boolean;
  }) {
    // Log to monitoring service (e.g., DataDog, New Relic)
    console.log('[BackendUsage]', event);

    // Store in database for analytics
    await BackendUsageLog.create(event);
  }
}
```

**A/B Testing Metrics**:
```typescript
// Track performance differences
export async function compareBackends(
  component: string,
  userId: string
) {
  // Fetch from OLD backend
  const oldStart = Date.now();
  const oldData = await fetchFromOld(userId);
  const oldDuration = Date.now() - oldStart;

  // Fetch from NEW backend
  const newStart = Date.now();
  const newData = await fetchFromNew(userId);
  const newDuration = Date.now() - newStart;

  // Log comparison
  await BackendUsageTracker.logBackendUsage({
    component,
    userId,
    backend: 'comparison',
    oldDuration,
    newDuration,
    dataMismatch: !deepEqual(oldData, newData),
  });
}
```

### Deliverables (Phase 2)

- [ ] Feature flag system enhanced with per-component flags
- [ ] Adapter hooks created for all major data hooks
- [ ] Data transform adapters ensure identical output
- [ ] Monitoring infrastructure in place
- [ ] Can switch individual components via feature flags
- [ ] Rollback is instant (toggle flag off)

---

## Phase 3: Incremental Frontend Migration

**Duration**: 2-3 weeks (spread over time, low urgency)

**Goal**: Migrate frontend components one by one, validating each before moving to next.

### Migration Order (Recommended)

#### Week 1: Low-Risk Components

**Component 1: Dashboard Summary Cards**

**Complexity**: Low
**Duration**: 5-6 hours
**User Impact**: Low
**Rollback**: Easy (toggle flag)

**Implementation**:
```typescript
// src/app/dashboard/SummaryCards.tsx

export default function SummaryCards() {
  // Use new backend with feature flag
  const { data, isLoading } = useEnergyDataV2({
    component: 'dashboard'
  });

  // Rest of component unchanged
  // ...
}
```

**Migration Steps**:
1. Update component to use `useEnergyDataV2`
2. Deploy with flag OFF
3. Enable flag for internal testing (1 day)
4. Enable for 10% users (2 days, monitor)
5. Enable for 50% users (2 days, monitor)
6. Enable for 100% users
7. Remove flag code after 1 week stability

**Validation**:
- Visual regression test (screenshots old vs new)
- Data accuracy verification
- Performance comparison (load time)
- Error rate monitoring

---

**Component 2: Energy Table**

**Complexity**: Medium
**Duration**: 6-8 hours
**User Impact**: High (most-used feature)
**Rollback**: Easy (toggle flag)

**Implementation**:
```typescript
// src/app/components/energy/EnergyTable.tsx

export default function EnergyTable({ filters }: Props) {
  const { data, isLoading, error } = useEnergyDataV2({
    component: 'energy_table'
  });

  // Filtering and sorting logic unchanged
  // Component now uses pre-calculated display data
  // Much faster performance expected
}
```

**Migration Steps**:
1. Update to use `useEnergyDataV2`
2. Ensure pagination still works
3. Test sorting and filtering
4. Deploy with flag OFF
5. Gradual rollout (10% → 50% → 100%)

**Expected Improvements**:
- Page load time: 200ms → 50ms (4x faster)
- Reduced CPU usage on client
- Better performance with large datasets

**Validation**:
- Functional tests for all table features
- Performance benchmarks
- User feedback monitoring

---

#### Week 2: Medium-Risk Components

**Component 3: Timeline Slider Histogram**

**Complexity**: Medium
**Duration**: 6-8 hours
**User Impact**: Medium
**Rollback**: Easy (toggle flag)

**Current**: Uses `DataAggregationService.aggregateDataIntoBuckets()` on-demand
**New**: Uses pre-calculated histogram from DisplayEnergyData

**Implementation**:
```typescript
// src/app/components/energy/RangeSlider/SliderVisualization.tsx

export default function SliderVisualization({ data, dateRange }: Props) {
  // OLD: Calculate buckets on every render
  // const buckets = useMemo(() =>
  //   aggregateDataIntoBuckets(data, start, end, 100),
  //   [data, start, end]
  // );

  // NEW: Use pre-calculated histogram
  const { data: histogramData } = useHistogramDisplayData('power');
  const buckets = histogramData?.buckets || [];

  // Rest of rendering logic unchanged
}
```

**Migration Steps**:
1. Replace on-demand calculation with display data hook
2. Ensure bucket structure is identical
3. Test with different date ranges
4. Deploy and gradual rollout

**Expected Improvements**:
- Histogram rendering: 20-30ms → <5ms (5x faster)
- Smoother slider interactions
- No recalculation on date range changes

---

**Component 4: Monthly Charts**

**Complexity**: High
**Duration**: 8-10 hours
**User Impact**: Medium
**Rollback**: Easy (toggle flag)

**Current**: Uses `MonthlyDataAggregationService.calculateMonthlyReadings()` on-demand
**New**: Uses pre-calculated monthly data from DisplayEnergyData

**Implementation**:
```typescript
// src/app/components/energy/MonthlyMeterReadingsChart.tsx

export default function MonthlyMeterReadingsChart({
  type,
  selectedYear
}: Props) {
  // OLD: Calculate monthly data on component mount
  // const monthlyData = useMemo(() =>
  //   calculateMonthlyReadings(energyData, selectedYear, type),
  //   [energyData, selectedYear, type]
  // );

  // NEW: Fetch pre-calculated monthly data
  const { data: monthlyData, isLoading } = useMonthlyDisplayData(type, selectedYear);

  if (isLoading) return <Skeleton />;

  // Chart rendering logic unchanged
  // Data structure is identical
}
```

**Migration Steps**:
1. Replace calculation with display data hook
2. Verify interpolation/extrapolation logic identical
3. Test edge cases (year with no data, gaps)
4. Test consumption calculations
5. Deploy and gradual rollout

**Expected Improvements**:
- Chart load time: 100-150ms → <10ms (10x faster)
- No UI freeze on year change
- Better UX for users with large datasets

---

#### Week 3: Complex Components

**Component 5: CSV Import**

**Complexity**: High
**Duration**: 8-10 hours
**User Impact**: Medium
**Rollback**: Easy (toggle flag)

**Current**: Uses `importCSVAction()` which directly writes to Energy collection
**New**: Uses `EnergyCrudService.bulkCreate()` which emits events

**Implementation**:
```typescript
// src/app/components/add/CSVFileUpload.tsx

async function handleImport(data: EnergyBase[]) {
  // Feature flag check
  const useNew = await shouldUseNewBackend({
    userId: session.user.id,
    component: 'csv_import'
  });

  let result;
  if (useNew) {
    // NEW: Use service with event emission
    result = await importCSVActionV2(data);
  } else {
    // OLD: Direct import
    result = await importCSVAction(data);
  }

  // Handle result (same structure)
  showToast(`Imported ${result.success} readings`);
}
```

**Migration Steps**:
1. Create new `importCSVActionV2` using `EnergyCrudService`
2. Ensure bulk event handling is optimized
3. Test with large CSV files (100+ rows)
4. Monitor event processing performance
5. Deploy and gradual rollout

**Expected Improvements**:
- Display data updates automatically (no manual refresh)
- Faster bulk operations (batch recalculation)
- Better progress tracking

---

**Component 6: Add/Edit Forms**

**Complexity**: Medium
**Duration**: 4-6 hours
**User Impact**: High
**Rollback**: Easy (toggle flag)

**Current**: Uses `addEnergyAction()` and `updateEnergyAction()`
**New**: Uses `EnergyCrudService` via new server actions

**Implementation**:
```typescript
// src/app/components/add/EnergyForm.tsx

async function handleSubmit(data: EnergyBase) {
  const useNew = await shouldUseNewBackend({
    userId: session.user.id,
    component: 'energy_forms'
  });

  if (useNew) {
    await addEnergyActionV2(data);
  } else {
    await addEnergyAction(data);
  }

  // Success handling unchanged
}
```

**Migration Steps**:
1. Create `addEnergyActionV2` using `EnergyCrudService`
2. Create `updateEnergyActionV2` using `EnergyCrudService`
3. Test validation logic
4. Test error handling
5. Deploy and gradual rollout

---

### Migration Checklist (Per Component)

For each component migration:

**Pre-Migration**:
- [ ] Create feature flag in database
- [ ] Update component to use adapter hook
- [ ] Write migration-specific tests
- [ ] Document expected behavior changes

**Deployment**:
- [ ] Deploy with feature flag OFF
- [ ] Verify old behavior unchanged
- [ ] Enable flag in dev environment

**Internal Testing** (1-2 days):
- [ ] Test all functionality manually
- [ ] Compare old vs new output (visual regression)
- [ ] Performance benchmarking
- [ ] Error handling verification

**Gradual Rollout**:
- [ ] Enable for 10% users
- [ ] Monitor for 2-3 days:
  - Error rates (should not increase)
  - Performance metrics (should improve)
  - User feedback (should be neutral/positive)
- [ ] Enable for 50% users
- [ ] Monitor for 2-3 days
- [ ] Enable for 100% users

**Post-Migration**:
- [ ] Monitor for 1 week at 100%
- [ ] Verify no regression
- [ ] Remove feature flag code
- [ ] Update documentation

---

### Rollback Plan (Per Component)

**Instant Rollback** (if critical issue):
```typescript
// Toggle feature flag OFF
await FeatureFlag.updateOne(
  { name: 'energy_table_new_backend' },
  { $set: { enabled: false } }
);

// Users immediately revert to old backend
// No code deployment needed
```

**Percentage Rollback** (if minor issue):
```typescript
// Reduce rollout percentage
await FeatureFlag.updateOne(
  { name: 'energy_table_new_backend' },
  { $set: { rolloutPercent: 10 } } // From 50% back to 10%
);

// 40% of users revert to old backend
// 10% continue testing new backend
```

**Complete Rollback** (if major architectural issue):
1. Disable all component flags (instant)
2. Disable global flag (instant)
3. All users on old backend
4. New backend remains operational for debugging
5. Fix issue and restart gradual rollout

---

## Phase 4: Cleanup & Deprecation

**Duration**: 1 week

**Goal**: Remove old code paths once all components migrated to new backend.

### Week 1: Deprecation

**Day 1-2: Remove Feature Flag Code**

Once all components at 100% for 1 week:

```typescript
// BEFORE (with feature flag)
export function useEnergyDataV2(options: UseEnergyDataOptions = {}) {
  const useNewBackend = await shouldUseNewBackend(context);
  return useNewBackend ? newHook : oldHook;
}

// AFTER (flag removed)
export function useEnergyData() {
  // Always use new backend
  return useDisplayData({ enabled: true });
}
```

**Day 3-4: Remove Old Server Actions**

Mark as deprecated first:
```typescript
// src/actions/energy.ts

/**
 * @deprecated Use EnergyCrudService directly instead
 * Will be removed in v2.0.0
 */
export const addEnergyAction = async (data: EnergyBase) => {
  console.warn('DEPRECATED: addEnergyAction is deprecated, use EnergyCrudService');
  // ... old implementation
};
```

After 1-2 weeks deprecation period:
- Remove old server actions entirely
- Remove old API routes (`/api/energy`)
- Keep new routes (`/api/v2/energy`, `/api/v2/display`)

**Day 5: Remove Old Calculation Logic**

```typescript
// Remove on-demand calculation from components
// DELETE: src/app/handlers/chartData.ts (old chart calculation)
// DELETE: Direct calls to MonthlyDataAggregationService in components
// KEEP: Services in src/services/ (used by event handlers)
```

**Day 6-7: Cleanup & Documentation**

- Remove unused imports
- Update CLAUDE.md with new architecture
- Update README with new data flow
- Remove old migration scripts (keep for reference)

### Deliverables (Phase 4)

- [ ] All feature flag code removed
- [ ] Old server actions deleted
- [ ] Old API routes deleted
- [ ] Old calculation code removed from components
- [ ] Documentation updated
- [ ] Code size reduced (estimate: -20% LOC)

---

## Implementation Timeline Comparison

### Backend-First Gradual Migration (Recommended)

| Phase | Duration | User Impact | Risk | Rollback |
|-------|----------|-------------|------|----------|
| **Phase 1: Backend** | 2-3 weeks | ZERO | LOW | Full rollback |
| **Phase 2: Adapters** | 3-5 days | ZERO | LOW | Disable flags |
| **Phase 3: Frontend** | 2-3 weeks | Gradual | VERY LOW | Toggle flag per component |
| **Phase 4: Cleanup** | 1 week | None | LOW | Keep old code 1-2 weeks |
| **TOTAL** | **6-8 weeks** | **Minimal** | **LOWEST** | **Independent per component** |

**Flexibility**: Phase 3 can be spread over months if needed (low urgency)

---

### Comparison with Previous Plans

#### 4-Week Aggressive Plan (NOT Recommended)

| Phase | Duration | Risk |
|-------|----------|------|
| Backend | 1 week | HIGH (rushed) |
| Frontend | 1 week | HIGH (big-bang) |
| Testing | 1 week | MEDIUM |
| Deployment | 1 week | HIGH (all-or-nothing) |
| **TOTAL** | **4 weeks** | **HIGH** |

**Rollback**: Difficult (requires full code revert)

---

#### 8-Week Phased Plan (Medium Risk)

| Phase | Duration | Risk |
|-------|----------|------|
| Foundation | 2 weeks | LOW |
| Display Collection | 2 weeks | MEDIUM |
| Event System | 2 weeks | MEDIUM |
| Frontend Migration | 2 weeks | HIGH (still big-bang) |
| **TOTAL** | **8 weeks** | **MEDIUM** |

**Rollback**: Moderate (feature flag for entire frontend)

---

#### Backend-First Gradual (Recommended)

| Phase | Duration | Risk |
|-------|----------|------|
| Backend (all) | 3 weeks | LOW (zero user impact) |
| Adapters | 1 week | LOW (infrastructure only) |
| Frontend (incremental) | 2-3 weeks | VERY LOW (one component at a time) |
| Cleanup | 1 week | LOW |
| **TOTAL** | **7-8 weeks** | **LOWEST** |

**Rollback**: Easy (per-component toggle)

---

## Why Backend-First is Safer

### Risk Comparison

**Traditional Approach** (4-Week or 8-Week):
```
Backend Changes → Frontend Changes → Deploy All → Hope Nothing Breaks
                                                   ↓
                                            (Rollback is hard)
```

**Backend-First Approach**:
```
Backend Changes (tested, validated)
       ↓
Frontend Component 1 → Test → Rollback if needed (easy)
       ↓
Frontend Component 2 → Test → Rollback if needed (easy)
       ↓
Frontend Component 3 → Test → Rollback if needed (easy)
       ↓
All components migrated → Remove old code
```

### Specific Safety Advantages

**1. Zero Initial User Impact**
- Phase 1 builds entire backend with NO frontend changes
- Users see zero difference
- Can test backend thoroughly without affecting production

**2. Independent Component Rollback**
- Each component has its own feature flag
- Problem with Energy Table? Toggle flag off (instant)
- Other components unaffected

**3. Gradual Validation**
- Test each component in isolation
- Validate data accuracy before moving to next
- Catch issues early (single component vs entire system)

**4. Percentage-Based Rollout**
- Start with 10% users per component
- Monitor metrics before expanding
- Early issue detection with minimal impact

**5. Parallel Systems**
- Both old and new systems operational
- Can compare outputs for validation
- Builds confidence before full migration

**6. Low Urgency**
- Phase 3 can extend over months
- No pressure to rush
- Can pause migration if issues arise

---

## Recommended Approach for This Project

**Start with Backend-First Gradual Migration**

### Why This is Best for Energy Consumption Monitor

**1. Small User Base**
- Likely 1-10 active users
- Low risk of widespread impact
- Can afford gradual rollout

**2. Complex Calculations**
- Monthly interpolation/extrapolation is complex
- Needs thorough validation
- Incremental testing reduces risk

**3. Performance Critical**
- Charts must render fast
- Can validate performance per component
- Compare old vs new before committing

**4. Developer Learning**
- New architecture patterns (events, repositories)
- Incremental approach allows learning
- Easier to debug isolated components

**5. Time Flexibility**
- No hard deadline
- Can spread Phase 3 over time
- Quality over speed

---

## First Week Action Items

### Monday (Day 1)

**Morning**:
- [ ] Create `docs/architecture/migration-plan.md` (this document)
- [ ] Create `src/repositories/` directory structure
- [ ] Create `src/events/` directory structure
- [ ] Create `src/services/` directory structure

**Afternoon**:
- [ ] Define `IEnergyRepository` interface
- [ ] Define `IDisplayDataRepository` interface
- [ ] Write interface documentation
- [ ] Create placeholder test files

### Tuesday (Day 2)

**Morning**:
- [ ] Create `SourceEnergyReading` model
- [ ] Create `DisplayEnergyData` model
- [ ] Add indexes
- [ ] Test models with unit tests

**Afternoon**:
- [ ] Implement `MongoEnergyRepository`
- [ ] Write repository unit tests
- [ ] Achieve >80% test coverage

### Wednesday (Day 3)

**Morning**:
- [ ] Implement `MongoDisplayDataRepository`
- [ ] Write repository unit tests
- [ ] Integration tests for both repositories

**Afternoon**:
- [ ] Create migration script `001_create_display_collection.ts`
- [ ] Run migration in dev environment
- [ ] Verify collection created with correct indexes

### Thursday (Day 4)

**Morning**:
- [ ] Define event types (`EnergyEvents.ts`)
- [ ] Implement `EventBus` singleton
- [ ] Write EventBus unit tests

**Afternoon**:
- [ ] Create event handler skeletons
- [ ] Register handlers on app startup
- [ ] Test event emission (no handlers yet)

### Friday (Day 5)

**Morning**:
- [ ] Implement `EnergyReadingCreatedHandler`
- [ ] Test handler with integration test
- [ ] Verify display data updates

**Afternoon**:
- [ ] Weekly review and planning
- [ ] Document progress
- [ ] Plan Week 2 tasks

---

## Success Metrics

### Phase 1 Success Metrics

**Technical**:
- All tests passing (unit + integration)
- Display query time <5ms (measured)
- Event processing time <500ms for bulk operations
- Zero data consistency errors

**Process**:
- Zero production incidents
- No user-reported issues (users shouldn't notice anything)
- Documentation complete and accurate

### Phase 2 Success Metrics

**Technical**:
- Feature flags working correctly
- Adapter hooks return identical data (old vs new)
- Can switch backends via flag toggle

**Process**:
- Internal testing successful
- Monitoring infrastructure operational
- A/B testing framework ready

### Phase 3 Success Metrics (Per Component)

**Technical**:
- Component behavior identical (old vs new backend)
- Performance improved (measure before/after)
- Error rate unchanged or lower

**User Experience**:
- Zero user-reported regressions
- Faster load times (measured)
- Positive or neutral feedback

**Process**:
- Gradual rollout completed without issues
- Rollback tested and validated
- Documentation updated

### Phase 4 Success Metrics

**Technical**:
- Old code removed successfully
- No references to deprecated APIs
- Test coverage maintained or improved

**Process**:
- Documentation updated
- Team understands new architecture
- Codebase cleaner and more maintainable

---

## Risk Mitigation Summary

### Phase 1 Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Backend bugs undetected | Medium | High | Extensive integration testing, parallel running |
| Performance worse than expected | Low | Medium | Benchmark before frontend migration, optimize if needed |
| Event handlers fail silently | Medium | High | Comprehensive logging, retry logic, monitoring |
| Data consistency issues | Low | High | Validation scripts, comparison tests |

### Phase 3 Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Component migration breaks UI | Low | High | Feature flag instant rollback, visual regression tests |
| Data mismatch (old vs new) | Medium | High | A/B testing, comparison validation, gradual rollout |
| Performance regression | Low | Medium | Performance benchmarks, monitoring, can revert |
| User confusion | Low | Low | Identical behavior, thorough testing |

### Overall Risk Assessment

**Backend-First Gradual Migration**:
- **Overall Risk**: VERY LOW
- **User Impact**: MINIMAL
- **Rollback Difficulty**: VERY EASY
- **Confidence Level**: HIGH

**Compared to Alternatives**:
- **4-Week Plan**: HIGH RISK, DIFFICULT ROLLBACK
- **8-Week Plan**: MEDIUM RISK, MODERATE ROLLBACK
- **Backend-First**: LOWEST RISK, EASIEST ROLLBACK ✅

---

## Appendix A: Feature Flag Configuration Examples

### Initial Setup (All Flags OFF)

```json
// MongoDB FeatureFlag collection initial state
[
  {
    "name": "new_backend_enabled",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": null
  },
  {
    "name": "dashboard_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "dashboard"
  },
  {
    "name": "energy_table_new_backend",
    "enabled": false,
    "rolloutPercent": 0,
    "componentScope": "energy_table"
  }
  // ... other component flags
]
```

### Gradual Rollout (Energy Table Example)

**Week 1: Internal Testing**
```json
{
  "name": "energy_table_new_backend",
  "enabled": true,
  "rolloutPercent": 0, // Only specific test users
  "componentScope": "energy_table",
  "testUserIds": ["user123", "user456"] // Whitelist
}
```

**Week 2: 10% Rollout**
```json
{
  "name": "energy_table_new_backend",
  "enabled": true,
  "rolloutPercent": 10,
  "componentScope": "energy_table"
}
```

**Week 3: 50% Rollout**
```json
{
  "name": "energy_table_new_backend",
  "enabled": true,
  "rolloutPercent": 50,
  "componentScope": "energy_table"
}
```

**Week 4: 100% Rollout**
```json
{
  "name": "energy_table_new_backend",
  "enabled": true,
  "rolloutPercent": 100,
  "componentScope": "energy_table"
}
```

---

## Appendix B: Comparison of Adapter Patterns

### Pattern 1: Hook Wrapper (Recommended)

```typescript
// Pros: Clean, automatic, transparent
// Cons: Requires hook refactoring

export function useEnergyDataV2(options: UseEnergyDataOptions = {}) {
  const useNew = await shouldUseNewBackend({ component: options.component });
  return useNew ? useDisplayData() : useEnergyData();
}

// Usage in component
const { data, isLoading } = useEnergyDataV2({ component: 'dashboard' });
```

### Pattern 2: Service Layer Switch (Alternative)

```typescript
// Pros: No hook changes, backend-only
// Cons: Duplicated logic in service

export class EnergyDataService {
  async fetchData(userId: string, component: string) {
    const useNew = await shouldUseNewBackend({ userId, component });

    if (useNew) {
      return this.fetchFromNewBackend(userId);
    } else {
      return this.fetchFromOldBackend(userId);
    }
  }
}

// Usage in hook
const data = await EnergyDataService.fetchData(userId, 'dashboard');
```

### Pattern 3: API Route Switch (Not Recommended)

```typescript
// Pros: No frontend changes at all
// Cons: Hard to test, hidden complexity

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  const component = request.headers.get('X-Component');

  const useNew = await shouldUseNewBackend({ userId, component });

  if (useNew) {
    return handleWithNewBackend(request);
  } else {
    return handleWithOldBackend(request);
  }
}
```

**Recommendation**: Use **Pattern 1 (Hook Wrapper)** for transparency and easier testing.

---

## Appendix C: Monitoring Dashboard Specification

### Metrics to Track During Migration

**Backend Performance**:
- Display query latency (p50, p95, p99)
- Event processing time
- Event failure rate
- Repository query time

**Frontend Performance**:
- Component render time
- Data fetch time
- Error rate by component
- User interaction lag

**Migration Progress**:
- % users on new backend per component
- Feature flag states
- Rollback events count

**Data Consistency**:
- Source vs display data mismatches
- Stale display data count
- Event processing backlog

### Alerting Rules

**Critical Alerts**:
- Display query time >50ms (threshold exceeded 10x)
- Event processing failure rate >1%
- Data consistency error detected
- Any component error rate increase >50%

**Warning Alerts**:
- Gradual performance degradation
- Increased memory usage
- Event processing backlog growing

---

## Document Metadata

**Version**: 1.0
**Created**: 2025-11-17
**Author**: Claude Code (Architecture Designer Agent)
**Status**: Ready for Implementation
**Next Review**: After Phase 1 Completion
