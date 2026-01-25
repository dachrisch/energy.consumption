import { describe, it, expect } from 'vitest';
import { calculateDeltas } from '../consumption';

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
});
