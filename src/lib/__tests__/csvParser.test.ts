import { describe, it, expect } from 'vitest';
import { parseCsv } from '../csvParser';

describe('CSV Parser', () => {
  it('parses simple CSV with comma delimiter', () => {
    const csv = `Date,Value
2023-01-01,100
2023-01-02,200`;
    
    const result = parseCsv(csv);
    expect(result).toEqual([
      { Date: '2023-01-01', Value: '100' },
      { Date: '2023-01-02', Value: '200' }
    ]);
  });

  it('parses CSV with semicolon delimiter', () => {
    const csv = `Date;Value
2023-01-01;100`;
    const result = parseCsv(csv);
    expect(result).toEqual([
        { Date: '2023-01-01', Value: '100' }
    ]);
  });
  
  it('parses CSV with space delimiter (user example format)', () => {
      const csv = `Date Strom
01.01.2022 2.852
21.11.2022 3877,3`;
      const result = parseCsv(csv, { delimiter: ' ' });
      // Note: we expect keys to be preserved as strings for now, mapping happens later
      expect(result).toEqual([
          { Date: '01.01.2022', Strom: '2.852' },
          { Date: '21.11.2022', Strom: '3877,3' }
      ]);
  });

  it('parses TSV (tab-separated) values (Excel/Sheets copy-paste)', () => {
      const tsv = `Date\tStrom
01.01.2022\t2.852
21.11.2022\t3877,3`;
      const result = parseCsv(tsv);
      expect(result).toEqual([
          { Date: '01.01.2022', Strom: '2.852' },
          { Date: '21.11.2022', Strom: '3877,3' }
      ]);
  });

  it('handles European number formats correctly (quoted)', () => {
      const csv = `Val
"1.234,56"`;
      const result = parseCsv(csv);
      expect(result[0].Val).toBe('1.234,56');
  });

  it('handles empty lines and whitespace', () => {
      const csv = `
Date,Value

2023-01-01,100
      `;
      const result = parseCsv(csv);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ Date: '2023-01-01', Value: '100' });
  });
});
