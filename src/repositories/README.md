# Repository Layer Documentation

## Overview

The repository layer provides an abstraction over database operations, implementing the **Repository Pattern** to decouple business logic from data persistence concerns. This layer sits between the service layer and the database, providing a clean, testable interface for data access.

## What is the Repository Pattern?

The Repository Pattern is a design pattern that:
- **Abstracts data access** - Business logic doesn't know if data comes from MongoDB, PostgreSQL, or an API
- **Centralizes data logic** - All database queries in one place
- **Improves testability** - Easy to mock repositories in tests
- **Enables database migration** - Switch databases without changing business logic
- **Enforces data isolation** - User data security built into every query

## Architecture

### Layer Position

```
┌─────────────────────────────────────────────────┐
│           Frontend Components                    │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│           Server Actions                         │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│           Service Layer                          │
│  (Business logic + event emission)               │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│        REPOSITORY LAYER ← YOU ARE HERE           │
│  (Data access abstraction)                       │
│                                                   │
│  ┌──────────────────┐    ┌───────────────────┐  │
│  │ IEnergyRepository│    │IDisplayDataRepo   │  │
│  │  (Interface)     │    │  (Interface)      │  │
│  └────────┬─────────┘    └────────┬──────────┘  │
│           │                       │              │
│  ┌────────▼─────────┐    ┌────────▼──────────┐  │
│  │MongoEnergyRepo   │    │MongoDisplayDataRepo│ │
│  │(Implementation)  │    │(Implementation)   │  │
│  └──────────────────┘    └───────────────────┘  │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│           Database Layer                         │
│  (MongoDB collections)                           │
│  - SourceEnergyReading                           │
│  - DisplayEnergyData                             │
└──────────────────────────────────────────────────┘
```

### Key Components

1. **Interfaces** (`interfaces/`)
   - `IEnergyRepository` - Contract for energy data operations
   - `IDisplayDataRepository` - Contract for display data operations

2. **Implementations** (`mongodb/`)
   - `MongoEnergyRepository` - MongoDB implementation for energy data
   - `MongoDisplayDataRepository` - MongoDB implementation for display data

3. **Models** (in `src/models/`)
   - `SourceEnergyReading` - Raw meter readings (source of truth)
   - `DisplayEnergyData` - Pre-calculated aggregations (cache)

## Interfaces

### IEnergyRepository

Defines operations for energy reading data (source data).

**Location**: `interfaces/IEnergyRepository.ts`

#### Methods

**CREATE Operations:**
```typescript
create(reading: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>): Promise<SourceEnergyReading>
```
Create a single energy reading.

```typescript
createMany(readings: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<SourceEnergyReading[]>
```
Create multiple readings in bulk (optimized for CSV imports).

**READ Operations:**
```typescript
findById(id: string, userId: string): Promise<SourceEnergyReading | null>
```
Find a single reading by ID (with user isolation).

```typescript
findAll(userId: string, filters?: EnergyFilters): Promise<SourceEnergyReading[]>
```
Find all readings for a user with optional filtering, sorting, pagination.

```typescript
findByDateRange(userId: string, startDate: Date, endDate: Date, type?: EnergyOptions): Promise<SourceEnergyReading[]>
```
Find readings within a date range.

```typescript
count(userId: string, filters?: EnergyFilters): Promise<number>
```
Count readings matching filters.

```typescript
getMinMaxDates(userId: string, type?: EnergyOptions): Promise<{ min: Date; max: Date } | null>
```
Get minimum and maximum dates for readings (useful for timeline slider).

**UPDATE Operations:**
```typescript
update(id: string, userId: string, data: Partial<SourceEnergyReading>): Promise<SourceEnergyReading | null>
```
Update a single reading.

**DELETE Operations:**
```typescript
delete(id: string, userId: string): Promise<boolean>
```
Delete a single reading.

```typescript
deleteMany(ids: string[], userId: string): Promise<number>
```
Delete multiple readings (returns count deleted).

### IDisplayDataRepository

Defines operations for display data (pre-calculated cache).

**Location**: `interfaces/IDisplayDataRepository.ts`

#### Methods

