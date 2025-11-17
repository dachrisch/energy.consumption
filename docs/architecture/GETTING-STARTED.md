# Getting Started with Backend-First Migration

## Quick Start Guide

This document provides immediate next steps for implementing the Backend-First Gradual Migration strategy.

## Architecture Documents Overview

**START HERE**:
1. Read `migration-strategy-comparison.md` - Understand why Backend-First is recommended (5 minutes)
2. Read `backend-first-migration-strategy.md` - Full implementation plan (30 minutes)
3. Use this document - First week action items (start implementing)

**Reference**:
- `event-based-repository-design.md` - Complete technical specification

---

## Why Backend-First?

**TLDR**: Lowest risk approach that allows you to:
- Build complete backend (3 weeks) with ZERO user impact
- Test thoroughly before any frontend changes
- Migrate frontend components ONE AT A TIME
- Instant rollback per component if issues arise

**Risk Level**: VERY LOW (vs HIGH for 4-week plan)

**Success Probability**: 85-95% (vs 30-40% for alternatives)

---

## First Week Action Items

### Monday (Day 1) - Project Setup

**Morning (2-3 hours)**:

```bash
# 1. Create directory structure
mkdir -p src/repositories
mkdir -p src/events
mkdir -p src/events/handlers
mkdir -p src/services
mkdir -p scripts/migrations
mkdir -p tests/integration

# 2. Create placeholder files
touch src/repositories/IEnergyRepository.ts
touch src/repositories/IDisplayDataRepository.ts
touch src/repositories/MongoEnergyRepository.ts
touch src/repositories/MongoDisplayDataRepository.ts

touch src/events/EventBus.ts
touch src/events/EnergyEvents.ts
touch src/events/handlers/index.ts

touch src/services/EnergyCrudService.ts
touch src/services/DisplayDataCalculationService.ts

# 3. Create test structure
mkdir -p src/repositories/__tests__
mkdir -p src/events/__tests__
mkdir -p src/services/__tests__
```

**Afternoon (4-5 hours)**:

1. **Define IEnergyRepository interface**

Create `src/repositories/IEnergyRepository.ts`:

```typescript
import { ISourceEnergyReading } from '@/models/SourceEnergyReading';
import { EnergyOptions } from '@/app/types';

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export interface EnergyFilter {
  userId: string;
  type?: EnergyOptions;
  dateRange?: DateRangeFilter;
}

/**
 * Repository interface for energy readings (source data)
 *
 * This abstracts database access and enables:
 * - Easy testing (mock repository)
 * - Future database migration (PostgreSQL, etc.)
 * - Clean separation of concerns
 */
export interface IEnergyRepository {
  // CREATE
  create(
    userId: string,
    reading: Omit<ISourceEnergyReading, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ISourceEnergyReading>;

  bulkCreate(
    userId: string,
    readings: Array<Omit<ISourceEnergyReading, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ISourceEnergyReading[]>;

  // READ
  findById(userId: string, id: string): Promise<ISourceEnergyReading | null>;
  findAll(filter: EnergyFilter): Promise<ISourceEnergyReading[]>;
  findByDateRange(userId: string, type: EnergyOptions, start: Date, end: Date): Promise<ISourceEnergyReading[]>;
  findByYear(userId: string, type: EnergyOptions, year: number): Promise<ISourceEnergyReading[]>;

  // UPDATE
  update(userId: string, id: string, updates: Partial<ISourceEnergyReading>): Promise<ISourceEnergyReading | null>;

  // DELETE
  delete(userId: string, id: string): Promise<boolean>;

  // UTILITIES
  exists(userId: string, type: EnergyOptions, date: Date): Promise<boolean>;
  getAvailableYears(userId: string, type: EnergyOptions): Promise<number[]>;
  count(filter: EnergyFilter): Promise<number>;
}
```

2. **Define IDisplayDataRepository interface**

Create `src/repositories/IDisplayDataRepository.ts`:

