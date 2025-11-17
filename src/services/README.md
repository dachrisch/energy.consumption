# Service Layer Documentation

## Overview

The service layer sits between server actions and repositories, providing:
- **Business logic encapsulation** - Domain operations in one place
- **Event emission** - Automatic notifications when data changes
- **Transaction coordination** - Orchestrating multiple repository calls
- **Cache management** - Automatic display data invalidation

This layer follows the **Service Pattern** to keep business logic separate from data access (repositories) and presentation (components).

## What is the Service Layer?

The Service Layer is a design pattern that:
- **Encapsulates business logic** - Complex operations in dedicated service classes
- **Coordinates operations** - Manages workflow across multiple repositories
- **Emits domain events** - Notifies other parts of the system when important things happen
- **Provides clean API** - Simple interface for server actions and components
- **Enforces business rules** - Validation, authorization, data consistency

## Architecture

### Layer Position

```
┌─────────────────────────────────────────────────┐
│           Frontend Components                    │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│           Server Actions                         │
│  (Next.js server-side functions)                 │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│        SERVICE LAYER ← YOU ARE HERE              │
│  (Business logic + event emission)               │
│                                                   │
│  ┌──────────────────┐    ┌───────────────────┐  │
│  │ EnergyCrudService│    │ DisplayDataCalc   │  │
│  │                  │    │ Service           │  │
│  │ - create()       │    │                   │  │
│  │ - update()       │    │ - calcMonthly()   │  │
│  │ - delete()       │───>│ - calcHistogram() │  │
│  │ - emits events   │    │ - invalidate()    │  │
│  └────────┬─────────┘    └─────────┬─────────┘  │
│           │                        │             │
│           │ emits                  │ listens     │
│           │                        │             │
│  ┌────────▼────────────────────────▼─────────┐  │
│  │         Event Bus                         │  │
│  │  - ENERGY_READING_CREATED                 │  │
│  │  - ENERGY_READING_UPDATED                 │  │
│  │  - ENERGY_READING_DELETED                 │  │
│  │  - ENERGY_READINGS_BULK_IMPORTED          │  │
│  └───────────────────────────────────────────┘  │
│           │                        │             │
│  ┌────────▼────────┐    ┌──────────▼─────────┐  │
│  │DisplayDataEvent │    │  (Other handlers)  │  │
│  │Handler          │    │  - Webhooks        │  │
│  │                 │    │  - Notifications   │  │
│  │ - onCreated()   │    │  - Analytics       │  │
│  │ - onUpdated()   │    │                    │  │
│  │ - onDeleted()   │    │                    │  │
│  │ - invalidates   │    │                    │  │
│  └─────────────────┘    └────────────────────┘  │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│        Repository Layer                          │
│  (Data access abstraction)                       │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│        Database Layer                            │
└──────────────────────────────────────────────────┘
```

### Key Components

1. **CRUD Services** (`energy/`)
   - `EnergyCrudService` - Energy reading operations + event emission

2. **Calculation Services** (`display/`)
   - `DisplayDataCalculationService` - Pre-compute display data

3. **Event Handlers** (`handlers/`)
   - `DisplayDataEventHandler` - Automatic cache invalidation

4. **Service Factory** (`serviceFactory.ts`)
   - Singleton management
   - Dependency injection
   - Testing utilities

## Services Overview

### EnergyCrudService

Handles energy reading CRUD operations with automatic event emission.

**Location**: `energy/EnergyCrudService.ts`

**Responsibilities:**
- Create/update/delete energy readings
- Emit events after successful operations
- Delegate to repository for data access
- Enforce user data isolation

**Dependencies:**
- `IEnergyRepository` - Data access
- `IEventBus` - Event emission

**Key Methods:**

**CREATE:**
```typescript
create(reading: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>): Promise<SourceEnergyReading>
```
Create single reading, emit `ENERGY_READING_CREATED` event.

```typescript
createMany(readings: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<SourceEnergyReading[]>
```
Create multiple readings (bulk), emit `ENERGY_READINGS_BULK_IMPORTED` event.

**READ:**
```typescript
findById(id: string, userId: string): Promise<SourceEnergyReading | null>
```
Find single reading by ID.

