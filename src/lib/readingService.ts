interface BulkImportResult {
  successCount: number;
  skippedCount: number;
  errors: Array<{ index: number, message: string }>;
}

export async function processBulkReadings(readings: any[], userId: string, MeterModel: any, ReadingModel: any): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    successCount: 0,
    skippedCount: 0,
    errors: []
  };

  const validReadingsToInsert: any[] = [];
  
  // Cache owned meter IDs for fast lookup
  // In a real DB scenario, we might want to batch this or just check inclusion if list is small.
  // Assuming user doesn't have thousands of meters.
  const ownedMeters = await MeterModel.find({ userId });
  const ownedMeterIds = new Set(ownedMeters.map((m: any) => m._id.toString()));

  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    
    // 1. Validate Meter Ownership
    if (!ownedMeterIds.has(reading.meterId)) {
      result.errors.push({ index: i, message: `Meter not found or not owned: ${reading.meterId}` });
      continue;
    }

    // 2. Check for Duplicate (Meter + Date)
    // We check against DB. Optimization: could fetch all existing dates for this meter if feasible,
    // but individual checks are safer for correctness unless optimized carefully.
    // Given the "bulk" nature, maybe verify existence 1-by-1 or via a complex $or query.
    // For now, 1-by-1 check is acceptable for typical user import sizes (~hundreds).
    const existing = await ReadingModel.find({
        meterId: reading.meterId,
        date: reading.date,
        userId: userId // redundant if meter check passed, but good for safety
    });

    if (existing.length > 0) {
      result.skippedCount++;
      continue;
    }

    validReadingsToInsert.push({ ...reading, userId });
  }

  if (validReadingsToInsert.length > 0) {
    await ReadingModel.insertMany(validReadingsToInsert);
    result.successCount = validReadingsToInsert.length;
  }

  return result;
}