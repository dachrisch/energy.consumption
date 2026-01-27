export interface Reading {
  value: number;
  date: Date;
}

export interface ReadingWithDelta extends Reading {
  delta: number;
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
 * Handles meter resets by treating negative deltas as 0 (or optionally rollover logic).
 */
export function calculateDeltas(readings: Reading[]): ReadingWithDelta[] {
  if (readings.length === 0) {return [];}
  
  // Sort by date ascending to calculate deltas forward
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const result: ReadingWithDelta[] = sorted.map((r, i) => {
    const prev = sorted[i - 1];
    // Use Math.max(0, ...) to handle resets/swaps/typos gracefully
    const delta = prev ? Math.max(0, r.value - prev.value) : 0;
    return {
      ...r,
      delta
    };
  });
  
  // Return descending (newest first) for UI
  return result.sort((a, b) => b.date.getTime() - a.date.getTime());
}