```typescript
findAll(userId: string, filters?: EnergyFilters): Promise<SourceEnergyReading[]>
```
Find all readings with optional filters.

```typescript
findByDateRange(userId: string, startDate: Date, endDate: Date, type?: EnergyOptions): Promise<SourceEnergyReading[]>
```
Find readings in date range.

```typescript
count(userId: string, filters?: EnergyFilters): Promise<number>
```
Count readings.

```typescript
getMinMaxDates(userId: string, type?: EnergyOptions): Promise<{ min: Date; max: Date } | null>
```
Get date range for readings.

**UPDATE:**
```typescript
update(id: string, userId: string, data: Partial<SourceEnergyReading>): Promise<SourceEnergyReading | null>
```
Update reading, emit `ENERGY_READING_UPDATED` event.

**DELETE:**
```typescript
delete(id: string, userId: string): Promise<boolean>
```
Delete single reading, emit `ENERGY_READING_DELETED` event.

```typescript
deleteMany(ids: string[], userId: string): Promise<number>
```
Delete multiple readings, emit individual `ENERGY_READING_DELETED` events for each.

**Event Emission Strategy:**
- Individual operations emit individual events (CREATE, UPDATE, DELETE)
- Bulk operations emit bulk event (BULK_IMPORTED) for performance
- Events emitted AFTER successful repository operations
- Includes before/after data in UPDATE events for accurate invalidation

### DisplayDataCalculationService

Calculates and caches pre-computed display data.

**Location**: `display/DisplayDataCalculationService.ts`

**Responsibilities:**
- Calculate monthly chart data (12 months, meter readings + consumption)
- Calculate histogram data (measurement distribution)
- Store results in DisplayEnergyData collection
- Generate cache validation hashes
- Track calculation metadata

**Dependencies:**
- `IDisplayDataRepository` - Cache storage
- `IEnergyRepository` - Source data access
- `MonthlyDataAggregationService` - Monthly calculations
- `DataAggregationService` - Histogram calculations

**Key Methods:**

**Calculate Monthly Chart Data:**
```typescript
calculateMonthlyChartData(userId: string, type: EnergyOptions, year: number): Promise<MonthlyChartData>
```
- Fetches source readings for the year
- Calculates 12 monthly data points (meter readings + consumption)
- Handles interpolation/extrapolation for missing readings
- Generates SHA256 hash of source data
- Stores in DisplayEnergyData collection
- Returns calculated data

**Calculate Histogram Data:**
```typescript
calculateHistogramData(userId: string, type: EnergyOptions, bucketCount?: number): Promise<HistogramData>
```
- Fetches all source readings for user/type
- Aggregates into time buckets (default: 100 buckets)
- Calculates measurement distribution
- Generates hash
- Stores in cache
- Returns histogram data

**Invalidate Cache:**
```typescript
invalidateAllForUser(userId: string): Promise<number>
```
- Deletes all cached display data for user
- Returns count of deleted items
- Used when user data changes significantly

**Calculate and Store:**
```typescript
calculateAndStoreMonthlyData(userId: string, type: EnergyOptions, year: number): Promise<void>
```
Calculate and store without returning (fire-and-forget).

### DisplayDataEventHandler

Connects energy events to display data invalidation.

**Location**: `handlers/DisplayDataEventHandler.ts`

**Responsibilities:**
- Listen for energy reading events
- Invalidate affected display data
- Trigger recalculation when needed
- Coordinate between CRUD and calculation services

**Event Handlers:**

**On ENERGY_READING_CREATED:**
```typescript
onEnergyReadingCreated(event: EnergyReadingCreatedEvent): Promise<void>
```
- Invalidates display data for affected user/type
- Triggers recalculation for affected years

**On ENERGY_READING_UPDATED:**
```typescript
onEnergyReadingUpdated(event: EnergyReadingUpdatedEvent): Promise<void>
```
- Invalidates based on before/after data
- Handles date changes (may affect different years)
- Handles type changes (affects different display data)

**On ENERGY_READING_DELETED:**
```typescript
onEnergyReadingDeleted(event: EnergyReadingDeletedEvent): Promise<void>
```
- Invalidates for deleted reading's user/type/year

