# Event System Documentation

## Overview

The event system provides an event-driven architecture for the energy consumption application. It enables loose coupling between components through a publish-subscribe pattern, allowing automatic reactions to data changes.

## Architecture

### Key Components

1. **EventBus** (`EventBus.ts`)
   - Core event dispatcher
   - In-memory implementation
   - Synchronous event processing (handlers execute sequentially)
   - Error isolation (one failing handler doesn't stop others)

2. **Event Types** (`types/EnergyEvents.ts`)
   - Type-safe event definitions
   - All events extend `BaseEvent`
   - Discriminated union types for compile-time safety

3. **Event Factory** (`factories/EnergyEventFactory.ts`)
   - Factory methods for creating events
   - Automatic eventId and timestamp generation
   - Type-safe event creation

4. **Singleton Instance** (`eventBusInstance.ts`)
   - Shared EventBus across application
   - `getEventBus()` - Get singleton instance
   - `resetEventBus()` - Reset for testing

## Event Types

### Energy Reading Events

#### ENERGY_READING_CREATED
Emitted when a new energy reading is created.

```typescript
{
  eventId: string;
  eventType: 'ENERGY_READING_CREATED';
  timestamp: Date;
  userId: string;
  data: SourceEnergyReading;
  metadata?: Record<string, unknown>;
}
```

#### ENERGY_READING_UPDATED
Emitted when an energy reading is updated.

```typescript
{
  eventId: string;
  eventType: 'ENERGY_READING_UPDATED';
  timestamp: Date;
  userId: string;
  data: {
    before: SourceEnergyReading;
    after: SourceEnergyReading;
  };
  metadata?: Record<string, unknown>;
}
```

#### ENERGY_READING_DELETED
Emitted when an energy reading is deleted.

```typescript
{
  eventId: string;
  eventType: 'ENERGY_READING_DELETED';
  timestamp: Date;
  userId: string;
  data: {
    id: string;
    reading: SourceEnergyReading;
  };
  metadata?: Record<string, unknown>;
}
```

#### ENERGY_READINGS_BULK_IMPORTED
Emitted when multiple readings are imported in bulk (e.g., CSV import).

```typescript
{
  eventId: string;
  eventType: 'ENERGY_READINGS_BULK_IMPORTED';
  timestamp: Date;
  userId: string;
  data: {
    readings: SourceEnergyReading[];
    count: number;
  };
  metadata?: Record<string, unknown>;
}
```

## Usage Examples

### Basic Usage

```typescript
import { getEventBus, EnergyEventFactory, EnergyEventTypes } from '@/events';

// Get the singleton EventBus
const eventBus = getEventBus();

// Register a handler
const unsubscribe = eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  console.log('New reading created:', event.data);
  // Perform side effects (e.g., invalidate cache, update display data)
});

// Create and emit an event
const reading = { /* SourceEnergyReading */ };
const event = EnergyEventFactory.createCreatedEvent(reading);
await eventBus.emit(event);

// Unsubscribe when done
unsubscribe();
```

### Multiple Handlers

```typescript
import { getEventBus, EnergyEventTypes } from '@/events';

const eventBus = getEventBus();

// Register multiple handlers for the same event
eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  // Handler 1: Invalidate cache
  await invalidateCache(event.userId);
});

eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  // Handler 2: Update display data
  await recalculateDisplayData(event.userId);
});

eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  // Handler 3: Log analytics
  await logAnalytics('reading_created', event);
});

// All handlers execute in registration order (FIFO)
```

### Error Handling

```typescript
import { getEventBus, EnergyEventTypes } from '@/events';

const eventBus = getEventBus();

eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  // This handler throws an error
  throw new Error('Oops!');
});

eventBus.on(EnergyEventTypes.CREATED, async (event) => {
  // This handler still executes (error isolation)
  console.log('I still run!');
});

// Emit event - errors are logged but don't stop other handlers
await eventBus.emit(event);
```

### Using Factory Methods

```typescript
import { EnergyEventFactory } from '@/events';

// Create event for new reading
const createdEvent = EnergyEventFactory.createCreatedEvent(
  reading,
  { source: 'manual-entry' } // optional metadata
);

// Create event for updated reading
const updatedEvent = EnergyEventFactory.createUpdatedEvent(
  beforeReading,
  afterReading,
  { reason: 'correction' }
);

// Create event for deleted reading
const deletedEvent = EnergyEventFactory.createDeletedEvent(
  reading,
  { deletedBy: 'admin' }
);

// Create event for bulk import
const bulkEvent = EnergyEventFactory.createBulkImportedEvent(
  readings,
  userId,
  { source: 'csv', filename: 'readings.csv' }
);
```

### Testing with EventBus

```typescript
import { getEventBus, resetEventBus, EnergyEventTypes } from '@/events';

describe('MyFeature', () => {
  afterEach(() => {
    // Reset EventBus between tests
    resetEventBus();
  });

  it('should handle energy reading created', async () => {
    const eventBus = getEventBus();
    const handler = jest.fn();

    eventBus.on(EnergyEventTypes.CREATED, handler);

    // Emit event
    await eventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });
});
```

## Design Decisions

### Synchronous Processing
Events are processed synchronously (handlers execute sequentially). This ensures:
- Predictable execution order
- Data consistency (all side effects complete before next event)
- Easier debugging and testing

### Error Isolation
If one handler throws an error:
- Error is logged to console
- Other handlers continue executing
- Event emission completes successfully

This prevents one failing handler from breaking the entire system.

### In-Memory Only (Phase 1)
Current implementation uses in-memory storage only:
- No event persistence
- Events lost on server restart
- Sufficient for Phase 1 (repository layer)

Future phases may add event persistence for audit logging and replay capabilities.

### FIFO Handler Execution
Handlers execute in registration order (First-In-First-Out):
- Predictable behavior
- Allows handler dependencies
- Easy to reason about

### Singleton Pattern
Single EventBus instance shared across application:
- Consistent event routing
- Easy access from anywhere
- Testable (resetEventBus for clean state)

## Performance Characteristics

- **Handler Registration**: O(1)
- **Handler Removal**: O(n) where n = handlers for event type
- **Event Emission**: O(h) where h = number of handlers
- **Memory**: O(t × h) where t = event types, h = average handlers per type

## Testing

### Test Coverage
- **EventBus**: 100% coverage (23 tests)
- **EnergyEventFactory**: 100% coverage (27 tests)
- **eventBusInstance**: 100% coverage (10 tests)
- **Total**: 60 tests, 100% coverage

### Running Tests

```bash
# Run all event tests
npm test -- src/events

# Run with coverage
npm test -- src/events --coverage --collectCoverageFrom='src/events/**/*.ts'

# Run specific test file
npm test -- src/events/__tests__/EventBus.test.ts
```

## Future Enhancements (Phase 2+)

1. **Event Persistence**
   - Store events in database
   - Event replay capability
   - Audit logging

2. **Event Middleware**
   - Pre/post-processing hooks
   - Event validation
   - Performance monitoring

3. **Async Processing**
   - Optional parallel handler execution
   - Queue-based event processing
   - Event batching

4. **Dead Letter Queue**
   - Handle permanently failing events
   - Retry mechanisms
   - Error recovery

## Integration Points

### Phase 1 (Current)
- Independent infrastructure
- No integration yet

### Phase 2 (Service Layer)
- EnergyService emits events on CRUD operations
- DisplayDataService listens for events to invalidate cache

### Phase 3 (Migration)
- Replace direct repository calls with service calls
- Automatic display data recalculation via events

## Best Practices

1. **Always use factory methods** to create events
2. **Handle errors gracefully** in event handlers
3. **Keep handlers focused** - one responsibility per handler
4. **Use metadata** for debugging information
5. **Test event handlers** in isolation
6. **Reset EventBus** in test teardown
7. **Document event purpose** and expected side effects

## API Reference

See JSDoc comments in source files for detailed API documentation:
- `EventBus.ts` - EventBus implementation
- `IEventBus.ts` - EventBus interface
- `EnergyEvents.ts` - Event type definitions
- `EnergyEventFactory.ts` - Event factory methods
- `eventBusInstance.ts` - Singleton access
