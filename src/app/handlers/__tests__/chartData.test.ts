import { getChartData } from '../chartData';
import { EnergyTimeSeries } from '../../types';
import { TimeSeries } from '@/lib/pond/timeseries';
import { timeEvent } from '@/lib/pond/event';
import { time } from '@/lib/pond/time';
import Immutable from 'immutable';

describe('chartData', () => {
  describe('getChartData', () => {
    it('should return empty chart data for empty series', () => {
      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({ name: 'power', events: Immutable.List([]) }),
        gas: new TimeSeries({ name: 'gas', events: Immutable.List([]) }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.labels).toEqual([]);
      expect(result.datasets).toHaveLength(2);
      expect(result.datasets[0].label).toBe('Power');
      expect(result.datasets[1].label).toBe('Gas');
      expect(result.datasets[0].hidden).toBe(false);
      expect(result.datasets[1].hidden).toBe(false);
    });

    it('should process power data correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
            timeEvent(time(date2), Immutable.Map({ amount: 1500 })),
          ]),
        }),
        gas: new TimeSeries({ name: 'gas', events: Immutable.List([]) }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.labels).toHaveLength(2);
      expect(result.datasets[0].data).toContain(1000);
      expect(result.datasets[0].data).toContain(1500);
      expect(result.datasets[1].data).toEqual([null, null]);
    });

    it('should process gas data correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({ name: 'power', events: Immutable.List([]) }),
        gas: new TimeSeries({
          name: 'gas',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 500 })),
            timeEvent(time(date2), Immutable.Map({ amount: 750 })),
          ]),
        }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.labels).toHaveLength(2);
      expect(result.datasets[1].data).toContain(500);
      expect(result.datasets[1].data).toContain(750);
      expect(result.datasets[0].data).toEqual([null, null]);
    });

    it('should process both power and gas data', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
            timeEvent(time(date2), Immutable.Map({ amount: 1500 })),
          ]),
        }),
        gas: new TimeSeries({
          name: 'gas',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 500 })),
            timeEvent(time(date2), Immutable.Map({ amount: 750 })),
          ]),
        }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.labels).toHaveLength(2);
      expect(result.datasets).toHaveLength(2);
      expect(result.datasets[0].data).toEqual([1000, 1500]);
      expect(result.datasets[1].data).toEqual([500, 750]);
    });

    it('should sort labels chronologically', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-05');
      const date3 = new Date('2024-01-10');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
            timeEvent(time(date2), Immutable.Map({ amount: 1500 })),
            timeEvent(time(date3), Immutable.Map({ amount: 1200 })),
          ]),
        }),
        gas: new TimeSeries({ name: 'gas', events: Immutable.List([]) }),
      };

      const result = getChartData(seriesData, 'all');

      // Check that we have 3 labels
      expect(result.labels).toHaveLength(3);

      // Verify sorting by checking the date strings
      // Labels are in DD/MM/YYYY format (e.g., "05/01/2024")
      expect(result.labels[0]).toContain('05/01/2024');
      expect(result.labels[1]).toContain('10/01/2024');
      expect(result.labels[2]).toContain('15/01/2024');
    });

    it('should filter to show only power when typeFilter is power', () => {
      const date1 = new Date('2024-01-01');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
          ]),
        }),
        gas: new TimeSeries({
          name: 'gas',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 500 })),
          ]),
        }),
      };

      const result = getChartData(seriesData, 'power');

      expect(result.datasets[0].hidden).toBe(false); // power visible
      expect(result.datasets[1].hidden).toBe(true);  // gas hidden
    });

    it('should filter to show only gas when typeFilter is gas', () => {
      const date1 = new Date('2024-01-01');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
          ]),
        }),
        gas: new TimeSeries({
          name: 'gas',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 500 })),
          ]),
        }),
      };

      const result = getChartData(seriesData, 'gas');

      expect(result.datasets[0].hidden).toBe(true);  // power hidden
      expect(result.datasets[1].hidden).toBe(false); // gas visible
    });

    it('should show all types when typeFilter is all', () => {
      const date1 = new Date('2024-01-01');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
          ]),
        }),
        gas: new TimeSeries({
          name: 'gas',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 500 })),
          ]),
        }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.datasets[0].hidden).toBe(false);
      expect(result.datasets[1].hidden).toBe(false);
    });

    it('should handle null values with spanGaps enabled', () => {
      const date1 = new Date('2024-01-01');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
          ]),
        }),
        gas: new TimeSeries({ name: 'gas', events: Immutable.List([]) }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.datasets[0].spanGaps).toBe(true);
      expect(result.datasets[1].spanGaps).toBe(true);
    });

    it('should use correct chart configuration for power', () => {
      const date1 = new Date('2024-01-01');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
          ]),
        }),
        gas: new TimeSeries({ name: 'gas', events: Immutable.List([]) }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.datasets[0].borderColor).toBe('rgb(75, 192, 192)');
      expect(result.datasets[0].backgroundColor).toBe('rgba(75, 192, 192, 0.5)');
      expect(result.datasets[0].tension).toBe(0.4);
    });

    it('should use correct chart configuration for gas', () => {
      const date1 = new Date('2024-01-01');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({ name: 'power', events: Immutable.List([]) }),
        gas: new TimeSeries({
          name: 'gas',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 500 })),
          ]),
        }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.datasets[1].borderColor).toBe('rgb(255, 99, 132)');
      expect(result.datasets[1].backgroundColor).toBe('rgba(255, 99, 132, 0.5)');
      expect(result.datasets[1].tension).toBe(0.4);
    });

    it('should handle multiple readings on same date', () => {
      const date1 = new Date('2024-01-01T10:00:00');
      const date1Later = new Date('2024-01-01T15:00:00');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
            timeEvent(time(date1Later), Immutable.Map({ amount: 1500 })),
          ]),
        }),
        gas: new TimeSeries({ name: 'gas', events: Immutable.List([]) }),
      };

      const result = getChartData(seriesData, 'all');

      // Should only have one label for the date
      expect(result.labels).toHaveLength(1);
      // Should use the last value for that date
      expect(result.datasets[0].data[0]).toBe(1500);
    });

    it('should handle sparse data with missing dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-03');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
          ]),
        }),
        gas: new TimeSeries({
          name: 'gas',
          events: Immutable.List([
            timeEvent(time(date2), Immutable.Map({ amount: 500 })),
          ]),
        }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.labels).toHaveLength(2);
      expect(result.datasets[0].data).toEqual([1000, null]);
      expect(result.datasets[1].data).toEqual([null, 500]);
    });

    it('should handle series with undefined events', () => {
      const date1 = new Date('2024-01-01');

      const seriesData: EnergyTimeSeries = {
        power: new TimeSeries({
          name: 'power',
          events: Immutable.List([
            timeEvent(time(date1), Immutable.Map({ amount: 1000 })),
          ]),
        }),
        gas: new TimeSeries({ name: 'gas', events: Immutable.List([]) }),
      };

      const result = getChartData(seriesData, 'all');

      expect(result.labels).toHaveLength(1);
      expect(result.datasets[0].data).toEqual([1000]);
    });
  });
});