```typescript
import { IChartData, IMonthlyData, IHistogramData } from '@/models/DisplayEnergyData';
import { EnergyOptions } from '@/app/types';

/**
 * Repository interface for display data (pre-calculated aggregations)
 *
 * Display data is derived from source data and cached for performance.
 * This repository handles CRUD operations on materialized views.
 */
export interface IDisplayDataRepository {
  // Chart Data
  upsertChartData(userId: string, type: EnergyOptions, year: number, data: IChartData): Promise<void>;
  getChartData(userId: string, type: EnergyOptions, year: number): Promise<IChartData | null>;

  // Monthly Data
  upsertMonthlyData(userId: string, type: EnergyOptions, year: number, data: IMonthlyData): Promise<void>;
  getMonthlyData(userId: string, type: EnergyOptions, year: number): Promise<IMonthlyData | null>;

  // Histogram Data
  upsertHistogramData(userId: string, type: EnergyOptions, data: IHistogramData): Promise<void>;
  getHistogramData(userId: string, type: EnergyOptions): Promise<IHistogramData | null>;

  // Bulk Operations
  bulkUpsertYearlyData(
    userId: string,
    type: EnergyOptions,
    updates: Array<{ year: number; monthlyData: IMonthlyData; chartData: IChartData }>
  ): Promise<void>;

  // Cleanup
  deleteByUserId(userId: string): Promise<number>;
  deleteByTypeAndYear(userId: string, type: EnergyOptions, year: number): Promise<number>;
}
```

3. **Document interfaces**

Update both files with JSDoc comments explaining:
- Purpose of each method
- Parameters and return types
- Example usage
- When to use each method

**End of Day Checklist**:
- [ ] Directory structure created
- [ ] IEnergyRepository interface complete
- [ ] IDisplayDataRepository interface complete
- [ ] Interfaces documented with JSDoc
- [ ] Git commit: `feat(architecture): add repository interfaces`

---

### Tuesday (Day 2) - Database Models

**Morning (3-4 hours)**:

1. **Create SourceEnergyReading model**

Create `src/models/SourceEnergyReading.ts` (see architecture doc for full code)

**Key points**:
- Apply `applyPreFilter()` for user isolation
- Add compound indexes for performance
- Unique constraint on `{ userId, type, date }`
- Metadata field for source tracking

2. **Create DisplayEnergyData model**

Create `src/models/DisplayEnergyData.ts` (see architecture doc for full code)

**Key points**:
- Polymorphic `data` field (Mixed type)
- Separate indexes for different data types
- Optional `year` field (for monthly/chart data)
- `calculatedAt` timestamp for cache validation

**Afternoon (3-4 hours)**:

3. **Test models with unit tests**

Create `src/models/__tests__/SourceEnergyReading.test.ts`:

```typescript
import { SourceEnergyReading } from '../SourceEnergyReading';
import { connectDB } from '@/lib/mongodb';

describe('SourceEnergyReading Model', () => {
  beforeAll(async () => {
    await connectDB();
  });

  it('should create a reading with valid data', async () => {
    const reading = new SourceEnergyReading({
      userId: 'test-user',
      type: 'power',
      date: new Date('2024-11-01'),
      amount: 12345,
      metadata: { source: 'manual' },
    });

    const saved = await reading.save();
    expect(saved._id).toBeDefined();
    expect(saved.userId).toBe('test-user');
  });

  it('should enforce unique constraint on userId+type+date', async () => {
    // Try to create duplicate
    const reading1 = new SourceEnergyReading({
      userId: 'test-user',
      type: 'power',
      date: new Date('2024-11-01'),
      amount: 12345,
    });

    const reading2 = new SourceEnergyReading({
      userId: 'test-user',
      type: 'power',
      date: new Date('2024-11-01'), // Same date
      amount: 99999, // Different amount
    });

    await reading1.save();
    await expect(reading2.save()).rejects.toThrow(); // Duplicate key error
  });

  it('should validate required fields', async () => {
    const reading = new SourceEnergyReading({
      // Missing userId, type, date, amount
    });

    await expect(reading.save()).rejects.toThrow();
  });
});
```

4. **Test DisplayEnergyData model similarly**

**End of Day Checklist**:
- [ ] SourceEnergyReading model created
- [ ] DisplayEnergyData model created
- [ ] Models have correct indexes
- [ ] Unit tests passing
- [ ] Git commit: `feat(models): add SourceEnergyReading and DisplayEnergyData models`

---

### Wednesday (Day 3) - Repository Implementation

**Full Day (6-8 hours)**:

1. **Implement MongoEnergyRepository**

Create `src/repositories/MongoEnergyRepository.ts` (see architecture doc for full implementation)

**Key methods to implement**:
```typescript
export class MongoEnergyRepository implements IEnergyRepository {
  async create(userId: string, reading: Omit<ISourceEnergyReading, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    // Check duplicates
    const exists = await this.exists(userId, reading.type, reading.date);
    if (exists) throw new Error('Duplicate reading');

    // Create and save
    const doc = new SourceEnergyReading({ ...reading, userId });
    return doc.save();
  }

  async bulkCreate(userId: string, readings: Array<...>) {
    // Filter duplicates
    // Bulk insert with insertMany()
  }

  async findById(userId: string, id: string) {
    // findOne with userId filter
  }

  // ... implement all interface methods
}
```