**On ENERGY_READINGS_BULK_IMPORTED:**
```typescript
onBulkImported(event: EnergyReadingsBulkImportedEvent): Promise<void>
```
- Batch invalidation (more efficient than individual)
- Groups by year to minimize recalculations

**Invalidation Strategy (Phase 1):**
- Simple: Invalidate ALL display data for user/type when ANY reading changes
- Performance: Acceptable for small datasets (<10,000 readings)
- Future: Smart invalidation (only affected years/months)

### Service Factory

Manages service instances and dependencies.

**Location**: `serviceFactory.ts`

**Responsibilities:**
- Create singleton service instances
- Inject dependencies
- Provide clean API for getting services
- Support testing (reset services)

**Functions:**

**Get Energy CRUD Service:**
```typescript
getEnergyCrudService(): EnergyCrudService
```
Returns singleton instance of EnergyCrudService with dependencies injected.

**Get Display Data Service:**
```typescript
getDisplayDataService(): DisplayDataCalculationService
```
Returns singleton instance of DisplayDataCalculationService.

**Initialize Event Handlers:**
```typescript
initializeEventHandlers(): void
```
Registers all event handlers with EventBus (call on app startup).

**Reset Services (Testing):**
```typescript
resetServices(): void
```
Destroys all singleton instances, resets EventBus. Use in test teardown.

## Usage Examples

### Creating Energy Readings

**Single Reading:**
```typescript
import { getEnergyCrudService } from '@/services';

const service = getEnergyCrudService();

const reading = await service.create({
  userId: 'user123',
  type: 'power',
  date: new Date('2024-11-17'),
  amount: 12345.67,
});

console.log('Created:', reading._id);
// Automatically emits ENERGY_READING_CREATED event
// DisplayDataEventHandler invalidates cache automatically
```

**Bulk Import (CSV):**
```typescript
import { getEnergyCrudService } from '@/services';

const service = getEnergyCrudService();

const readings = [
  { userId: 'user123', type: 'power', date: new Date('2024-01-01'), amount: 10000 },
  { userId: 'user123', type: 'power', date: new Date('2024-02-01'), amount: 10150 },
  // ... 98 more readings
];

const created = await service.createMany(readings);
console.log(`Imported ${created.length} readings`);
// Emits single BULK_IMPORTED event (not 100 individual events)
```

### Updating Readings

```typescript
import { getEnergyCrudService } from '@/services';

const service = getEnergyCrudService();

const updated = await service.update('reading-id-123', 'user123', {
  amount: 12500, // Corrected value
});

if (updated) {
  console.log('Updated successfully');
  // Emits ENERGY_READING_UPDATED event with before/after data
} else {
  console.log('Reading not found');
}
```

### Deleting Readings

**Single Delete:**
```typescript
import { getEnergyCrudService } from '@/services';

const service = getEnergyCrudService();

const deleted = await service.delete('reading-id-123', 'user123');

if (deleted) {
  console.log('Deleted successfully');
  // Emits ENERGY_READING_DELETED event
}
```

**Bulk Delete:**
```typescript
const count = await service.deleteMany(['id1', 'id2', 'id3'], 'user123');
console.log(`Deleted ${count} readings`);
// Emits individual DELETE events for each reading
```

### Calculating Display Data

**Monthly Chart Data:**
```typescript
import { getDisplayDataService } from '@/services';

const service = getDisplayDataService();

const monthlyData = await service.calculateMonthlyChartData('user123', 'power', 2024);

console.log(`${monthlyData.months.length} months calculated`);
console.log(`Source data hash: ${monthlyData.sourceDataHash}`);
console.log(`Calculated at: ${monthlyData.calculatedAt}`);

// Data automatically stored in DisplayEnergyData collection
// Future requests will use cached data (fast!)
```

**Histogram Data:**
```typescript
import { getDisplayDataService } from '@/services';

const service = getDisplayDataService();

const histogram = await service.calculateHistogramData('user123', 'power', 100);

console.log(`${histogram.buckets.length} buckets`);
console.log(`Date range: ${histogram.dateRange.min} to ${histogram.dateRange.max}`);
console.log(`Max count: ${histogram.maxCount}`);
```

### Manual Cache Invalidation

