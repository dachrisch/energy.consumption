import { describe, expect, it } from 'vitest';
import { getContractStatus } from '../contractStatus';

const today = new Date(2026, 10, 2, 12);

describe('getContractStatus', () => {
  it('marks a contract active when it starts today', () => {
    expect(getContractStatus('2026-11-02', undefined, today)).toBe('Active');
  });

  it('marks a contract active when it ends today', () => {
    expect(getContractStatus('2026-01-01', '2026-11-02', today)).toBe('Active');
  });

  it('marks a contract active when it has no end date', () => {
    expect(getContractStatus('2026-01-01', undefined, today)).toBe('Active');
  });

  it('marks a contract ended before today', () => {
    expect(getContractStatus('2026-01-01', '2026-11-01', today)).toBe('Ended');
  });

  it('marks a contract upcoming after today', () => {
    expect(getContractStatus('2026-11-03', undefined, today)).toBe('Upcoming');
  });

  it('uses the local calendar day for a start date around midnight', () => {
    const localToday = new Date(2026, 10, 3, 0, 30);
    expect(getContractStatus('2026-11-03', undefined, localToday)).toBe('Active');
  });

  it('uses the local calendar day for an end date around midnight', () => {
    const localToday = new Date(2026, 10, 3, 0, 30);
    expect(getContractStatus('2026-01-01', '2026-11-02', localToday)).toBe('Ended');
  });
});
