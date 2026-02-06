import { describe, it, expect } from 'vitest';
import { detectFileType } from './fileTypeDetector';

describe('detectFileType', () => {
  it('should detect JSON by .json extension', () => {
    expect(detectFileType('data.json')).toBe('json');
  });

  it('should detect CSV by .csv extension', () => {
    expect(detectFileType('data.csv')).toBe('csv');
  });

  it('should detect JSON from content starting with [', () => {
    expect(detectFileType('data.txt', '[{"id": 1}]')).toBe('json');
  });

  it('should detect JSON from content starting with {', () => {
    expect(detectFileType('data.txt', '{"id": 1}')).toBe('json');
  });

  it('should detect CSV by default when no extension or content match', () => {
    expect(detectFileType('data.txt')).toBe('csv');
  });

  it('should handle whitespace in content detection', () => {
    expect(detectFileType('data.txt', '  \n[{"id": 1}]')).toBe('json');
  });

  it('should prefer extension over content when both are available', () => {
    expect(detectFileType('data.csv', '[{"id": 1}]')).toBe('csv');
  });
});