```typescript
import { getDisplayDataService } from '@/services';

const service = getDisplayDataService();

const deletedCount = await service.invalidateAllForUser('user123');
console.log(`Invalidated ${deletedCount} cached items`);
```

### Event-Driven Workflow Example

```typescript
import { getEnergyCrudService, initializeEventHandlers } from '@/services';

// 1. Initialize event handlers (once on app startup)
initializeEventHandlers();

// 2. Create reading (in server action)
const service = getEnergyCrudService();
const reading = await service.create({
  userId: 'user123',
  type: 'power',
  date: new Date(),
  amount: 12345,
});

// 3. Automatic event flow:
//    a) EnergyCrudService emits ENERGY_READING_CREATED event
//    b) DisplayDataEventHandler receives event
//    c) Handler invalidates cached display data
//    d) Next request recalculates and caches fresh data

// 4. Frontend sees updated data automatically (no manual refresh)
```

### In Server Actions

**Create Energy Action:**
```typescript
// src/actions/energy.ts

'use server';

import { getEnergyCrudService } from '@/services';
import { getServerSession } from 'next-auth';

export async function addEnergyAction(data: { type: EnergyOptions; date: Date; amount: number }) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const service = getEnergyCrudService();

  const reading = await service.create({
    userId: session.user.id,
    type: data.type,
    date: data.date,
    amount: data.amount,
  });

  return reading;
  // Event emitted automatically → Cache invalidated → Fresh data next request
}
```

**Get Monthly Data Action:**
```typescript
// src/actions/display.ts

'use server';

import { getDisplayDataService } from '@/services';
import { getServerSession } from 'next-auth';

export async function getMonthlyChartDataAction(type: EnergyOptions, year: number) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const service = getDisplayDataService();

  // Returns cached data if available, calculates if not
  const data = await service.calculateMonthlyChartData(session.user.id, type, year);

  return data;
}
```

## Event Integration

### Event Flow

```
User Action (Create Reading)
       │
       ▼
Server Action (addEnergyAction)
       │
       ▼
EnergyCrudService.create()
       │
       ├──> Repository.create() ──> Database (SourceEnergyReading saved)
       │
       └──> EventBus.emit(ENERGY_READING_CREATED)
              │
              ▼
       DisplayDataEventHandler.onCreated()
              │
              ├──> DisplayDataRepository.invalidate()
              │
              └──> Database (DisplayEnergyData deleted)


Next Request (Get Monthly Chart)
       │
       ▼
Server Action (getMonthlyChartDataAction)
       │
       ▼
DisplayDataCalculationService.calculateMonthlyChartData()
       │
       ├──> Check cache (not found - invalidated earlier)
       │
       ├──> Fetch source readings
       │
       ├──> Calculate monthly data
       │
       ├──> Store in cache (DisplayEnergyData)
       │
       └──> Return fresh data
```

### Event Handlers Registration

```typescript
// src/app/layout.tsx or src/lib/init.ts

import { initializeEventHandlers } from '@/services';

// Call once on app startup
initializeEventHandlers();

// Now all event handlers are registered:
// - DisplayDataEventHandler listening for energy events
// - (Future) WebhookHandler listening for all events
// - (Future) NotificationHandler listening for user events
```

### Custom Event Handlers

You can add your own event handlers:

```typescript
import { getEventBus, EnergyEventTypes } from '@/events';

const eventBus = getEventBus();

// Add custom analytics handler
eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  await logAnalytics('energy_reading_created', {
    userId: event.userId,
    type: event.data.type,
    amount: event.data.amount,
  });
});

// Add webhook handler
eventBus.on(EnergyEventTypes.BULK_IMPORTED, async (event) => {
  await fetch('https://webhook.example.com/energy-imported', {
    method: 'POST',
    body: JSON.stringify({
      userId: event.userId,
      count: event.data.count,
    }),
  });
});
```

## Testing

### Test Organization

```
src/services/
├── __tests__/
│   ├── EnergyCrudService.test.ts               (33 tests)
│   ├── DisplayDataCalculationService.test.ts   (31 tests)
│   ├── DisplayDataEventHandler.test.ts         (27 tests)
│   └── integration.test.ts                     (8 tests)
├── energy/
│   └── EnergyCrudService.ts
├── display/
│   └── DisplayDataCalculationService.ts
├── handlers/
│   └── DisplayDataEventHandler.ts
├── serviceFactory.ts
└── index.ts
```