2. **Write repository tests**

Create `src/repositories/__tests__/MongoEnergyRepository.test.ts`:

```typescript
import { MongoEnergyRepository } from '../MongoEnergyRepository';
import { connectDB } from '@/lib/mongodb';

describe('MongoEnergyRepository', () => {
  let repository: MongoEnergyRepository;

  beforeAll(async () => {
    await connectDB();
    repository = new MongoEnergyRepository();
  });

  describe('create()', () => {
    it('should create a new reading', async () => {
      const reading = await repository.create('user1', {
        type: 'power',
        date: new Date('2024-11-01'),
        amount: 12345,
      });

      expect(reading._id).toBeDefined();
      expect(reading.userId).toBe('user1');
    });

    it('should reject duplicate readings', async () => {
      await repository.create('user1', {
        type: 'power',
        date: new Date('2024-11-02'),
        amount: 12345,
      });

      // Try duplicate
      await expect(
        repository.create('user1', {
          type: 'power',
          date: new Date('2024-11-02'),
          amount: 99999,
        })
      ).rejects.toThrow('Duplicate');
    });
  });

  describe('findByYear()', () => {
    it('should find all readings for a year', async () => {
      // Create test data
      await repository.create('user1', { type: 'power', date: new Date('2024-01-01'), amount: 100 });
      await repository.create('user1', { type: 'power', date: new Date('2024-06-01'), amount: 200 });
      await repository.create('user1', { type: 'power', date: new Date('2025-01-01'), amount: 300 });

      const readings = await repository.findByYear('user1', 'power', 2024);

      expect(readings).toHaveLength(2);
      expect(readings[0].amount).toBe(100);
      expect(readings[1].amount).toBe(200);
    });
  });

  // ... more tests for all methods
});
```

3. **Achieve >80% test coverage**

Run tests:
```bash
npm test -- src/repositories/__tests__/MongoEnergyRepository.test.ts --coverage
```

**End of Day Checklist**:
- [ ] MongoEnergyRepository implemented
- [ ] All interface methods working
- [ ] Unit tests passing
- [ ] Test coverage >80%
- [ ] Git commit: `feat(repositories): implement MongoEnergyRepository`

---

### Thursday (Day 4) - Event System

**Morning (3-4 hours)**:

1. **Define event types**

Create `src/events/EnergyEvents.ts` (see architecture doc for full code)

**Key event types**:
```typescript
export enum EnergyEventType {
  READING_CREATED = 'energy.reading.created',
  READING_UPDATED = 'energy.reading.updated',
  READING_DELETED = 'energy.reading.deleted',
  BULK_READINGS_IMPORTED = 'energy.readings.bulk_imported',
}

export interface BaseEnergyEvent {
  eventId: string;
  eventType: EnergyEventType;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface EnergyReadingCreatedEvent extends BaseEnergyEvent {
  eventType: EnergyEventType.READING_CREATED;
  payload: {
    reading: ISourceEnergyReading;
    affectedYears: number[];
  };
}

// ... other event types
```

2. **Implement EventBus**

Create `src/events/EventBus.ts`:

```typescript
import { EventEmitter } from 'events';
import { EnergyEvent, EnergyEventType } from './EnergyEvents';

class EventBus {
  private emitter: EventEmitter;
  private static instance: EventBus;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async emit(event: EnergyEvent): Promise<void> {
    console.log(`[EventBus] Emitting: ${event.eventType}`);
    this.emitter.emit(event.eventType, event);
    this.emitter.emit('*', event); // Wildcard listeners
  }

  on(eventType: EnergyEventType | '*', handler: (event: EnergyEvent) => Promise<void> | void): void {
    this.emitter.on(eventType, async (event: EnergyEvent) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${eventType}:`, error);
      }
    });
  }

  // ... once, off, removeAllListeners methods
}

export const eventBus = EventBus.getInstance();
```

**Afternoon (3-4 hours)**:

3. **Test EventBus**

Create `src/events/__tests__/EventBus.test.ts`:

```typescript
import { eventBus } from '../EventBus';
import { EnergyEventType, EnergyReadingCreatedEvent } from '../EnergyEvents';
import { v4 as uuidv4 } from 'uuid';