**Monthly Chart Data:**
```typescript
upsertMonthlyChartData(userId: string, type: EnergyOptions, year: number, data: MonthlyChartData): Promise<void>
```
Insert or update monthly chart data for a year.

```typescript
getMonthlyChartData(userId: string, type: EnergyOptions, year: number): Promise<MonthlyChartData | null>
```
Retrieve monthly chart data for a year.

**Histogram Data:**
```typescript
upsertHistogramData(userId: string, type: EnergyOptions, data: HistogramData): Promise<void>
```
Insert or update histogram data.

```typescript
getHistogramData(userId: string, type: EnergyOptions): Promise<HistogramData | null>
```
Retrieve histogram data.

**Table Data:**
```typescript
upsertTableData(userId: string, type: EnergyOptions, data: TableData): Promise<void>
```
Insert or update table data.

```typescript
getTableData(userId: string, type: EnergyOptions): Promise<TableData | null>
```
Retrieve table data.

**Bulk Operations:**
```typescript
invalidateAllForUser(userId: string): Promise<number>
```
Delete all display data for a user (returns count deleted).

## Implementations

### MongoEnergyRepository

MongoDB implementation of `IEnergyRepository`.

**Location**: `mongodb/MongoEnergyRepository.ts`

#### Key Features

1. **User Data Isolation**
   - Every query filters by `userId`
   - Enforced at repository level (double protection with Mongoose middleware)
   - No cross-user data leaks

2. **Duplicate Detection**
   - Unique constraint on `{userId, type, date}`
   - Prevents duplicate readings for same date

3. **Optimized Queries**
   - Indexes on frequently queried fields
   - Efficient date range queries
   - Pagination support

4. **Error Handling**
   - Graceful handling of duplicate key errors
   - Null returns for not-found cases
   - Throws errors for validation failures

#### Usage Examples

**Create a reading:**
```typescript
import { MongoEnergyRepository } from '@/repositories/mongodb/MongoEnergyRepository';

const repository = new MongoEnergyRepository();

const reading = await repository.create({
  userId: 'user123',
  type: 'power',
  date: new Date('2024-11-17'),
  amount: 12345.67,
});

console.log('Created:', reading._id);
```

**Find readings in date range:**
```typescript
const readings = await repository.findByDateRange(
  'user123',
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  'power'
);

console.log(`Found ${readings.length} power readings`);
```

**Bulk import from CSV:**
```typescript
const csvData = [
  { userId: 'user123', type: 'power', date: new Date('2024-01-01'), amount: 10000 },
  { userId: 'user123', type: 'power', date: new Date('2024-02-01'), amount: 10150 },
  { userId: 'user123', type: 'power', date: new Date('2024-03-01'), amount: 10300 },
];

const created = await repository.createMany(csvData);
console.log(`Imported ${created.length} readings`);
```

**Update a reading:**
```typescript
const updated = await repository.update('reading-id-123', 'user123', {
  amount: 12500, // Corrected value
});

if (updated) {
  console.log('Updated successfully');
} else {
  console.log('Reading not found');
}
```

**Delete readings:**
```typescript
// Delete single
const deleted = await repository.delete('reading-id-123', 'user123');

// Delete multiple
const count = await repository.deleteMany(['id1', 'id2', 'id3'], 'user123');
console.log(`Deleted ${count} readings`);
```

**Get date range for timeline:**
```typescript
const dateRange = await repository.getMinMaxDates('user123', 'power');

if (dateRange) {
  console.log(`Data available from ${dateRange.min} to ${dateRange.max}`);
}
```

### MongoDisplayDataRepository

MongoDB implementation of `IDisplayDataRepository`.

**Location**: `mongodb/MongoDisplayDataRepository.ts`

#### Key Features

1. **Pre-Calculated Cache**
   - Stores pre-computed aggregations
   - Fast reads (no calculation needed)
   - Automatic invalidation via events

2. **Data Types**
   - Monthly chart data (12 months, meter readings + consumption)
   - Histogram data (measurement distribution over time)
   - Table data (paginated, sorted readings)

