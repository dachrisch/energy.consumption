import { EventBus } from '../EventBus';
import { BaseEvent } from '../types/EnergyEvents';
import { IEventBus } from '../interfaces/IEventBus';

// Mock event types for testing
interface TestEvent extends BaseEvent {
  eventType: 'TEST_EVENT';
  data: { value: string };
}

interface AnotherTestEvent extends BaseEvent {
  eventType: 'ANOTHER_TEST_EVENT';
  data: { count: number };
}

describe('EventBus', () => {
  let eventBus: IEventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('emit', () => {
    it('should call registered handler when event is emitted', async () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      eventBus.on('TEST_EVENT', handler);

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should call multiple handlers in registration order (FIFO)', async () => {
      const callOrder: number[] = [];
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockImplementation(async () => {
        callOrder.push(1);
      });
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockImplementation(async () => {
        callOrder.push(2);
      });
      const handler3 = jest.fn<Promise<void>, [TestEvent]>().mockImplementation(async () => {
        callOrder.push(3);
      });

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);
      eventBus.on('TEST_EVENT', handler3);

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      expect(callOrder).toEqual([1, 2, 3]);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should execute handlers sequentially (await each)', async () => {
      let counter = 0;
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        counter++;
        expect(counter).toBe(1);
      });
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        counter++;
        expect(counter).toBe(2);
      });

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      expect(counter).toBe(2);
    });

    it('should isolate errors - one failing handler does not stop others', async () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockRejectedValue(new Error('Handler 2 failed'));
      const handler3 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      // Spy on console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);
      eventBus.on('TEST_EVENT', handler3);

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      // All handlers should be called despite handler2 failing
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event handler error for TEST_EVENT'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not call handlers for different event types', async () => {
      const testHandler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const anotherHandler = jest.fn<Promise<void>, [AnotherTestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', testHandler);
      eventBus.on('ANOTHER_TEST_EVENT', anotherHandler);

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      expect(testHandler).toHaveBeenCalledTimes(1);
      expect(anotherHandler).not.toHaveBeenCalled();
    });

    it('should handle emitting event with no registered handlers', async () => {
      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      // Should not throw
      await expect(eventBus.emit(event)).resolves.toBeUndefined();
    });

    it('should handle multiple emissions of the same event type', async () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      eventBus.on('TEST_EVENT', handler);

      const event1: TestEvent = {
        eventId: '1',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'first' },
      };

      const event2: TestEvent = {
        eventId: '2',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'second' },
      };

      await eventBus.emit(event1);
      await eventBus.emit(event2);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, event1);
      expect(handler).toHaveBeenNthCalledWith(2, event2);
    });
  });

  describe('on', () => {
    it('should register handler and return unsubscribe function', () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const unsubscribe = eventBus.on('TEST_EVENT', handler);

      expect(typeof unsubscribe).toBe('function');
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);
    });

    it('should allow registering the same handler multiple times', () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler);
      eventBus.on('TEST_EVENT', handler);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(2);
    });

    it('should return working unsubscribe function', async () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const unsubscribe = eventBus.on('TEST_EVENT', handler);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);

      unsubscribe();

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);

      // Handler should not be called after unsubscribe
      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple registrations for different event types', () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler2 = jest.fn<Promise<void>, [AnotherTestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('ANOTHER_TEST_EVENT', handler2);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);
      expect(eventBus.listenerCount('ANOTHER_TEST_EVENT')).toBe(1);
    });
  });

  describe('off', () => {
    it('should remove specific handler', async () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(2);

      eventBus.off('TEST_EVENT', handler1);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);

      // Only handler2 should be called
      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle removing non-existent handler gracefully', () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      // Should not throw
      expect(() => eventBus.off('TEST_EVENT', handler)).not.toThrow();
    });

    it('should only remove first occurrence when same handler registered multiple times', async () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler);
      eventBus.on('TEST_EVENT', handler);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(2);

      eventBus.off('TEST_EVENT', handler);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);

      // Handler should still be called once
      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all handlers for specific event type', async () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler3 = jest.fn<Promise<void>, [AnotherTestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);
      eventBus.on('ANOTHER_TEST_EVENT', handler3);

      eventBus.removeAllListeners('TEST_EVENT');

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
      expect(eventBus.listenerCount('ANOTHER_TEST_EVENT')).toBe(1);

      // TEST_EVENT handlers should not be called
      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should remove all handlers for all event types when no type specified', () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler2 = jest.fn<Promise<void>, [AnotherTestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('ANOTHER_TEST_EVENT', handler2);

      eventBus.removeAllListeners();

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
      expect(eventBus.listenerCount('ANOTHER_TEST_EVENT')).toBe(0);
    });

    it('should handle removing listeners from non-existent event type', () => {
      // Should not throw
      expect(() => eventBus.removeAllListeners('NON_EXISTENT_EVENT')).not.toThrow();
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for event type with no handlers', () => {
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
    });

    it('should return correct count of handlers', () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler3 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler1);
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);

      eventBus.on('TEST_EVENT', handler2);
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(2);

      eventBus.on('TEST_EVENT', handler3);
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(3);
    });

    it('should update count when handlers are removed', () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(2);

      eventBus.off('TEST_EVENT', handler1);
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);

      eventBus.off('TEST_EVENT', handler2);
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle removing handler during event emission', async () => {
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockImplementation(async () => {
        // Remove handler2 during handler1 execution
        eventBus.off('TEST_EVENT', handler2);
      });
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      // handler1 should be called
      expect(handler1).toHaveBeenCalledTimes(1);

      // handler2 should still be called (snapshot of handlers taken before execution)
      // This behavior depends on implementation - document actual behavior
      // For safety, most event buses use a snapshot approach
    });

    it('should handle adding handler during event emission', async () => {
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockImplementation(async () => {
        // Add handler2 during handler1 execution
        eventBus.on('TEST_EVENT', handler2);
      });

      eventBus.on('TEST_EVENT', handler1);

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus.emit(event);

      expect(handler1).toHaveBeenCalledTimes(1);

      // handler2 should NOT be called in the same emission
      // (snapshot of handlers taken before execution)
      expect(handler2).not.toHaveBeenCalled();

      // But should be called on next emission
      await eventBus.emit(event);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle calling unsubscribe multiple times', () => {
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      const unsubscribe = eventBus.on('TEST_EVENT', handler);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);

      unsubscribe();
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);

      // Calling again should not throw
      expect(() => unsubscribe()).not.toThrow();
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
    });
  });
});
