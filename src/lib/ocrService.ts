import { Model } from 'mongoose';
import crypto from 'crypto';
import { scanImageWithGemini } from './geminiOcrv2';

interface GeminiOcrResult {
  value: number;
  meter_number: string;
  type: 'power' | 'gas';
  unit: 'kWh' | 'm³';
}

interface ScanResult {
  value: number;
  meterId: string;
  meterName: string;
  meterNumber: string;
  unit: string;
  type: string;
}

// Simple in-memory lock to prevent concurrent Gemini API calls for the same image hash
const pendingScans = new Map<string, Promise<string>>();

export async function processOcrScan(
  image: string,
  userId: string,
  apiKey: string,
  models: {
    Meter: Model<any>;
    OcrCache: Model<any>;
  }
): Promise<ScanResult> {
  const { Meter, OcrCache } = models;
  const base64Data = image.split(',')[1] || image;
  const hash = crypto.createHash('sha256').update(base64Data).digest('hex');

  // 1. Check persistent cache
  const cached = await OcrCache.findOne({ hash: { $eq: hash } });
  let ocrResultText: string;

  if (cached) {
    ocrResultText = cached.resultText;
  } else {
    // 2. Check for in-flight requests (Race condition protection)
    if (pendingScans.has(hash)) {
      ocrResultText = await pendingScans.get(hash)!;
    } else {
      // 3. Perform scan and handle locking
      const scanPromise = (async () => {
        try {
          const blob = new Blob([Buffer.from(base64Data, 'base64')], { type: 'image/jpeg' });
          const resultText = await scanImageWithGemini(blob, apiKey);
          
          // Save to persistent cache
          await OcrCache.create({ hash, resultText });
          return resultText;
        } finally {
          // Cleanup lock
          pendingScans.delete(hash);
        }
      })();

      pendingScans.set(hash, scanPromise);
      ocrResultText = await scanPromise;
    }
  }

  const result = parseGeminiResult(ocrResultText);
  const meter = await findOrCreateMeter(result, userId, Meter);

  return {
    value: result.value,
    meterId: meter._id,
    meterName: meter.name,
    meterNumber: meter.meterNumber,
    unit: meter.unit,
    type: meter.type
  };
}

function parseGeminiResult(ocrResultText: string): GeminiOcrResult {
  const jsonMatch = ocrResultText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini failed to return structured JSON');
  }

  const result = JSON.parse(jsonMatch[0]);
  if (!result.value || !result.meter_number) {
    throw new Error('Gemini missed critical fields in JSON');
  }
  return result;
}

async function findOrCreateMeter(result: GeminiOcrResult, userId: string, Meter: Model<any>) {
  const { meter_number: meterNumber, type, unit } = result;
  let meter = await Meter.findOne({ meterNumber: { $eq: meterNumber } }).setOptions({ userId });

  if (!meter) {
    meter = await Meter.create({
      name: `Meter ${meterNumber}`,
      meterNumber,
      type: type || 'power',
      unit: unit || 'kWh',
      userId
    });
  }
  return meter;
}
