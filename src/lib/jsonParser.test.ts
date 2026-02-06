import { describe, it, expect } from 'vitest';
import { parseNestedFormat, parseFlatFormat, validateJsonStructure } from './jsonParser';

// Test data
const singleMeterJson = {
  meters: [
    {
      id: 'meter-1',
      name: 'Kitchen Meter',
      location: 'Kitchen',
      readings: [
        { date: '2024-01-15', value: 100.5 },
        { date: '2024-01-16', value: 105.2 }
      ]
    }
  ]
};

const multiMeterJson = {
  meters: [
    {
      id: 'meter-1',
      name: 'Kitchen',
      location: 'Kitchen',
      readings: [{ date: '2024-01-15', value: 100 }]
    },
    {
      id: 'meter-2',
      name: 'Bedroom',
      location: 'Bedroom',
      readings: [{ date: '2024-01-15', value: 50 }]
    }
  ]
};

const invalidJson = { invalid: 'structure' };

const meterMissingIdJson = {
  meters: [
    {
      name: 'Kitchen',
      location: 'Kitchen',
      readings: []
    }
  ]
};

describe('JSON Parser', () => {
  describe('parseNestedFormat', () => {
    it('should parse a valid nested JSON structure with meters and readings', () => {
      const result = parseNestedFormat(singleMeterJson);

      expect(result.meters).toHaveLength(1);
      expect(result.meters[0].id).toBe('meter-1');
      expect(result.meters[0].name).toBe('Kitchen Meter');
      expect(result.readings).toHaveLength(2);
      expect(result.readings[0].meterId).toBe('meter-1');
      expect(result.readings[0].date).toBe('2024-01-15');
      expect(result.readings[0].value).toBe(100.5);
    });

    it('should handle multiple meters with readings', () => {
      const result = parseNestedFormat(multiMeterJson);

      expect(result.meters).toHaveLength(2);
      expect(result.readings).toHaveLength(2);
      expect(result.readings[0].meterId).toBe('meter-1');
      expect(result.readings[1].meterId).toBe('meter-2');
    });

    it('should throw error if meters array is missing', () => {
      expect(() => parseNestedFormat(invalidJson)).toThrow(
        'Invalid nested JSON structure'
      );
    });

    it('should throw error if meter id is missing', () => {
      expect(() => parseNestedFormat(meterMissingIdJson)).toThrow(
        'Meter must have an id'
      );
    });

    it('should parse export format with array of { meter, readings }', () => {
      const exportFormat = [
        {
          meter: {
            id: '6986456298e0ac9523b0d7d9',
            name: 'sdg',
            meterNumber: 'sdgs',
            type: 'power',
            unit: 'kWh'
          },
          readings: [
            { value: 2.852, date: '2021-12-31', createdAt: '2026-02-06T19:47:55.539Z' },
            { value: 3877.3, date: '2022-11-21', createdAt: '2026-02-06T19:47:55.539Z' },
            { value: 3883.4, date: '2022-11-23', createdAt: '2026-02-06T19:47:55.539Z' }
          ]
        }
      ];

      const result = parseNestedFormat(exportFormat);

      expect(result.meters).toHaveLength(1);
      expect(result.meters[0].id).toBe('6986456298e0ac9523b0d7d9');
      expect(result.meters[0].name).toBe('sdg');
      expect(result.readings).toHaveLength(3);
      expect(result.readings[0].meterId).toBe('6986456298e0ac9523b0d7d9');
      expect(result.readings[0].date).toBe('2021-12-31');
      expect(result.readings[0].value).toBe(2.852);
      expect(result.readings[1].value).toBe(3877.3);
    });

    it('should handle _id field as fallback for id', () => {
      const mongoFormat = {
        meter: {
          _id: 'mongo-id-123',
          name: 'Test Meter',
          readings: [
            { value: 100, date: '2024-01-15' }
          ]
        },
        readings: [
          { value: 100, date: '2024-01-15' }
        ]
      };

      const result = parseNestedFormat([mongoFormat]);

      expect(result.meters[0].id).toBe('mongo-id-123');
      expect(result.readings[0].meterId).toBe('mongo-id-123');
    });
  });

  describe('parseFlatFormat', () => {
    it('should parse a valid flat JSON array structure', () => {
      const json = [
        { meterId: 'meter-1', date: '2024-01-15', value: 100.5 },
        { meterId: 'meter-1', date: '2024-01-16', value: 105.2 }
      ];

      const result = parseFlatFormat(json);

      expect(result.readings).toHaveLength(2);
      expect(result.readings[0].meterId).toBe('meter-1');
      expect(result.readings[0].date).toBe('2024-01-15');
      expect(result.readings[0].value).toBe(100.5);
    });

    it('should throw error if array contains invalid readings', () => {
      const json = [
        { meterId: 'meter-1', date: '2024-01-15', value: 100 },
        { meterId: 'meter-1', value: 105 } // missing date
      ];

      expect(() => parseFlatFormat(json)).toThrow();
    });
  });

  describe('validateJsonStructure', () => {
    it('should identify nested format correctly', () => {
      const json = {
        meters: [{ id: 'meter-1', name: 'Test', readings: [] }]
      };

      const format = validateJsonStructure(json);

      expect(format).toBe('nested');
    });

    it('should identify flat format correctly', () => {
      const json = [{ meterId: 'meter-1', date: '2024-01-15', value: 100 }];

      const format = validateJsonStructure(json);

      expect(format).toBe('flat');
    });

    it('should identify export format as nested', () => {
      const json = [
        {
          meter: { id: 'meter-1', name: 'Test' },
          readings: [{ value: 100, date: '2024-01-15' }]
        }
      ];

      const format = validateJsonStructure(json);

      expect(format).toBe('nested');
    });

    it('should throw error for unknown format', () => {
      const json = { unknownField: 'value' };

      expect(() => validateJsonStructure(json)).toThrow('Unknown JSON format');
    });
  });
});
