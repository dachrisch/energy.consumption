import { calculateStats } from './consumption';
import { findContractForDate, calculateCostForContract } from './pricing';
import { IMeter, IReading, IContract } from '../types/models';

export interface AggregateResult {
  totalYearlyCost: number;
  powerYearlyCost: number;
  gasYearlyCost: number;
}

export function calculateAggregates(
  meters: IMeter[],
  readings: IReading[],
  contracts: IContract[]
): AggregateResult {
  let powerYearlyCost = 0;
  let gasYearlyCost = 0;

  for (const meter of meters) {
    const meterReadings = readings
      .filter((r) => r.meterId.toString() === meter._id.toString())
      .map((r) => ({
        value: r.value,
        date: new Date(r.date)
      }));

    if (meterReadings.length < 2) {continue;}

    const stats = calculateStats(meterReadings);
    const meterContracts = contracts.filter(
      (c) => c.meterId.toString() === meter._id.toString()
    );
    const activeContract = findContractForDate(meterContracts as any, new Date());

    if (activeContract) {
      const estimatedYearlyCost = calculateCostForContract({
        consumption: stats.yearlyProjection,
        days: 365.25,
        contract: activeContract as any
      });

      if (meter.type === 'power') {
        powerYearlyCost += estimatedYearlyCost;
      } else if (meter.type === 'gas') {
        gasYearlyCost += estimatedYearlyCost;
      }
    }
  }

  return {
    totalYearlyCost: powerYearlyCost + gasYearlyCost,
    powerYearlyCost,
    gasYearlyCost
  };
}
