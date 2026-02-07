import { describe, it, expect } from 'vitest';
import { calculateDeltas, interpolateValueAtDate } from '../consumption';

describe('Consumption Logic', () => {
  it('calculates deltas correctly between readings', () => {
    const readings = [
      { value: 100, date: new Date('2026-01-01') },
      { value: 150, date: new Date('2026-01-05') },
      { value: 210, date: new Date('2026-01-10') }
    ];
    
    const result = calculateDeltas(readings);
    
    expect(result).toHaveLength(3);
    // Newest first
    expect(result[0].value).toBe(210);
    expect(result[0].delta).toBe(60);
    
    expect(result[1].value).toBe(150);
    expect(result[1].delta).toBe(50);
    
    expect(result[2].value).toBe(100);
    expect(result[2].delta).toBe(0);
  });

  it('handles meter resets gracefully', () => {
    const readings = [
      { value: 6575, date: new Date('2025-07-03') },
      { value: 0, date: new Date('2025-09-17') },
      { value: 426, date: new Date('2026-01-20') }
    ];
    
    const result = calculateDeltas(readings);
    
    // 2026-01-20
    expect(result[0].delta).toBe(426);
    // 2025-09-17 (Reset to 0)
    expect(result[1].delta).toBe(0);
    // 2025-07-03
    expect(result[2].delta).toBe(0);
  });
});

describe('interpolateValueAtDate', () => {
    it('interpolates correctly between two readings', () => {
        const readings = [
            { date: new Date('2025-01-01'), value: 100 },
            { date: new Date('2025-01-11'), value: 200 }
        ];
        const result = interpolateValueAtDate(new Date('2025-01-06'), readings);
        expect(result).toBe(150);
    });

    it('returns exact value if date matches reading', () => {
        const readings = [
            { date: new Date('2025-01-01'), value: 100 },
            { date: new Date('2025-01-11'), value: 200 }
        ];
        const result = interpolateValueAtDate(new Date('2025-01-11'), readings);
        expect(result).toBe(200);
    });

    it('returns null if date is out of range', () => {
        const readings = [
            { date: new Date('2025-01-01'), value: 100 },
            { date: new Date('2025-01-11'), value: 200 }
        ];
        const result = interpolateValueAtDate(new Date('2024-12-31'), readings);
        expect(result).toBeNull();
    });
});
