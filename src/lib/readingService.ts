import { IReading, IMeter, IContract } from '../types/models';
import { Model } from 'mongoose';

interface BulkImportResult {
  successCount: number;
  skippedCount: number;
  errors: Array<{ index: number, message: string }>;
}

/**
 * Processes a full unified import including meters, readings, and contracts.
 */
export async function processUnifiedImport(
  backupData: any,
  userId: string,
  MeterModel: Model<IMeter>,
  ReadingModel: Model<IReading>,
  ContractModel: Model<IContract>
): Promise<BulkImportResult & { metersCreated: number; contractsCreated: number }> {
  const { data } = backupData;
  const result = {
    successCount: 0,
    skippedCount: 0,
    metersCreated: 0,
    contractsCreated: 0,
    errors: [] as Array<{ index: number, message: string }>
  };

  const meterIdMap = new Map<string, string>();

  // 1. Import Meters
  if (Array.isArray(data.meters)) {
    for (let i = 0; i < data.meters.length; i++) {
      const mData = data.meters[i];
      try {
        let meter = await MeterModel.findOne({ 
          meterNumber: { $eq: mData.meterNumber },
          userId: { $eq: userId }
        });

        if (!meter) {
          meter = await MeterModel.create({
            name: mData.name,
            meterNumber: mData.meterNumber,
            type: mData.type,
            unit: mData.unit,
            userId
          });
          result.metersCreated++;
        }
        meterIdMap.set(mData.id, meter._id.toString());
      } catch (err) {
        result.errors.push({ index: i, message: `Failed to import meter ${mData.name}: ${err instanceof Error ? err.message : 'Unknown error'}` });
      }
    }
  }

  // 2. Import Readings
  if (Array.isArray(data.readings)) {
    const readingsToInsert: Partial<IReading>[] = [];
    for (let i = 0; i < data.readings.length; i++) {
      const rData = data.readings[i];
      const newMeterId = meterIdMap.get(rData.meterId);
      
      if (!newMeterId) continue;

      try {
        const existing = await ReadingModel.findOne({
          meterId: { $eq: newMeterId },
          date: { $eq: new Date(rData.date) },
          userId: { $eq: userId }
        });

        if (existing) {
          result.skippedCount++;
          continue;
        }

        readingsToInsert.push({
          meterId: newMeterId,
          value: rData.value,
          date: new Date(rData.date),
          userId
        });
      } catch (err) {
        result.errors.push({ index: i, message: `Failed to process reading at ${rData.date}: ${err instanceof Error ? err.message : 'Unknown error'}` });
      }
    }

    if (readingsToInsert.length > 0) {
      await ReadingModel.insertMany(readingsToInsert);
      result.successCount = readingsToInsert.length;
    }
  }

  // 3. Import Contracts
  if (Array.isArray(data.contracts)) {
    const contractsToInsert: Partial<IContract>[] = [];
    for (let i = 0; i < data.contracts.length; i++) {
      const cData = data.contracts[i];
      const newMeterId = meterIdMap.get(cData.meterId);
      
      if (!newMeterId) continue;

      try {
        const existing = await ContractModel.findOne({
          meterId: { $eq: newMeterId },
          providerName: { $eq: cData.providerName },
          startDate: { $eq: new Date(cData.startDate) },
          userId: { $eq: userId }
        });

        if (existing) continue;

        contractsToInsert.push({
          meterId: newMeterId,
          providerName: cData.providerName,
          type: cData.type,
          startDate: new Date(cData.startDate),
          endDate: cData.endDate ? new Date(cData.endDate) : undefined,
          basePrice: cData.basePrice,
          workingPrice: cData.workingPrice,
          userId
        });
        result.contractsCreated++;
      } catch (err) {
        result.errors.push({ index: i, message: `Failed to process contract for ${cData.providerName}: ${err instanceof Error ? err.message : 'Unknown error'}` });
      }
    }

    if (contractsToInsert.length > 0) {
      await ContractModel.insertMany(contractsToInsert);
    }
  }

  return result;
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