3. **Cache Validation**
   - SHA256 hash of source data
   - Tracks calculation timestamp
   - Metadata for debugging

4. **Upsert Pattern**
   - Insert if not exists, update if exists
   - Atomic operations
   - No race conditions

#### Usage Examples

**Store monthly chart data:**
```typescript
import { MongoDisplayDataRepository } from '@/repositories/mongodb/MongoDisplayDataRepository';

const repository = new MongoDisplayDataRepository();

const monthlyData = {
  months: [
    { month: 1, monthLabel: 'Jan', meterReading: 10000, consumption: 150, isActual: true },
    { month: 2, monthLabel: 'Feb', meterReading: 10150, consumption: 150, isActual: true },
    // ... 10 more months
  ],
  sourceDataHash: 'abc123...', // SHA256 hash
  calculatedAt: new Date(),
  metadata: { sourceCount: 365, calculationTimeMs: 12 },
};

await repository.upsertMonthlyChartData('user123', 'power', 2024, monthlyData);
```

**Retrieve monthly chart data:**
```typescript
const chartData = await repository.getMonthlyChartData('user123', 'power', 2024);

if (chartData) {
  console.log(`Chart has ${chartData.months.length} months`);
  console.log(`Calculated at: ${chartData.calculatedAt}`);
} else {
  console.log('No data - needs calculation');
}
```

**Store histogram data:**
```typescript
const histogramData = {
  buckets: [
    { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-10'), count: 3 },
    { startDate: new Date('2024-01-11'), endDate: new Date('2024-01-20'), count: 5 },
    // ... more buckets
  ],
  dateRange: { min: new Date('2024-01-01'), max: new Date('2024-12-31') },
  maxCount: 10,
  sourceDataHash: 'def456...',
  calculatedAt: new Date(),
};

await repository.upsertHistogramData('user123', 'power', histogramData);
```

**Invalidate all cache for user:**
```typescript
// When user deletes account or requests data reset
const deletedCount = await repository.invalidateAllForUser('user123');
console.log(`Invalidated ${deletedCount} cached items`);
```

## Data Models

### SourceEnergyReading

Raw meter readings - the single source of truth.

**Location**: `src/models/SourceEnergyReading.ts`

**Schema:**
```typescript
{
  _id: string;              // Auto-generated MongoDB ID
  userId: string;           // User who owns this reading (indexed)
  type: 'power' | 'gas';    // Energy type (indexed)
  date: Date;               // Reading date (indexed)
  amount: number;           // Meter reading in kWh or m³
  createdAt: Date;          // Auto-generated timestamp
  updatedAt: Date;          // Auto-generated timestamp
}
```

**Indexes:**
- `{ userId: 1, type: 1, date: 1 }` (unique) - Prevents duplicates
- `{ userId: 1, date: 1 }` - Fast user queries
- `{ userId: 1, type: 1 }` - Type filtering

**Constraints:**
- `amount >= 0` - Meter readings cannot be negative
- `userId` required and references User collection
- `type` must be 'power' or 'gas'

### DisplayEnergyData

Pre-calculated display data - cache for performance.

**Location**: `src/models/DisplayEnergyData.ts`

**Schema:**
```typescript
{
  _id: string;                    // Auto-generated MongoDB ID
  userId: string;                 // User who owns this data (indexed)
  type: 'power' | 'gas';          // Energy type (indexed)
  displayType: string;            // 'monthly-chart' | 'histogram' | 'table'
  year?: number;                  // For yearly data (indexed)
  data: object;                   // Polymorphic - varies by displayType
  sourceDataHash: string;         // SHA256 hash for cache validation
  calculatedAt: Date;             // When this was calculated
  metadata?: object;              // Debug info (sourceCount, calculationTime, etc.)
  createdAt: Date;                // Auto-generated timestamp
  updatedAt: Date;                // Auto-generated timestamp
}
```

**Indexes:**
- `{ userId: 1, type: 1, displayType: 1, year: 1 }` (unique) - Fast lookups
- `{ userId: 1, displayType: 1 }` - Type queries
- `{ calculatedAt: 1 }` - Cache expiration cleanup

**Data Types:**

