import { describe, it, expect } from 'vitest';
import { calculateIntervalCost, Contract } from '../pricing';

describe('Pricing Library - Interval Cost', () => {
  const contracts: Contract[] = [
    {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-06-30'),
      basePrice: 10, // 10 EUR / month
      workingPrice: 0.30 // 0.30 EUR / kWh
    },
    {
      startDate: new Date('2023-07-01'),
      endDate: new Date('2023-12-31'),
      basePrice: 12, // 12 EUR / month
      workingPrice: 0.35 // 0.35 EUR / kWh
    }
  ];

  it('calculates cost for a period within a single contract', () => {
    // 30 days, 100 kWh
    // months = 30 / 30.44 = ~0.9855
    // fixed = 10 * 0.9855 = 9.855
    // variable = 0.30 * 100 = 30
    // total = 39.855
    const cost = calculateIntervalCost(new Date('2023-02-01'), new Date('2023-03-03'), 100, contracts);
    expect(cost).toBeCloseTo(39.855, 2);
  });

  it('calculates cost spanning multiple contracts', () => {
    // Interval: June 16 to July 15 (30 days total)
    // 15 days in Contract 1 (June 16-30)
    // 15 days in Contract 2 (July 1-15)
    // Total consumption: 100 kWh -> 50 kWh each part
    
    // Part 1 (Contract 1):
    // months = 15 / 30.44 = ~0.4928
    // fixed = 10 * 0.4928 = 4.928
    // variable = 0.30 * 50 = 15
    // total1 = 19.928
    
    // Part 2 (Contract 2):
    // months = 15 / 30.44 = ~0.4928
    // fixed = 12 * 0.4928 = 5.9136
    // variable = 0.35 * 50 = 17.5
    // total2 = 23.4136
    
    // Total = 19.928 + 23.4136 = 43.3416
    const cost = calculateIntervalCost(new Date('2023-06-16'), new Date('2023-07-16'), 100, contracts);
    expect(cost).toBeCloseTo(43.34, 2);
  });

  it('handles partial coverage (gaps)', () => {
    // Interval: 2022-12-21 to 2023-01-10 (20 days)
    // Contracts start at 2023-01-01
    // 10 days uncovered (2022-12-21 to 12-31)
    // 10 days covered by Contract 1 (2023-01-01 to 01-10)
    // Total 100 kWh -> 50 kWh attributed to covered part
    
    // Covered Part:
    // months = 10 / 30.44 = 0.3285
    // fixed = 10 * 0.3285 = 3.285
    // variable = 0.30 * 50 = 15
    // total = 18.285
    
    const cost = calculateIntervalCost(new Date('2022-12-22'), new Date('2023-01-11'), 100, contracts);
    expect(cost).toBeCloseTo(18.285, 2);
  });
});
