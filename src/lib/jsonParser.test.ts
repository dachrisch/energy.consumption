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

    it('should throw error for unknown format', () => {
      const json = { unknownField: 'value' };

      expect(() => validateJsonStructure(json)).toThrow('Unknown JSON format');
    });
  });
});
