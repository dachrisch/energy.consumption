import { IReading, IMeter, IContract } from '../types/models';
import { Model } from 'mongoose';

interface BulkImportResult {
  successCount: number;
  skippedCount: number;
  errors: Array<{ index: number; message: string }>;
}

interface UnifiedImportData {
  meters?: Array<{ id: string; name: string; meterNumber: string; type: 'power' | 'gas'; unit: string }>;
  readings?: Array<{ meterId: string; date: string; value: number }>;
  contracts?: Array<{ meterId: string; providerName: string; startDate: string; endDate?: string; basePrice: number; workingPrice: number; type: 'power' | 'gas' }>;
}

interface MeterImportOptions {
  data: UnifiedImportData;
  userId: string;
  MeterModel: Model<IMeter>;
  result: { metersCreated: number; errors: Array<{ index: number; message: string }> };
}

// Helper: Import meters and build ID map
async function importMeters(options: MeterImportOptions): Promise<Map<string, string>> {
  const { data, userId, MeterModel, result } = options;
  const meterIdMap = new Map<string, string>();

  if (!Array.isArray(data.meters)) {
    return meterIdMap;
  }

  for (let i = 0; i < data.meters.length; i++) {
    const mData = data.meters[i];
    try {
      const existing = await MeterModel.findOne({
        meterNumber: { $eq: mData.meterNumber },
        userId: { $eq: userId }
      });

      const meter = existing
        ? existing
        : await MeterModel.create({
            name: mData.name,
            meterNumber: mData.meterNumber,
            type: mData.type,
            unit: mData.unit,
            userId
          });

      if (!existing) {
        result.metersCreated++;
      }
      meterIdMap.set(mData.id, meter._id.toString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push({ index: i, message: `Failed to import meter ${mData.name}: ${msg}` });
    }
  }

  return meterIdMap;
}

interface ReadingImportOptions {
  data: UnifiedImportData;
  userId: string;
  meterIdMap: Map<string, string>;
  ReadingModel: Model<IReading>;
  result: { successCount: number; skippedCount: number; errors: Array<{ index: number; message: string }> };
}

// Helper: Import readings
async function importReadings(options: ReadingImportOptions): Promise<void> {
  const { data, userId, meterIdMap, ReadingModel, result } = options;
  if (!Array.isArray(data.readings)) {
    return;
  }

  const readingsToInsert: Partial<IReading>[] = [];

  for (let i = 0; i < data.readings.length; i++) {
    const rData = data.readings[i];
    const newMeterId = meterIdMap.get(rData.meterId);

    if (!newMeterId) {
      continue;
    }

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
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push({ index: i, message: `Failed to process reading at ${rData.date}: ${msg}` });
    }
  }

  if (readingsToInsert.length > 0) {
    await ReadingModel.insertMany(readingsToInsert);
    result.successCount = readingsToInsert.length;
  }
}

interface ContractImportOptions {
  data: UnifiedImportData;
  userId: string;
  meterIdMap: Map<string, string>;
  ContractModel: Model<IContract>;
  result: { contractsCreated: number; errors: Array<{ index: number; message: string }> };
}

// Helper: Import contracts
async function importContracts(options: ContractImportOptions): Promise<void> {
  const { data, userId, meterIdMap, ContractModel, result } = options;
  if (!Array.isArray(data.contracts)) {
    return;
  }

  const contractsToInsert: Partial<IContract>[] = [];

  for (let i = 0; i < data.contracts.length; i++) {
    const cData = data.contracts[i];
    const newMeterId = meterIdMap.get(cData.meterId);

    if (!newMeterId) {
      continue;
    }

    try {
      const existing = await ContractModel.findOne({
        meterId: { $eq: newMeterId },
        providerName: { $eq: cData.providerName },
        startDate: { $eq: new Date(cData.startDate) },
        userId: { $eq: userId }
      });

      if (existing) {
        continue;
      }

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
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push({ index: i, message: `Failed to process contract for ${cData.providerName}: ${msg}` });
    }
  }

  if (contractsToInsert.length > 0) {
    await ContractModel.insertMany(contractsToInsert);
  }
}

interface UnifiedImportOptions {
  backupData: unknown;
  userId: string;
  MeterModel: Model<IMeter>;
  ReadingModel: Model<IReading>;
  ContractModel: Model<IContract>;
}

/**
 * Processes a full unified import including meters, readings, and contracts.
 */
export async function processUnifiedImport(
  options: UnifiedImportOptions
): Promise<BulkImportResult & { metersCreated: number; contractsCreated: number }> {
  const { backupData, userId, MeterModel, ReadingModel, ContractModel } = options;
  if (typeof backupData !== 'object' || backupData === null || !('data' in backupData)) {
    throw new Error('Invalid backup data structure');
  }

  const backupObj = backupData as { data: UnifiedImportData };
  const { data } = backupObj;

  const result = {
    successCount: 0,
    skippedCount: 0,
    metersCreated: 0,
    contractsCreated: 0,
    errors: [] as Array<{ index: number; message: string }>
  };

  // 1. Import Meters
  const meterIdMap = await importMeters({ data, userId, MeterModel, result });

  // 2. Import Readings
  await importReadings({ data, userId, meterIdMap, ReadingModel, result });

  // 3. Import Contracts
  await importContracts({ data, userId, meterIdMap, ContractModel, result });

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
    const existing = await ReadingModel.find({
      meterId: { $eq: reading.meterId },
      date: { $eq: reading.date },
      userId: { $eq: userId }
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