### Running Tests

**All service tests:**
```bash
npm test -- src/services
```

**With coverage:**
```bash
npm test -- src/services --coverage --collectCoverageFrom='src/services/**/*.ts'
```

**Specific test file:**
```bash
npm test -- src/services/__tests__/EnergyCrudService.test.ts
```

**Integration tests only:**
```bash
npm test -- src/services/__tests__/integration.test.ts
```

### Test Coverage

**Current Coverage**: 100%

| Category | Coverage |
|----------|----------|
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

### Testing Strategy

**1. Unit Tests**
- Test each service method in isolation
- Mock dependencies (repositories, event bus)
- Test error cases

**2. Integration Tests**
- Test complete workflows (create → event → invalidation)
- Use real repositories (test database)
- Verify event emission and handling

**3. Event Flow Tests**
- Verify events emitted at right times
- Test event data structure
- Test multiple handlers for same event

**4. Cache Invalidation Tests**
- Verify cache invalidated on data changes
- Test recalculation after invalidation
- Test hash-based cache validation

### Example Test

```typescript
import { EnergyCrudService } from '../energy/EnergyCrudService';
import { MongoEnergyRepository } from '@/repositories/mongodb/MongoEnergyRepository';
import { getEventBus, resetEventBus } from '@/events';

describe('EnergyCrudService', () => {
  let service: EnergyCrudService;
  let eventBus: IEventBus;

  beforeEach(() => {
    resetEventBus();
    const repository = new MongoEnergyRepository();
    eventBus = getEventBus();
    service = new EnergyCrudService(repository, eventBus);
  });

  describe('create()', () => {
    it('should create reading and emit event', async () => {
      const handler = jest.fn();
      eventBus.on(EnergyEventTypes.CREATED, handler);

      const reading = await service.create({
        userId: 'user123',
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 12345,
      });

      expect(reading._id).toBeDefined();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.CREATED,
          userId: 'user123',
          data: expect.objectContaining({ amount: 12345 }),
        })
      );
    });

    it('should handle repository errors', async () => {
      // Try to create duplicate
      await service.create({
        userId: 'user123',
        type: 'power',
        date: new Date('2024-11-18'),
        amount: 100,
      });

      await expect(
        service.create({
          userId: 'user123',
          type: 'power',
          date: new Date('2024-11-18'), // Same date
          amount: 200,
        })
      ).rejects.toThrow();
    });
  });
});
```

### Integration Test Example

```typescript
import { getEnergyCrudService, getDisplayDataService, initializeEventHandlers } from '@/services';
import { resetServices } from '@/services/serviceFactory';

describe('Service Integration', () => {
  beforeEach(() => {
    resetServices();
    initializeEventHandlers();
  });

  it('should invalidate cache when reading created', async () => {
    const crudService = getEnergyCrudService();
    const displayService = getDisplayDataService();

    // 1. Calculate initial display data
    const initial = await displayService.calculateMonthlyChartData('user123', 'power', 2024);
    const initialHash = initial.sourceDataHash;

    // 2. Create new reading
    await crudService.create({
      userId: 'user123',
      type: 'power',
      date: new Date('2024-06-15'),
      amount: 12000,
    });

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Recalculate display data
    const updated = await displayService.calculateMonthlyChartData('user123', 'power', 2024);

    // 4. Verify hash changed (data was recalculated)
    expect(updated.sourceDataHash).not.toBe(initialHash);
  });
});
```

## Best Practices

### 1. Always Use Service Factory

**DO:**
```typescript
import { getEnergyCrudService } from '@/services';

const service = getEnergyCrudService();
```

**DON'T:**
```typescript
import { EnergyCrudService } from '@/services/energy/EnergyCrudService';

const service = new EnergyCrudService(repository, eventBus); // ❌ Hard-coded dependencies
```

### 2. Initialize Event Handlers on Startup

**DO:**
```typescript
// src/app/layout.tsx

import { initializeEventHandlers } from '@/services';

export default function RootLayout({ children }) {
  // Initialize once
  React.useEffect(() => {
    initializeEventHandlers();
  }, []);

  return <html>{children}</html>;
}
```

