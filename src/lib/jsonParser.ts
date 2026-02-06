export interface Meter {
  id: string;
  name: string;
  location: string;
}

export interface Reading {
  meterId: string;
  date: string;
  value: number;
}

export interface ParsedResult {
  meters: Meter[];
  readings: Reading[];
}

/**
 * Extract meter info from raw meter data
 */
function extractMeterInfo(meter: Record<string, unknown>): { meterId: string; meter: Meter } {
  if (!meter.id || typeof meter.id !== 'string') {
    throw new Error('Meter must have an id');
  }

  const meterId = meter.id;
  const meterInfo: Meter = {
    id: meterId,
    name: (meter.name as string) || '',
    location: (meter.location as string) || ''
  };

  return { meterId, meter: meterInfo };
}

/**
 * Extract readings from meter data
 */
function extractReadingsFromMeter(
  meter: Record<string, unknown>,
  meterId: string
): Reading[] {
  const readings: Reading[] = [];

  if (!Array.isArray(meter.readings)) {
    return readings;
  }

  for (const readingData of meter.readings) {
    if (!readingData || typeof readingData !== 'object') {
      throw new Error('Invalid reading structure');
    }

    const reading = readingData as Record<string, unknown>;

    if (!reading.date || typeof reading.date !== 'string') {
      throw new Error('Reading must have a date');
    }

    if (typeof reading.value !== 'number') {
      throw new Error('Reading must have a numeric value');
    }

    readings.push({
      meterId,
      date: reading.date,
      value: reading.value
    });
  }

  return readings;
}

/**
 * Parse nested JSON format where meters contain readings
 * Expected formats:
 * 1. { meters: [{ id, name, location, readings: [{ date, value }] }] }
 * 2. [{ meter: { id, name, ... }, readings: [{ date, value, ... }] }] (export format)
 */
export function parseNestedFormat(json: unknown): ParsedResult {
  // Format 2: Array of { meter, readings }
  if (Array.isArray(json)) {
    const meters: Meter[] = [];
    const readings: Reading[] = [];

    // Handle empty array (valid export with no data)
    if (json.length === 0) {
      return { meters, readings };
    }

    for (const item of json) {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid item structure in nested array');
      }

      const data = item as Record<string, unknown>;
      
      if (!('meter' in data) || !('readings' in data)) {
        throw new Error('Each item must have "meter" and "readings" properties');
      }

      const meterData = data.meter as Record<string, unknown>;
      
      // Extract meter info - handle both 'id' and '_id' fields
      const meterId = (meterData.id || meterData._id) as string;
      if (!meterId) {
        throw new Error('Meter must have an id or _id');
      }

      const meterInfo: Meter = {
        id: meterId,
        name: (meterData.name as string) || '',
        location: (meterData.location as string) || ''
      };

      meters.push(meterInfo);

      // Extract readings
      if (Array.isArray(data.readings)) {
        for (const readingData of data.readings) {
          if (!readingData || typeof readingData !== 'object') {
            throw new Error('Invalid reading structure');
          }

          const reading = readingData as Record<string, unknown>;
          if (!reading.date || typeof reading.date !== 'string') {
            throw new Error('Reading must have a date');
          }

          if (typeof reading.value !== 'number') {
            throw new Error('Reading must have a numeric value');
          }

          readings.push({
            meterId,
            date: reading.date,
            value: reading.value
          });
        }
      }
    }

    return { meters, readings };
  }

  // Format 1: { meters: [...] }
  if (!json || typeof json !== 'object' || !('meters' in json)) {
    throw new Error('Invalid nested JSON structure: missing "meters" array');
  }

  const data = json as Record<string, unknown>;
  const metersList = data.meters;

  if (!Array.isArray(metersList)) {
    throw new Error('Invalid nested JSON structure: "meters" must be an array');
  }

  const meters: Meter[] = [];
  const readings: Reading[] = [];

  for (const meterData of metersList) {
    if (!meterData || typeof meterData !== 'object') {
      throw new Error('Invalid meter structure');
    }

    const meter = meterData as Record<string, unknown>;
    const { meterId, meter: meterInfo } = extractMeterInfo(meter);

    meters.push(meterInfo);

    const meterReadings = extractReadingsFromMeter(meter, meterId);
    readings.push(...meterReadings);
  }

  return { meters, readings };
}