describe('EventBus', () => {
  it('should emit and handle events', async () => {
    const handler = jest.fn();

    eventBus.on(EnergyEventType.READING_CREATED, handler);

    const event: EnergyReadingCreatedEvent = {
      eventId: uuidv4(),
      eventType: EnergyEventType.READING_CREATED,
      userId: 'user1',
      timestamp: new Date(),
      payload: {
        reading: {} as any,
        affectedYears: [2024],
      },
    };

    await eventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should call wildcard listeners', async () => {
    const wildcardHandler = jest.fn();

    eventBus.on('*', wildcardHandler);

    const event = {
      eventId: uuidv4(),
      eventType: EnergyEventType.READING_UPDATED,
      userId: 'user1',
      timestamp: new Date(),
      payload: {},
    };

    await eventBus.emit(event);

    expect(wildcardHandler).toHaveBeenCalled();
  });
});
```

4. **Create event handler registration**

Create `src/events/handlers/index.ts`:

```typescript
import { eventBus } from '../EventBus';
import { EnergyEventType } from '../EnergyEvents';

// Handlers will be created next week
// import { handleEnergyReadingCreated } from './EnergyReadingCreatedHandler';

export function registerEventHandlers(): void {
  console.log('[EventHandlers] Registering event handlers...');

  // eventBus.on(EnergyEventType.READING_CREATED, handleEnergyReadingCreated);
  // eventBus.on(EnergyEventType.READING_UPDATED, handleEnergyReadingUpdated);
  // ... other handlers

  // Global logger
  eventBus.on('*', async (event) => {
    console.log(`[EventLog] ${event.eventType} - User: ${event.userId}`);
  });

  console.log('[EventHandlers] Registration complete');
}
```

**End of Day Checklist**:
- [ ] Event types defined
- [ ] EventBus implemented
- [ ] EventBus tests passing
- [ ] Handler registration system ready
- [ ] Git commit: `feat(events): add EventBus and event type definitions`

---

### Friday (Day 5) - Migration Scripts & Week Review

**Morning (3-4 hours)**:

1. **Create migration script for collections**

Create `scripts/migrations/001_create_display_collection.ts`:

```typescript
import mongoose from 'mongoose';
import { SourceEnergyReading } from '@/models/SourceEnergyReading';
import { DisplayEnergyData } from '@/models/DisplayEnergyData';
import Energy from '@/models/Energy'; // Old model
import { connectDB } from '@/lib/mongodb';

export async function up() {
  await connectDB();

  console.log('Migration 001: Creating display_energy_data collection...');

  // 1. Rename existing Energy collection (if needed)
  const collections = await mongoose.connection.db.listCollections().toArray();
  const hasEnergyCollection = collections.some(c => c.name === 'energies');

  if (hasEnergyCollection) {
    console.log('  Renaming energies → source_energy_readings...');
    await mongoose.connection.db.renameCollection('energies', 'source_energy_readings');
  }

  // 2. Create display_energy_data collection
  console.log('  Creating display_energy_data collection...');
  await mongoose.connection.db.createCollection('display_energy_data');

  // 3. Add metadata to source readings
  console.log('  Adding metadata to source readings...');
  await SourceEnergyReading.updateMany(
    { metadata: { $exists: false } },
    { $set: { metadata: { source: 'manual' } } }
  );

  // 4. Create indexes
  console.log('  Creating indexes...');
  await SourceEnergyReading.createIndexes();
  await DisplayEnergyData.createIndexes();

  console.log('Migration 001 completed successfully!');
}

export async function down() {
  await connectDB();

  console.log('Rolling back migration 001...');

  // Rename back
  await mongoose.connection.db.renameCollection('source_energy_readings', 'energies');

  // Drop display collection
  await mongoose.connection.db.dropCollection('display_energy_data');

  console.log('Rollback completed!');
}

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
```

2. **Test migration in development**

```bash
# Run migration
npm run build
node dist/scripts/migrations/001_create_display_collection.js

# Verify collections created
mongosh
> use energy_consumption
> show collections
# Should show: source_energy_readings, display_energy_data
```

**Afternoon (2-3 hours)**:

3. **Week 1 review and planning**

Create `docs/progress/week1-review.md`:

```markdown
# Week 1 Progress Review

## Completed

- [x] Repository interfaces defined (IEnergyRepository, IDisplayDataRepository)
- [x] Database models created (SourceEnergyReading, DisplayEnergyData)
- [x] MongoEnergyRepository implemented
- [x] Event system foundation (EventBus, event types)
- [x] Migration script for collections
- [x] Unit tests for models and repositories (>80% coverage)

## Metrics

