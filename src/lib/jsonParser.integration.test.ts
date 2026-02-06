import { describe, it, expect } from 'vitest';
import { parseNestedFormat, validateJsonStructure } from './jsonParser';

describe('JSON Parser - Export Format Integration', () => {
  it('should parse the exact export format returned by API', () => {
    // This is the exact format returned by exportReadingsAsJson()
    const exportedData = [
      {
        meter: {
          id: '6986456298e0ac9523b0d7d9',
          name: 'sdg',
          meterNumber: 'sdgs',
          type: 'power',
          unit: 'kWh'
        },
        readings: [
          {
            value: 2.852,
            date: '2021-12-31',
            createdAt: '2026-02-06T19:47:55.539Z'
          },
          {
            value: 3877.3,
            date: '2022-11-21',
            createdAt: '2026-02-06T19:47:55.539Z'
          },
          {
            value: 3883.4,
            date: '2022-11-23',
            createdAt: '2026-02-06T19:47:55.539Z'
          }
        ]
      }
    ];

    // Detect format
    const format = validateJsonStructure(exportedData);
    expect(format).toBe('nested');

    // Parse the data
    const result = parseNestedFormat(exportedData);

    // Verify meters are parsed correctly
    expect(result.meters).toHaveLength(1);
    expect(result.meters[0].id).toBe('6986456298e0ac9523b0d7d9');
    expect(result.meters[0].name).toBe('sdg');

    // Verify readings are parsed correctly
    expect(result.readings).toHaveLength(3);
    expect(result.readings[0]).toEqual({
      meterId: '6986456298e0ac9523b0d7d9',
      date: '2021-12-31',
      value: 2.852
    });
    expect(result.readings[1].value).toBe(3877.3);
    expect(result.readings[2].value).toBe(3883.4);
  });

  it('should work with JSON stringified export data', () => {
    const exportedData = [
      {
        meter: {
          id: 'meter-123',
          name: 'Test Meter',
          meterNumber: 'T001',
          type: 'power',
          unit: 'kWh'
        },
        readings: [
          { value: 100, date: '2024-01-01', createdAt: '2024-01-01T00:00:00Z' },
          { value: 105, date: '2024-01-02', createdAt: '2024-01-02T00:00:00Z' }
        ]
      }
    ];

    // Simulate JSON stringify/parse cycle (as would happen in import)
    const jsonString = JSON.stringify(exportedData);
    const parsed = JSON.parse(jsonString);

    // Detect format
    const format = validateJsonStructure(parsed);
    expect(format).toBe('nested');

    // Parse
    const result = parseNestedFormat(parsed);

    expect(result.meters).toHaveLength(1);
    expect(result.readings).toHaveLength(2);
    expect(result.readings[0].meterId).toBe('meter-123');
  });

  it('should handle multiple meters in export format', () => {
    const exportedData = [
      {
        meter: { id: 'meter-1', name: 'Kitchen', type: 'power', unit: 'kWh' },
        readings: [
          { value: 100, date: '2024-01-01' },
          { value: 105, date: '2024-01-02' }
        ]
      },
      {
        meter: { id: 'meter-2', name: 'Bedroom', type: 'power', unit: 'kWh' },
        readings: [
          { value: 50, date: '2024-01-01' },
          { value: 52, date: '2024-01-02' }
        ]
      }
    ];

    const format = validateJsonStructure(exportedData);
    expect(format).toBe('nested');

    const result = parseNestedFormat(exportedData);

    expect(result.meters).toHaveLength(2);
    expect(result.readings).toHaveLength(4);
    
    // Verify readings are associated with correct meters
    const meter1Readings = result.readings.filter(r => r.meterId === 'meter-1');
    const meter2Readings = result.readings.filter(r => r.meterId === 'meter-2');
    
    expect(meter1Readings).toHaveLength(2);
    expect(meter2Readings).toHaveLength(2);
    expect(meter1Readings[0].value).toBe(100);
    expect(meter2Readings[0].value).toBe(50);
  });
});