**Monthly Chart Data:**
```typescript
{
  months: Array<{
    month: number;           // 1-12
    monthLabel: string;      // 'Jan', 'Feb', etc.
    meterReading: number | null;
    consumption: number | null;
    isActual: boolean;       // True if actual reading
    isInterpolated: boolean; // True if calculated via interpolation
    isExtrapolated: boolean; // True if calculated via extrapolation
    isDerived: boolean;      // True if consumption is derived
  }>;
  sourceDataHash: string;
  calculatedAt: Date;
  metadata?: {
    sourceCount: number;
    calculationTimeMs: number;
  };
}
```

**Histogram Data:**
```typescript
{
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
  sourceDataHash: string;
  calculatedAt: Date;
}
```

## User Data Isolation

### Security Enforcement

User data isolation is enforced at **TWO levels**:

1. **Repository Level** (explicit)
   - Every method requires `userId` parameter
   - All queries filter by `userId`
   - Impossible to query cross-user data

2. **Mongoose Middleware Level** (implicit)
   - `applyPreFilter()` automatically adds `userId` filter
   - Applied to all find/update/delete queries
   - Backup security layer

### Example: Double Protection

```typescript
// Repository query
const readings = await repository.findAll('user123', { type: 'power' });

// Internally:
// 1. Repository adds: { userId: 'user123', type: 'power' }
// 2. Mongoose middleware adds: { userId: 'user123' }
// 3. Final query: { userId: 'user123', type: 'power' }
```

Even if repository is bypassed, Mongoose middleware prevents cross-user access.

### Testing User Isolation

All 62 repository tests include user isolation verification:

```typescript
it('should not find readings from other users', async () => {
  // Create reading for user1
  await repository.create({ userId: 'user1', type: 'power', date: new Date(), amount: 100 });

  // Try to find as user2
  const readings = await repository.findAll('user2');

  expect(readings).toHaveLength(0); // Cannot see user1's data
});
```

## Testing

### Test Organization

```
src/repositories/
├── __tests__/
│   ├── MongoEnergyRepository.test.ts       (32 tests)
│   └── MongoDisplayDataRepository.test.ts  (30 tests)
├── interfaces/
│   ├── IEnergyRepository.ts
│   └── IDisplayDataRepository.ts
└── mongodb/
    ├── MongoEnergyRepository.ts
    └── MongoDisplayDataRepository.ts
```

### Running Tests

**All repository tests:**
```bash
npm test -- src/repositories
```

**With coverage:**
```bash
npm test -- src/repositories --coverage --collectCoverageFrom='src/repositories/**/*.ts'
```

**Specific test file:**
```bash
npm test -- src/repositories/__tests__/MongoEnergyRepository.test.ts
```

**Watch mode (for development):**
```bash
npm test -- src/repositories --watch
```

### Test Coverage

**Current Coverage**: 98.27%

| Category | Coverage |
|----------|----------|
| Statements | 98.27% |
| Branches | 95.45% |
| Functions | 100% |
| Lines | 98.27% |

### Testing Strategy

1. **Unit Tests**
   - Test each method in isolation
   - Mock database when needed
   - Test error cases

2. **Integration Tests**
   - Test against real MongoDB (test database)
   - Verify indexes work correctly
   - Test transaction behavior

3. **User Isolation Tests**
   - Verify no cross-user data leaks
   - Test with multiple users
   - Edge cases (empty userId, null, undefined)

4. **Error Handling Tests**
   - Duplicate key errors
   - Validation errors
   - Not found cases
   - Database connection errors

### Example Test