**DON'T:**
```typescript
// Forgetting to initialize handlers
// Events will be emitted but no one will handle them
```

### 3. Let Services Emit Events

**DO:**
```typescript
// Service handles event emission
const reading = await service.create(data);
// Event emitted automatically
```

**DON'T:**
```typescript
// Manual event emission
const reading = await repository.create(data);
const event = EnergyEventFactory.createCreatedEvent(reading);
await eventBus.emit(event); // ❌ Service should do this
```

### 4. Use Services in Server Actions

**DO:**
```typescript
'use server';

import { getEnergyCrudService } from '@/services';

export async function addEnergy(data) {
  const service = getEnergyCrudService();
  return service.create(data);
}
```

**DON'T:**
```typescript
'use server';

import { MongoEnergyRepository } from '@/repositories';

export async function addEnergy(data) {
  const repository = new MongoEnergyRepository();
  return repository.create(data); // ❌ Bypasses service layer (no events)
}
```

### 5. Handle Errors Gracefully

**DO:**
```typescript
try {
  await service.create(reading);
  showToast('Reading created successfully');
} catch (error) {
  if (error.code === 11000) {
    showToast('Reading already exists for this date');
  } else {
    showToast('Failed to create reading');
  }
}
```

**DON'T:**
```typescript
await service.create(reading); // ❌ Unhandled errors
```

### 6. Reset Services in Tests

**DO:**
```typescript
import { resetServices } from '@/services';

afterEach(() => {
  resetServices(); // Clean slate for next test
});
```

**DON'T:**
```typescript
// Forgetting to reset
// Tests will share service state (flaky tests)
```

### 7. Use Display Service for Pre-Calculated Data

**DO:**
```typescript
// Fast - uses cache
const data = await displayService.calculateMonthlyChartData(userId, 'power', 2024);
```

**DON'T:**
```typescript
// Slow - calculates on every request
const readings = await crudService.findAll(userId, { type: 'power' });
const data = MonthlyDataAggregationService.calculate(readings, 2024);
```

## Performance Considerations

### Event Emission Overhead

**Synchronous Processing:**
- Events processed sequentially (FIFO)
- Handler execution time adds to request latency
- Typical overhead: <50ms per event

**Optimization:**
- Bulk operations emit single event (not N events)
- Fast handlers complete in <10ms
- Slow handlers can be async (future)

### Cache Invalidation Strategy

**Phase 1 (Current):**
- Invalidate ALL display data for user/type when ANY reading changes
- Simple, reliable, works for small datasets

**Phase 2 (Future):**
- Smart invalidation - only affected years/months
- Reduced recalculation overhead
- More complex logic

**Phase 3 (Future):**
- Incremental updates - update cache in place
- No full recalculation needed
- Fastest, most complex

### Service Singleton Pattern

**Benefits:**
- Reuse repository connections
- Share event bus instance
- Reduce memory overhead

**Considerations:**
- Not suitable for request-scoped state
- Services are stateless (safe for concurrent requests)
- Testing requires explicit reset

## Troubleshooting

### "Events not being handled"

**Symptom**: Data changes but cache not invalidated

**Cause**: Event handlers not initialized

**Solution**:
```typescript
import { initializeEventHandlers } from '@/services';

// Call on app startup
initializeEventHandlers();
```

### "Cache always stale"

**Symptom**: Display data recalculated on every request

**Cause**: Cache hash mismatch or over-invalidation

**Solution**:
```typescript
// Check cache invalidation logic
const data = await displayService.calculateMonthlyChartData(userId, type, year);
console.log('Source hash:', data.sourceDataHash);
console.log('Calculated at:', data.calculatedAt);

// Debug: Disable cache invalidation temporarily
// Comment out handler registration to test
```

### "Slow bulk imports"

**Symptom**: CSV import takes too long

**Cause**: Individual events for each reading

**Solution**:
```typescript
// Use createMany (not create in loop)
const readings = csvData.map(row => ({
  userId,
  type: row.type,
  date: row.date,
  amount: row.amount,
}));

await service.createMany(readings); // Emits single BULK_IMPORTED event
```

### "Service not found"

