import type { ReadingKind } from '../types/models';

export interface Reading {
  value: number;
  date: Date;
  kind?: ReadingKind;
}

export interface ReadingWithDelta extends Reading {
  delta: number;
  anomaly?: 'decrease';
  isFirst: boolean;
}

export function calculateDailyAverage(readings: Reading[]): number {
  if (readings.length < 2) {return 0;}

  // We use the sum of all positive deltas to handle meter resets/swaps
  const deltas = calculateDeltas(readings);
  const totalConsumption = deltas.reduce((sum, r) => sum + r.delta, 0);

  // Sort to find the total time span
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const msDiff = last.date.getTime() - first.date.getTime();
  const days = msDiff / (1000 * 60 * 60 * 24);
  
  return days > 0 ? totalConsumption / days : 0;
}

export function calculateStats(readings: Reading[]) {
  const dailyAverage = calculateDailyAverage(readings);
  const yearlyProjection = dailyAverage * 365.25;
  
  return {
    dailyAverage,
    yearlyProjection
  };
}

/**
 * Calculates deltas for a list of readings.
 * Assumes readings are for the same meter.
 * Returns readings in descending order (newest first).
 * Starts a new segment at meter changes and flags unexpected decreases.
 */
export function calculateDeltas(readings: Reading[]): ReadingWithDelta[] {
  if (readings.length === 0) {return [];}
  
  // Sort by date ascending to calculate deltas forward
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const result: ReadingWithDelta[] = sorted.map((r, i) => {
    const prev = sorted[i - 1];
    const difference = prev ? r.value - prev.value : 0;
    const isMeterChange = r.kind === 'meterChange';
    const anomaly = prev && !isMeterChange && difference < 0 ? 'decrease' as const : undefined;
    return {
      ...r,
      delta: prev && !isMeterChange && difference > 0 ? difference : 0,
      anomaly,
      isFirst: !prev
    };
  });
  
    
  
    // Return descending (newest first) for UI
  
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  }

function splitIntoMeterSegments(readings: Reading[]): Reading[][] {
  const segments: Reading[][] = [];
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const reading of sorted) {
    if (segments.length === 0 || reading.kind === 'meterChange') {
      segments.push([]);
    }
    segments[segments.length - 1].push(reading);
  }
  return segments;
}

function calculateSegmentConsumption(segment: Reading[], startDate: Date, endDate: Date): number {
  const inRange = segment.filter(reading => reading.date >= startDate && reading.date <= endDate);
  const startValue = interpolateValueAtDate(startDate, segment);
  const endValue = interpolateValueAtDate(endDate, segment);
  const sequence: Reading[] = [];
  if (startValue !== null) {
    sequence.push({ date: startDate, value: startValue });
  }
  sequence.push(...inRange);
  if (endValue !== null) {
    sequence.push({ date: endDate, value: endValue });
  }
  return calculateDeltas(sequence).reduce((sum, reading) => sum + reading.delta, 0);
}

/** Calculates known consumption in a range, summing each physical meter segment. */
export function calculateConsumptionBetween(readings: Reading[], startDate: Date, endDate: Date): number {
  return splitIntoMeterSegments(readings).reduce(
    (total, segment) => total + calculateSegmentConsumption(segment, startDate, endDate),
    0
  );
}
  
  function findSurroundingReadings(targetTime: number, readings: Reading[]) {
  
  
  
    let before: Reading | null = null;
  
  
  
    let after: Reading | null = null;
  
  
  
    
  
  
  
    for (const r of readings) {
  
  
  
      const time = r.date.getTime();
  
  
  
      if (time < targetTime) {
  
  
  
        if (!before || time > before.date.getTime()) {
  
  
  
          before = r;
  
  
  
        }
  
  
  
      } else if (time > targetTime) {
  
  
  
        if (!after || time < after.date.getTime()) {
  
  
  
          after = r;
  
  
  
        }
  
  
  
      }
  
  
  
    }
  
  
  
    return { before, after };
  
  
  
  }
  
  
  
  
  
  
  
  export function interpolateValueAtDate(targetDate: Date, readings: Reading[]): number | null {
  
  
  
    if (readings.length < 2) {
  
  
  
      return null;
  
  
  
    }
  
  
  
    const targetTime = targetDate.getTime();
  
  
  
    const exactMatch = readings.find(r => r.date.getTime() === targetTime);
  
  
  
    if (exactMatch) {
  
  
  
      return exactMatch.value;
  
  
  
    }
  
  
  
    
  
  
  
    const { before, after } = findSurroundingReadings(targetTime, readings);
  
  
  
    if (!before || !after) {
  
  
  
      return null;
  
  
  
    }
  
  
  
    
  
  
  
    if (after.kind === 'meterChange') {
      return null;
    }

    const timeDiff = after.date.getTime() - before.date.getTime();
  
  
  
    const valueDiff = after.value - before.value;
  
  
  
    const targetOffset = targetTime - before.date.getTime();
  
  
  
    
  
  
  
    return before.value + (valueDiff * (targetOffset / timeDiff));
  
  
  
  }
  
  
  
  
  
  
  
  
  
  