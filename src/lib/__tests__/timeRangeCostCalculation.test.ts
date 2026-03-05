import { describe, it, expect } from 'vitest';
import { calculateConsumptionInRange, TimeRangeReading } from '../timeRangeCostCalculation';

describe('calculateConsumptionInRange', () => {
  it('sums consumption across a meter reset within the range', () => {
    // Readings: 0→500 kWh (500 consumed), then reset to 0, then 0→200 (200 consumed)
    // Total expected: 700 kWh
    const allReadings: TimeRangeReading[] = [
      { date: new Date('2025-01-01'), value: 0 },
      { date: new Date('2025-04-01'), value: 500 },   // +500
      { date: new Date('2025-04-02'), value: 0 },     // reset (ignored)
      { date: new Date('2025-07-01'), value: 200 },   // +200
    ];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-07-01');
    const rangeReadings = allReadings; // all within range

    const consumption = calculateConsumptionInRange(rangeReadings, startDate, endDate, allReadings);

    expect(consumption).toBeCloseTo(700, 1);
  });

  it('extrapolates from daily average when range is entirely beyond all readings', () => {
    // Readings from Jan 1 to Feb 1 (31 days), 310 kWh consumed → 10 kWh/day average
    const allReadings: TimeRangeReading[] = [
      { date: new Date('2025-01-01'), value: 1000 },
      { date: new Date('2025-02-01'), value: 1310 },
    ];

    // Range: March 1–11 (10 days) — entirely after last reading
    const startDate = new Date('2025-03-01');
    const endDate = new Date('2025-03-11');

    const consumption = calculateConsumptionInRange([], startDate, endDate, allReadings);

    // 10 kWh/day × 10 days = 100 kWh
    expect(consumption).toBeCloseTo(100, 1);
  });
});
