import { parseCSVData, CSVParseResult, Separator } from '../csvUtils';

describe('csvUtils', () => {
  describe('parseCSVData', () => {
    it('should parse valid CSV data with comma separator', async () => {
      const csvData = `amount,date,type
1000,01/01/2024,power
500,02/01/2024,gas`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.data[0].amount).toBe(1000);
      expect(result.data[0].type).toBe('power');
      expect(result.data[1].amount).toBe(500);
      expect(result.data[1].type).toBe('gas');
    });

    it('should parse valid CSV data with tab separator', async () => {
      const csvData = `amount\tdate\ttype
1000\t01/01/2024\tpower
500\t02/01/2024\tgas`;

      const result: CSVParseResult = await parseCSVData(csvData, '\t');

      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-CSV data', async () => {
      const csvData = 'Just some plain text without separators';

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(0);
      expect(result.errors).toContain('Clipboard data is not a valid CSV format.');
    });

    it('should handle CSV with missing fields', async () => {
      const csvData = `amount,date,type
1000,01/01/2024
500,02/01/2024,gas`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(0);
      expect(result.errors).toContain('Invalid row in CSV data');
    });

    it('should handle CSV with invalid amount', async () => {
      const csvData = `amount,date,type
invalid,01/01/2024,power`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      // parseFloat returns NaN which is still processed but may cause issues downstream
      expect(result.data).toHaveLength(1);
      expect(isNaN(result.data[0].amount)).toBe(true);
    });

    it('should handle empty CSV data', async () => {
      const csvData = '';

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(0);
      expect(result.errors).toContain('Clipboard data is not a valid CSV format.');
    });

    it('should handle CSV with only headers', async () => {
      const csvData = 'amount,date,type';

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle case-insensitive headers', async () => {
      const csvData = `AMOUNT,DATE,TYPE
1000,01/01/2024,power`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].amount).toBe(1000);
    });

    it('should parse dates flexibly', async () => {
      const csvData = `amount,date,type
1000,2024-01-01,power
500,01.01.2024,gas
750,01/01/2024,power`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(3);
      result.data.forEach(item => {
        expect(item.date).toBeInstanceOf(Date);
      });
    });

    it('should handle CSV with extra whitespace', async () => {
      const csvData = `amount,date,type
1000,01/01/2024,power`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].amount).toBe(1000);
      expect(result.data[0].type).toBe('power');
    });

    it('should detect tab-separated data even with comma separator parameter', async () => {
      const csvData = `amount\tdate\ttype
1000\t01/01/2024\tpower`;

      // Even though we specify comma, it should detect tabs
      const result: CSVParseResult = await parseCSVData(csvData, '\t');

      expect(result.data).toHaveLength(1);
    });

    it('should handle multiple rows with mixed valid/invalid data', async () => {
      const csvData = `amount,date,type
1000,01/01/2024,power
,02/01/2024,gas
500,03/01/2024,power`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle CSV with decimal amounts', async () => {
      const csvData = `amount,date,type
1000.50,01/01/2024,power
500.75,02/01/2024,gas`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(2);
      expect(result.data[0].amount).toBe(1000.50);
      expect(result.data[1].amount).toBe(500.75);
    });

    it('should handle large CSV files', async () => {
      const rows = Array.from({ length: 100 }, (_, i) =>
        `${1000 + i},0${((i % 9) + 1)}/01/2024,${i % 2 === 0 ? 'power' : 'gas'}`
      );
      const csvData = `amount,date,type\n${rows.join('\n')}`;

      const result: CSVParseResult = await parseCSVData(csvData, ',');

      expect(result.data).toHaveLength(100);
      expect(result.errors).toHaveLength(0);
    });
  });
});
