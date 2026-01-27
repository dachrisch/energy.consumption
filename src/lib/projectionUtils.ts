export function calculateProjection(readings: any[], days: number): any[] {
  if (readings.length < 2) {return [];}

  // Sort by date ascending
  const sorted = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  
  const lastDate = new Date(last.date);
  const prevDate = new Date(prev.date);
  
  const intervalMs = lastDate.getTime() - prevDate.getTime();
  const intervalDays = intervalMs / (1000 * 60 * 60 * 24);
  
  if (intervalDays <= 0) {return [];}
  
  const velocity = (last.value - prev.value) / intervalDays;
  
  const projection = [];
  // Include the last reading as start point
  projection.push({
    date: new Date(lastDate),
    value: last.value
  });

  for (let i = 1; i <= days; i++) {
    const projectedDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
    projection.push({
      date: projectedDate,
      value: last.value + (velocity * i)
    });
  }

  return projection;
}