```typescript
import { MongoEnergyRepository } from '../mongodb/MongoEnergyRepository';
import { connectDB } from '@/lib/mongodb';

describe('MongoEnergyRepository', () => {
  let repository: MongoEnergyRepository;

  beforeAll(async () => {
    await connectDB();
    repository = new MongoEnergyRepository();
  });

  describe('create()', () => {
    it('should create a new reading', async () => {
      const reading = await repository.create({
        userId: 'test-user',
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 12345,
      });

      expect(reading._id).toBeDefined();
      expect(reading.userId).toBe('test-user');
      expect(reading.amount).toBe(12345);
    });

    it('should reject duplicate readings', async () => {
      await repository.create({
        userId: 'test-user',
        type: 'power',
        date: new Date('2024-11-18'),
        amount: 100,
      });

      // Try to create duplicate
      await expect(
        repository.create({
          userId: 'test-user',
          type: 'power',
          date: new Date('2024-11-18'), // Same date
          amount: 200,
        })
      ).rejects.toThrow();
    });

    it('should enforce user isolation', async () => {
      await repository.create({
        userId: 'user1',
        type: 'power',
        date: new Date('2024-11-19'),
        amount: 100,
      });

      const readings = await repository.findAll('user2');
      expect(readings).toHaveLength(0);
    });
  });
});
```

## Best Practices

### 1. Always Use Repositories

**DO:**
```typescript
// In service layer
import { MongoEnergyRepository } from '@/repositories/mongodb/MongoEnergyRepository';

const repository = new MongoEnergyRepository();
const readings = await repository.findAll(userId);
```

**DON'T:**
```typescript
// Direct Mongoose model access (bypasses abstraction)
import Energy from '@/models/Energy';

const readings = await Energy.find({ userId }); // ❌ Don't do this
```

### 2. Inject Repositories via Constructor

**DO:**
```typescript
export class EnergyService {
  constructor(private repository: IEnergyRepository) {}

  async getReadings(userId: string) {
    return this.repository.findAll(userId);
  }
}
```

**DON'T:**
```typescript
export class EnergyService {
  async getReadings(userId: string) {
    const repository = new MongoEnergyRepository(); // ❌ Hard-coded dependency
    return repository.findAll(userId);
  }
}
```

### 3. Use Interfaces for Type Safety

**DO:**
```typescript
function processReadings(repository: IEnergyRepository) {
  // Works with any implementation
}
```

**DON'T:**
```typescript
function processReadings(repository: MongoEnergyRepository) {
  // Tightly coupled to MongoDB
}
```

### 4. Always Include userId

**DO:**
```typescript
const readings = await repository.findAll(userId, { type: 'power' });
```

**DON'T:**
```typescript
// Missing userId (would fail to compile)
const readings = await repository.findAll({ type: 'power' }); // ❌
```

### 5. Handle Not Found Cases

**DO:**
```typescript
const reading = await repository.findById(id, userId);

if (!reading) {
  throw new NotFoundError('Reading not found');
}

// Use reading safely
```

**DON'T:**
```typescript
const reading = await repository.findById(id, userId);
const amount = reading.amount; // ❌ Might be null
```

### 6. Use Bulk Operations for Performance

**DO:**
```typescript
// Single database call
const created = await repository.createMany(readings);
```

**DON'T:**
```typescript
// Multiple database calls (slow)
for (const reading of readings) {
  await repository.create(reading); // ❌ N+1 queries
}
```

### 7. Test with Real Database

**DO:**
```typescript
beforeAll(async () => {
  await connectDB(); // Real MongoDB connection
});

it('should work with real database', async () => {
  const reading = await repository.create(data);
  expect(reading._id).toBeDefined();
});
```

**DON'T:**
```typescript
// Mock everything (integration tests need real DB)
jest.mock('@/models/SourceEnergyReading'); // ❌ Too much mocking
```

## Performance Considerations

### Indexing Strategy

All repositories leverage MongoDB indexes for optimal performance:

**SourceEnergyReading Indexes:**
- Primary: `{ userId: 1, type: 1, date: 1 }` (unique)
- Secondary: `{ userId: 1, date: 1 }`
- Tertiary: `{ userId: 1, type: 1 }`

**DisplayEnergyData Indexes:**
- Primary: `{ userId: 1, type: 1, displayType: 1, year: 1 }` (unique)
- Secondary: `{ userId: 1, displayType: 1 }`
- Cache expiration: `{ calculatedAt: 1 }`

### Query Optimization

1. **Date Range Queries**
   - Use `$gte` and `$lte` operators
   - Index on `date` field enables fast range scans

2. **Pagination**
   - Use `skip()` and `limit()`
   - Sort on indexed fields only