/**
 * Parse flat JSON format where each reading includes meterId
 * Expected format: [{ meterId, date, value }]
 */
export function parseFlatFormat(json: unknown): ParsedResult {
  if (!Array.isArray(json)) {
    throw new Error('Invalid flat JSON structure: must be an array');
  }

  const readings: Reading[] = [];

  for (const readingData of json) {
    if (!readingData || typeof readingData !== 'object') {
      throw new Error('Invalid reading structure');
    }

    const reading = readingData as Record<string, unknown>;

    if (!reading.meterId || typeof reading.meterId !== 'string') {
      throw new Error('Reading must have a meterId');
    }

    if (!reading.date || typeof reading.date !== 'string') {
      throw new Error('Reading must have a date');
    }

    if (typeof reading.value !== 'number') {
      throw new Error('Reading must have a numeric value');
    }

    readings.push({
      meterId: reading.meterId,
      date: reading.date,
      value: reading.value
    });
  }

  return { meters: [], readings };
}

/**
 * Check if data is unified export format
 */
export function isUnifiedExportFormat(json: unknown): boolean {
  if (!json || typeof json !== 'object') {
    return false;
  }
  
  const data = json as Record<string, unknown>;
  return (
    'exportDate' in data &&
    'version' in data &&
    data.version === '1.0' &&
    'data' in data &&
    typeof data.data === 'object'
  );
}

/**
 * Extract readings from unified export format
 */
export function parseUnifiedFormat(json: unknown): ParsedResult {
  const data = json as Record<string, unknown>;
  const exportData = data.data as Record<string, unknown>;
  
  const meters: Meter[] = [];
  const readings: Reading[] = [];

  // Parse meters
  if (Array.isArray(exportData.meters)) {
    for (const m of exportData.meters) {
      if (m && typeof m === 'object') {
        const meter = m as Record<string, unknown>;
        meters.push({
          id: meter.id as string,
          name: meter.name as string,
          location: (meter.location as string) || ''
        });
      }
    }
  }

  // Parse readings
  if (Array.isArray(exportData.readings)) {
    for (const r of exportData.readings) {
      if (r && typeof r === 'object') {
        const reading = r as Record<string, unknown>;
        readings.push({
          meterId: reading.meterId as string,
          date: reading.date as string,
          value: reading.value as number
        });
      }
    }
  }

  return { meters, readings };
}

/**
 * Validate JSON structure and determine format
 */
export function validateJsonStructure(json: unknown): 'nested' | 'flat' | 'unified' {
  if (!json) {
    throw new Error('Unknown JSON format: null or undefined');
  }

  // Check for unified export format first
  if (isUnifiedExportFormat(json)) {
    return 'unified';
  }

  if (Array.isArray(json)) {
    // Empty array is valid - it represents an export with no data
    if (json.length === 0) {
      // Return 'nested' as the default format for empty arrays (export format)
      return 'nested';
    }
    
    // Check if it's the export format: [{ meter, readings }]
    const firstItem = json[0] as Record<string, unknown>;
    if (firstItem && typeof firstItem === 'object' && 'meter' in firstItem && 'readings' in firstItem) {
      return 'nested'; // Export format is also nested
    }
    
    // Otherwise it's flat format: [{ meterId, date, value }]
    return 'flat';
  }

  if (typeof json === 'object') {
    const data = json as Record<string, unknown>;
    if ('meters' in data && Array.isArray(data.meters)) {
      return 'nested';
    }
  }

  throw new Error('Unknown JSON format');
}
