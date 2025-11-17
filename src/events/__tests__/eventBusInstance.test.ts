import { getEventBus, resetEventBus } from '../eventBusInstance';
import { BaseEvent } from '../types/EnergyEvents';

interface TestEvent extends BaseEvent {
  eventType: 'TEST_EVENT';
  data: { value: string };
}

describe('eventBusInstance', () => {
  afterEach(() => {
    resetEventBus();
  });

  describe('getEventBus', () => {
    it('should return an EventBus instance', () => {
      const eventBus = getEventBus();

      expect(eventBus).toBeDefined();
      expect(typeof eventBus.emit).toBe('function');
      expect(typeof eventBus.on).toBe('function');
      expect(typeof eventBus.off).toBe('function');
      expect(typeof eventBus.removeAllListeners).toBe('function');
      expect(typeof eventBus.listenerCount).toBe('function');
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      const eventBus1 = getEventBus();
      const eventBus2 = getEventBus();

      expect(eventBus1).toBe(eventBus2);
    });

    it('should maintain state across calls', async () => {
      const eventBus1 = getEventBus();
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus1.on('TEST_EVENT', handler);

      const eventBus2 = getEventBus();

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus2.emit(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should persist handlers registered on first instance', () => {
      const eventBus1 = getEventBus();
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus1.on('TEST_EVENT', handler);

      expect(eventBus1.listenerCount('TEST_EVENT')).toBe(1);

      const eventBus2 = getEventBus();

      expect(eventBus2.listenerCount('TEST_EVENT')).toBe(1);
    });
  });

  describe('resetEventBus', () => {
    it('should clear all listeners when reset', () => {
      const eventBus = getEventBus();
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus.on('TEST_EVENT', handler);

      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);

      resetEventBus();

      const newEventBus = getEventBus();

      expect(newEventBus.listenerCount('TEST_EVENT')).toBe(0);
    });

    it('should create new instance after reset', () => {
      const eventBus1 = getEventBus();

      resetEventBus();

      const eventBus2 = getEventBus();

      // Should be a new instance (different object reference)
      expect(eventBus1).not.toBe(eventBus2);
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        resetEventBus();
        resetEventBus();
        resetEventBus();
      }).not.toThrow();
    });

    it('should not throw when called before any getEventBus call', () => {
      expect(() => {
        resetEventBus();
      }).not.toThrow();
    });

    it('should clear listeners before creating new instance', async () => {
      const eventBus1 = getEventBus();
      const handler = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);

      eventBus1.on('TEST_EVENT', handler);

      resetEventBus();

      const eventBus2 = getEventBus();

      const event: TestEvent = {
        eventId: '123',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'test' },
      };

      await eventBus2.emit(event);

      // Old handler should not be called
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should work correctly across multiple reset cycles', async () => {
      // First cycle
      const eventBus1 = getEventBus();
      const handler1 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      eventBus1.on('TEST_EVENT', handler1);

      const event: TestEvent = {
        eventId: '1',
        eventType: 'TEST_EVENT',
        timestamp: new Date(),
        userId: 'user1',
        data: { value: 'first' },
      };

      await eventBus1.emit(event);
      expect(handler1).toHaveBeenCalledTimes(1);

      // Reset
      resetEventBus();

      // Second cycle
      const eventBus2 = getEventBus();
      const handler2 = jest.fn<Promise<void>, [TestEvent]>().mockResolvedValue(undefined);
      eventBus2.on('TEST_EVENT', handler2);

      await eventBus2.emit(event);
      expect(handler1).toHaveBeenCalledTimes(1); // Still 1 (not called again)
      expect(handler2).toHaveBeenCalledTimes(1);

      // Reset again
      resetEventBus();

      // Third cycle
      const eventBus3 = getEventBus();
      expect(eventBus3.listenerCount('TEST_EVENT')).toBe(0);
    });
  });
});