3. **Bulk Operations**
   - Use `insertMany()` instead of multiple `insert()`
   - Use `bulkWrite()` for mixed operations

### Performance Benchmarks

**Target Performance** (measured in tests):
- `create()`: <10ms
- `findAll()`: <50ms (100 records)
- `findByDateRange()`: <30ms (1 year of data)
- `createMany()`: <100ms (100 records)
- `getMonthlyChartData()`: <5ms (cache hit)

## Troubleshooting

### Common Issues

#### "Duplicate Key Error"

**Cause**: Trying to create reading with same userId + type + date

**Solution**:
```typescript
try {
  await repository.create(reading);
} catch (error) {
  if (error.code === 11000) {
    console.log('Duplicate reading - already exists');
  }
}
```

#### "Cannot read property of null"

**Cause**: Not checking for null return from `findById()`

**Solution**:
```typescript
const reading = await repository.findById(id, userId);

if (!reading) {
  throw new NotFoundError('Reading not found');
}

// Now safe to use
console.log(reading.amount);
```

#### "No readings found for user"

**Cause**: Missing userId filter or wrong userId

**Solution**:
```typescript
// Always pass correct userId
const readings = await repository.findAll(userId);

// Debug: Check userId is correct
console.log('Querying for userId:', userId);
```

#### "Slow queries"

**Cause**: Missing indexes or inefficient query

**Solution**:
```typescript
// 1. Check indexes exist
// 2. Use date range instead of full scan
const readings = await repository.findByDateRange(
  userId,
  startDate,
  endDate,
  'power'
);

// 3. Add pagination for large results
const readings = await repository.findAll(userId, {
  limit: 100,
  offset: 0,
});
```

## Migration Guide

### From Direct Mongoose to Repository

**Before:**
```typescript
import Energy from '@/models/Energy';

export async function getEnergyReadings(userId: string) {
  return Energy.find({ userId, type: 'power' }).sort({ date: -1 }).limit(100);
}
```

**After:**
```typescript
import { MongoEnergyRepository } from '@/repositories/mongodb/MongoEnergyRepository';

export async function getEnergyReadings(userId: string) {
  const repository = new MongoEnergyRepository();
  return repository.findAll(userId, {
    type: 'power',
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 100,
  });
}
```

**Benefits:**
- Type-safe filters
- Consistent API across services
- Easy to test (mock repository)
- Can switch database later

## Future Enhancements

### Phase 2+ Planned Features

1. **Transaction Support**
   ```typescript
   await repository.withTransaction(async (session) => {
     await repository.create(reading, { session });
     await repository.update(otherId, userId, data, { session });
   });
   ```

2. **Soft Deletes**
   ```typescript
   await repository.softDelete(id, userId); // Sets deletedAt instead of removing
   ```

3. **Optimistic Locking**
   ```typescript
   await repository.update(id, userId, data, { version: 5 }); // Fails if version mismatch
   ```

4. **Query Builder**
   ```typescript
   const query = repository.query()
     .where('type', 'power')
     .whereBetween('date', [start, end])
     .orderBy('date', 'desc')
     .limit(100);

   const results = await query.execute();
   ```

5. **PostgreSQL Implementation**
   ```typescript
   import { PostgresEnergyRepository } from '@/repositories/postgres/PostgresEnergyRepository';

   // Same interface, different database
   const repository = new PostgresEnergyRepository();
   ```

## Related Documentation

- **Event System**: [src/events/README.md](../events/README.md)
- **Service Layer**: [src/services/README.md](../services/README.md)
- **Architecture Design**: [docs/architecture/event-based-repository-design.md](../../docs/architecture/event-based-repository-design.md)
- **Migration Strategy**: [docs/architecture/backend-first-migration-strategy.md](../../docs/architecture/backend-first-migration-strategy.md)

## API Reference

For detailed API documentation with all method signatures, parameters, and return types, see:
- `interfaces/IEnergyRepository.ts` - Complete energy repository API
- `interfaces/IDisplayDataRepository.ts` - Complete display data repository API

All interfaces include comprehensive JSDoc comments with examples.
