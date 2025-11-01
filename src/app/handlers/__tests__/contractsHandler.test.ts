import { fetchAndConvert } from '../contractsHandler';

// Mock fetch globally
global.fetch = jest.fn();

describe('contractsHandler', () => {
  describe('fetchAndConvert', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch and convert contracts successfully', async () => {
      const mockData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power',
          basePrice: 100,
          workingPrice: 0.25,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T00:00:00.000Z',
        },
        {
          _id: '2',
          userId: 'user1',
          type: 'gas',
          basePrice: 50,
          workingPrice: 0.15,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T00:00:00.000Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAndConvert();

      expect(result).toHaveLength(2);
      expect(result[0].startDate).toBeInstanceOf(Date);
      expect(result[1].startDate).toBeInstanceOf(Date);
      expect(global.fetch).toHaveBeenCalledWith('/api/contracts');
    });

    it('should convert string dates to Date objects', async () => {
      const mockData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power',
          basePrice: 100,
          workingPrice: 0.25,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T00:00:00.000Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAndConvert();

      expect(result[0].startDate).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    });

    it('should handle contracts without endDate', async () => {
      const mockData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power',
          basePrice: 100,
          workingPrice: 0.25,
          startDate: '2024-01-01T00:00:00.000Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAndConvert();

      expect(result[0].startDate).toBeInstanceOf(Date);
      expect(result[0].endDate).toBeUndefined();
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchAndConvert()).rejects.toThrow('Failed to fetch contracts');
    });

    it('should throw error on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAndConvert()).rejects.toThrow('Network error');
    });

    it('should handle empty array response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await fetchAndConvert();

      expect(result).toEqual([]);
    });

    it('should convert numeric timestamps to Date objects', async () => {
      const timestamp = new Date('2024-01-01').getTime();
      const mockData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power',
          basePrice: 100,
          workingPrice: 0.25,
          startDate: timestamp,
          endDate: timestamp,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAndConvert();

      expect(result[0].startDate).toBeInstanceOf(Date);
      expect(result[0].startDate.getTime()).toBe(timestamp);
    });

    it('should preserve all other contract fields', async () => {
      const mockData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power',
          basePrice: 100,
          workingPrice: 0.25,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T00:00:00.000Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAndConvert();

      expect(result[0]._id).toBe('1');
      expect(result[0].userId).toBe('user1');
      expect(result[0].type).toBe('power');
      expect(result[0].basePrice).toBe(100);
      expect(result[0].workingPrice).toBe(0.25);
    });

    it('should handle multiple contracts', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        _id: `${i}`,
        userId: 'user1',
        type: i % 2 === 0 ? 'power' : 'gas',
        basePrice: 100 + i,
        workingPrice: 0.25 + i * 0.01,
        startDate: `2024-0${(i % 9) + 1}-01T00:00:00.000Z`,
        endDate: `2024-${(i % 9) + 1 === 12 ? '12' : `0${(i % 9) + 1}`}-31T00:00:00.000Z`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAndConvert();

      expect(result).toHaveLength(10);
      result.forEach(contract => {
        expect(contract.startDate).toBeInstanceOf(Date);
      });
    });
  });
});