- **Code Coverage**: X% (repositories), Y% (models)
- **Tests Written**: Z tests
- **Lines of Code**: ~XXX lines
- **User Impact**: ZERO (no frontend changes)

## Blockers

- None

## Next Week Plan

**Week 2 Goals**:
- Implement MongoDisplayDataRepository
- Implement DisplayDataCalculationService
- Create event handlers (Created, Updated, Deleted)
- Write backfill migration script
- Integration tests for event flow

**Estimated Completion**: End of Week 2

## Risks

- None identified
- Architecture is sound and well-tested

## Notes

- Backend development proceeding smoothly
- No user-visible changes (as planned)
- Ready for Week 2 implementation
```

4. **Git cleanup and commit**

```bash
# Ensure all tests pass
npm test

# Create week 1 tag
git add .
git commit -m "feat(architecture): complete Week 1 - repository layer and event system foundation

- Add repository interfaces (IEnergyRepository, IDisplayDataRepository)
- Implement SourceEnergyReading and DisplayEnergyData models
- Implement MongoEnergyRepository with full CRUD operations
- Add EventBus and event type definitions
- Create migration script for new collections
- Achieve >80% test coverage on repositories and models

Co-Authored-By: Claude <noreply@anthropic.com>
🤖 Generated with [Claude Code](https://claude.com/claude-code)"

git tag week1-complete
git push origin main --tags
```

**End of Week Checklist**:
- [ ] Migration script tested
- [ ] Week 1 review documented
- [ ] All tests passing
- [ ] Git committed and tagged
- [ ] Ready for Week 2

---

## Week 1 Success Criteria

At the end of Week 1, you should have:

1. **Repository Layer**:
   - [x] Interfaces defined and documented
   - [x] MongoEnergyRepository fully implemented
   - [x] >80% test coverage

2. **Database Models**:
   - [x] SourceEnergyReading model with indexes
   - [x] DisplayEnergyData model with indexes
   - [x] Models tested and validated

3. **Event System**:
   - [x] EventBus singleton implemented
   - [x] Event types defined
   - [x] Handler registration system ready

4. **Migration**:
   - [x] Collection migration script created
   - [x] Tested in development environment
   - [x] Rollback script working

5. **Testing**:
   - [x] Unit tests for repositories
   - [x] Unit tests for models
   - [x] Unit tests for EventBus
   - [x] All tests passing

6. **Documentation**:
   - [x] Week 1 progress documented
   - [x] Code well-commented
   - [x] Git history clean

7. **User Impact**:
   - [x] ZERO (no frontend changes)
   - [x] Production system unaffected

---

## Week 2 Preview

**Goals**:
- Implement MongoDisplayDataRepository
- Implement event handlers
- Create DisplayDataCalculationService
- Write backfill migration script
- Integration tests for complete event flow

**Estimated Duration**: 5 days (40 hours)

**User Impact**: Still ZERO (backend only)

---

## Troubleshooting

### Common Issues

**Issue**: Migration script fails with "collection already exists"

**Solution**:
```bash
# Drop existing collections manually
mongosh
> use energy_consumption
> db.display_energy_data.drop()
> exit

# Re-run migration
node dist/scripts/migrations/001_create_display_collection.js
```

---

**Issue**: Tests fail with "Cannot connect to MongoDB"

**Solution**:
```bash
# Ensure MongoDB is running
sudo systemctl status mongod

# Start if not running
sudo systemctl start mongod

# Check connection string in .env
cat .env | grep MONGODB_URI
```

---

**Issue**: TypeScript errors in tests

**Solution**:
```bash
# Install missing types
npm install --save-dev @types/jest @types/node

# Rebuild
npm run build
```

---

## Getting Help

**Documentation**:
- `backend-first-migration-strategy.md` - Full migration guide
- `migration-strategy-comparison.md` - Why this approach
- `event-based-repository-design.md` - Technical specification

**Code Examples**:
- See architecture documents for complete code samples
- All TypeScript types and interfaces provided
- Test examples included

**Questions?**
- Review the architecture documents first
- Check troubleshooting section above
- All implementation details are documented

---

## Next Steps

After completing Week 1:

1. **Review progress** against checklist above
2. **Ensure all tests passing** before Week 2
3. **Read Week 2 section** in `backend-first-migration-strategy.md`
4. **Start Monday of Week 2** with MongoDisplayDataRepository implementation

**Remember**: You're on the LOWEST RISK path. Take time to do it right.

---

## Document Metadata

**Version**: 1.0
**Created**: 2025-11-17
**Author**: Claude Code
**Next Review**: End of Week 1
**Status**: Ready to Start
