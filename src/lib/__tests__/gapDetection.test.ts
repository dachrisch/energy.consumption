import { describe, it, expect } from 'vitest';
import { findContractGaps } from '../gapDetection';

describe('Gap Detection Utility', () => {
  const readings = [
    { date: new Date(2023, 0, 1), value: 100 },
    { date: new Date(2023, 11, 31), value: 200 }
  ];

  it('detects a gap at the beginning (before first contract)', () => {
    const contracts = [
      { startDate: new Date(2023, 1, 1), endDate: new Date(2023, 11, 31) }
    ];
    const gaps = findContractGaps(readings, contracts as any);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].startDate).toEqual(new Date(2023, 0, 1));
    expect(gaps[0].endDate).toEqual(new Date(2023, 0, 31));
  });

  it('detects a gap in the middle (between contracts)', () => {
    const contracts = [
      { startDate: new Date(2023, 0, 1), endDate: new Date(2023, 2, 31) },
      { startDate: new Date(2023, 4, 1), endDate: new Date(2023, 11, 31) }
    ];
    const gaps = findContractGaps(readings, contracts as any);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].startDate).toEqual(new Date(2023, 3, 1));
    expect(gaps[0].endDate).toEqual(new Date(2023, 3, 30));
  });

  it('detects a gap at the end (after last contract)', () => {
    const contracts = [
      { startDate: new Date(2023, 0, 1), endDate: new Date(2023, 10, 30) }
    ];
    const gaps = findContractGaps(readings, contracts as any);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].startDate).toEqual(new Date(2023, 11, 1));
    expect(gaps[0].endDate).toEqual(new Date(2023, 11, 31));
  });

  it('returns no gaps when fully covered', () => {
    const contracts = [
      { startDate: new Date(2023, 0, 1), endDate: null }
    ];
    const gaps = findContractGaps(readings, contracts as any);
    expect(gaps).toHaveLength(0);
  });
});