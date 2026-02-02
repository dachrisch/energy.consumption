import { IReading, IMeter } from '../types/models';
import { Model } from 'mongoose';

interface BulkImportResult {
  successCount: number;
  skippedCount: number;
  errors: Array<{ index: number, message: string }>;
}

export async function processBulkReadings(
  readings: Partial<IReading>[], 
  userId: string, 
  MeterModel: Model<IMeter>, 
  ReadingModel: Model<IReading>
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    successCount: 0,
    skippedCount: 0,
    errors: []
  };

  const validReadingsToInsert: Partial<IReading>[] = [];
  
  const ownedMeters = await MeterModel.find({ userId: { $eq: userId } });
  const ownedMeterIds = new Set(ownedMeters.map((m) => m._id.toString()));

  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    
    // 1. Validate Meter Ownership
    if (!reading.meterId || !ownedMeterIds.has(reading.meterId)) {
      result.errors.push({ index: i, message: `Meter not found or not owned: ${reading.meterId}` });
      continue;
    }

    // 2. Check for Duplicate (Meter + Date)
    // We check against DB. Optimization: could fetch all existing dates for this meter if feasible,
    // but individual checks are safer for correctness unless optimized carefully.
    // Given the "bulk" nature, maybe verify existence 1-by-1 or via a complex $or query.
    // For now, 1-by-1 check is acceptable for typical user import sizes (~hundreds).
    const existing = await ReadingModel.find({
        meterId: { $eq: reading.meterId },
        date: { $eq: reading.date },
        userId: { $eq: userId } // redundant if meter check passed, but good for safety
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