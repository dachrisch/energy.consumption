import { describe, it, expect } from 'vitest';
import { calculateAggregates } from '../aggregates';

describe('calculateAggregates', () => {
  it('should return zeros when no data is provided', () => {
    const result = calculateAggregates([], [], []);
    expect(result.totalYearlyCost).toBe(0);
    expect(result.powerYearlyCost).toBe(0);
    expect(result.gasYearlyCost).toBe(0);
  });

  it('should correctly aggregate power and gas costs', () => {
    const meters = [
      { _id: 'm1', type: 'power', name: 'Power Meter' },
      { _id: 'm2', type: 'gas', name: 'Gas Meter' }
    ];

    const readings = [
      { meterId: 'm1', value: 100, date: new Date('2024-01-01') },
      { meterId: 'm1', value: 200, date: new Date('2024-01-11') }, // 100 units in 10 days = 10 units/day
      { meterId: 'm2', value: 50, date: new Date('2024-01-01') },
      { meterId: 'm2', value: 100, date: new Date('2024-01-21') } // 50 units in 20 days = 2.5 units/day
    ];

    const contracts = [
      { 
        meterId: 'm1', 
        type: 'power', 
        startDate: new Date('2024-01-01'), 
        basePrice: 10, 
        workingPrice: 0.3 
      },
      { 
        meterId: 'm2', 
        type: 'gas', 
        startDate: new Date('2024-01-01'), 
        basePrice: 5, 
        workingPrice: 0.8 
      }
    ];

    // Power: 10 units/day * 365.25 = 3652.5 units/year
    // Power Cost: (10 * 12) + (0.3 * 3652.5) = 120 + 1095.75 = 1215.75
    
    // Gas: 2.5 units/day * 365.25 = 913.125 units/year
    // Gas Cost: (5 * 12) + (0.8 * 913.125) = 60 + 730.5 = 790.5

    // Total: 1215.75 + 790.5 = 2006.25

    const result = calculateAggregates(meters as any, readings as any, contracts as any);
    
    expect(result.powerYearlyCost).toBeCloseTo(1215.7, 1);
    expect(result.gasYearlyCost).toBeCloseTo(790.5, 1);
    expect(result.totalYearlyCost).toBeCloseTo(2006.2, 1);
  });
});