**Symptom**: `getEnergyCrudService is not a function`

**Cause**: Wrong import path

**Solution**:
```typescript
// Correct import
import { getEnergyCrudService } from '@/services';

// NOT this
import { getEnergyCrudService } from '@/services/serviceFactory'; // ❌
```

### "Test failures with 'Cannot find module'"

**Symptom**: Tests fail with module not found errors

**Cause**: Missing reset in test teardown

**Solution**:
```typescript
import { resetServices } from '@/services';

afterEach(() => {
  resetServices();
});
```

## Future Enhancements

### Phase 2+ Planned Features

1. **Async Event Processing**
   ```typescript
   // Handlers run in parallel (non-blocking)
   eventBus.emitAsync(event);
   ```

2. **Event Persistence**
   ```typescript
   // Events stored in database for audit trail
   const events = await eventStore.getEvents(userId, { limit: 100 });
   ```

3. **Event Replay**
   ```typescript
   // Rebuild display data from event history
   await displayService.replayEvents(userId, startDate, endDate);
   ```

4. **Smart Cache Invalidation**
   ```typescript
   // Only invalidate affected years
   await displayService.invalidateYear(userId, type, 2024);
   ```

5. **Webhook Service**
   ```typescript
   // Notify external systems via webhooks
   webhookService.registerWebhook('https://example.com/hook', [
     EnergyEventTypes.CREATED,
     EnergyEventTypes.DELETED,
   ]);
   ```

6. **Notification Service**
   ```typescript
   // Send user notifications
   notificationService.on(EnergyEventTypes.BULK_IMPORTED, async (event) => {
     await sendEmail(event.userId, `Imported ${event.data.count} readings`);
   });
   ```

7. **Analytics Service**
   ```typescript
   // Track usage metrics
   analyticsService.on('*', async (event) => {
     await trackEvent('energy_app', event.eventType, event.userId);
   });
   ```

## Integration with Existing Code

### Current Status (Phase 1)

**Backend Complete:**
- ✅ All services implemented
- ✅ Event system working
- ✅ 99 tests passing, 100% coverage
- ✅ Zero frontend changes

**Not Yet Integrated:**
- ⏳ Server actions still use direct Mongoose
- ⏳ Frontend uses old data flow
- ⏳ Display data cache not used in production

### Next Steps (Phase 2)

**1. Update Server Actions:**
```typescript
// OLD (direct Mongoose)
import Energy from '@/models/Energy';

export async function addEnergyAction(data) {
  const reading = new Energy(data);
  await reading.save();
  return reading;
}

// NEW (use service)
import { getEnergyCrudService } from '@/services';

export async function addEnergyAction(data) {
  const service = getEnergyCrudService();
  return service.create(data);
}
```

**2. Create Display Data Hooks:**
```typescript
// src/app/hooks/useDisplayData.ts

export function useMonthlyChartData(type: EnergyOptions, year: number) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const service = getDisplayDataService();
      const chartData = await service.calculateMonthlyChartData(userId, type, year);
      setData(chartData);
    }
    fetchData();
  }, [type, year]);

  return data;
}
```

**3. Update Components:**
```typescript
// OLD
const { data: readings } = useEnergyData();
const monthlyData = useMemo(() => calculateMonthly(readings), [readings]);

// NEW
const monthlyData = useMonthlyChartData('power', 2024);
// Data pre-calculated and cached - much faster!
```

## Related Documentation

- **Event System**: [src/events/README.md](../events/README.md)
- **Repository Layer**: [src/repositories/README.md](../repositories/README.md)
- **Architecture Design**: [docs/architecture/event-based-repository-design.md](../../docs/architecture/event-based-repository-design.md)
- **Migration Strategy**: [docs/architecture/backend-first-migration-strategy.md](../../docs/architecture/backend-first-migration-strategy.md)

## API Reference

For detailed API documentation with all method signatures, parameters, and return types, see:
- `energy/EnergyCrudService.ts` - Energy CRUD operations
- `display/DisplayDataCalculationService.ts` - Display data calculations
- `handlers/DisplayDataEventHandler.ts` - Event handling logic
- `serviceFactory.ts` - Service management

All classes include comprehensive JSDoc comments with examples.
