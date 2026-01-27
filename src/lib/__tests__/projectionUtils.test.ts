import { describe, it, expect } from 'vitest';
import { calculateProjection } from '../projectionUtils';

describe('Projection Utilities', () => {
  it('extrapolates consumption correctly based on last two readings', () => {
    const readings = [
      { date: new Date(2023, 0, 1), value: 100 },
      { date: new Date(2023, 0, 11), value: 110 } // 10 units in 10 days = 1 unit/day
    ];

    const projection = calculateProjection(readings, 30); // Project 30 days
    
    expect(projection).toHaveLength(31); // Start point + 30 days
    expect(projection[0].date).toEqual(new Date(2023, 0, 11));
    expect(projection[0].value).toBe(110);
    
    // Day 1 of projection (Jan 12)
    expect(projection[1].date).toEqual(new Date(2023, 0, 12));
    expect(projection[1].value).toBe(111);
    
    // Day 30 of projection (Feb 10)
    expect(projection[30].date).toEqual(new Date(2023, 1, 10));
    expect(projection[30].value).toBe(140);
  });

  it('returns empty array if less than 2 readings', () => {
    expect(calculateProjection([{ date: new Date(), value: 100 }], 365)).toHaveLength(0);
  });
});
