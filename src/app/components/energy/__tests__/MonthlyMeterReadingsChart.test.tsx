/**
 * MonthlyMeterReadingsChart Component Tests
 * Following TDD: Write tests first, then implement
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MonthlyMeterReadingsChart from '../MonthlyMeterReadingsChart';
import { EnergyType } from '@/app/types';
import * as MonthlyDataAggregationService from '@/app/services/MonthlyDataAggregationService';

// Mock Chart.js to avoid rendering complexity in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: { data: unknown; options: unknown }) => (
    <div data-testid="chart-mock" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Mocked Chart
    </div>
  ),
}));

// Mock the service
jest.mock('@/app/services/MonthlyDataAggregationService');

describe('MonthlyMeterReadingsChart', () => {
  // Helper to create test readings
  const createReading = (date: Date, amount: number, type: 'power' | 'gas' = 'power'): EnergyType => ({
    _id: `${date.getTime()}`,
    type,
    amount,
    date,
    userId: 'test-user',
  });

  const mockEnergyData: EnergyType[] = [
    createReading(new Date(2024, 0, 31), 1000, 'power'),
    createReading(new Date(2024, 0, 31), 500, 'gas'),
    createReading(new Date(2024, 1, 29), 1100, 'power'),
    createReading(new Date(2024, 1, 29), 550, 'gas'),
  ];

  const mockCalculateMonthlyReadings = MonthlyDataAggregationService.calculateMonthlyReadings as jest.MockedFunction<
    typeof MonthlyDataAggregationService.calculateMonthlyReadings
  >;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementation
    mockCalculateMonthlyReadings.mockImplementation((data, year, type) => {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthLabel: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        meterReading: i < 2 ? (type === 'power' ? 1000 + i * 100 : 500 + i * 50) : null,
        isActual: i < 2,
        isInterpolated: false,
        isExtrapolated: false,
      }));
    });
  });

  describe('Rendering', () => {
    it('renders without crashing with valid data', () => {
      const { container } = render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023]}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('renders two charts (Power and Gas)', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023]}
        />
      );

      const charts = screen.getAllByTestId('chart-mock');
      expect(charts).toHaveLength(2);
    });

    it('renders chart headings for Power and Gas', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023]}
        />
      );

      expect(screen.getByText(/Power Meter Readings/i)).toBeInTheDocument();
      expect(screen.getByText(/Gas Meter Readings/i)).toBeInTheDocument();
    });

    it('renders year navigation controls', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023]}
        />
      );

      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByTitle('Previous year')).toBeInTheDocument();
      expect(screen.getByTitle('Next year')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={[]}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[]}
        />
      );

      expect(screen.getByText(/No meter readings available/i)).toBeInTheDocument();
    });

    it('renders legend with actual and interpolated indicators', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023]}
        />
      );

      expect(screen.getByText('Actual')).toBeInTheDocument();
      expect(screen.getByText('Interpolated')).toBeInTheDocument();
      expect(screen.getByText('Extrapolated')).toBeInTheDocument();
    });
  });

  describe('Year Navigation', () => {
    it('calls onYearChange when year dropdown is clicked', () => {
      const onYearChange = jest.fn();

      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={onYearChange}
          availableYears={[2024, 2023, 2022]}
        />
      );

      const yearButton = screen.getByText('2024');
      fireEvent.click(yearButton);

      // Dropdown should appear
      const year2023 = screen.getByText('2023');
      fireEvent.click(year2023);

      expect(onYearChange).toHaveBeenCalledWith(2023);
    });

    it('calls onYearChange when previous year button is clicked', () => {
      const onYearChange = jest.fn();

      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={onYearChange}
          availableYears={[2024, 2023, 2022]} // Sorted descending
        />
      );

      const prevButton = screen.getByTitle('Previous year');
      fireEvent.click(prevButton);

      expect(onYearChange).toHaveBeenCalledWith(2023);
    });

    it('calls onYearChange when next year button is clicked', () => {
      const onYearChange = jest.fn();

      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2023}
          onYearChange={onYearChange}
          availableYears={[2024, 2023, 2022]}
        />
      );

      const nextButton = screen.getByTitle('Next year');
      fireEvent.click(nextButton);

      expect(onYearChange).toHaveBeenCalledWith(2024);
    });

    it('disables previous button at oldest year', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2022}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023, 2022]} // 2022 is last (oldest)
        />
      );

      const prevButton = screen.getByTitle('Previous year') as HTMLButtonElement;
      expect(prevButton.disabled).toBe(true);
    });

    it('disables next button at newest year', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023, 2022]} // 2024 is first (newest)
        />
      );

      const nextButton = screen.getByTitle('Next year') as HTMLButtonElement;
      expect(nextButton.disabled).toBe(true);
    });
  });

  describe('Data Processing', () => {
    it('calls calculateMonthlyReadings for Power data', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024]}
        />
      );

      expect(mockCalculateMonthlyReadings).toHaveBeenCalledWith(mockEnergyData, 2024, 'power');
    });

    it('calls calculateMonthlyReadings for Gas data', () => {
      render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024]}
        />
      );

      expect(mockCalculateMonthlyReadings).toHaveBeenCalledWith(mockEnergyData, 2024, 'gas');
    });

    it('recalculates when year changes', () => {
      const { rerender } = render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023]}
        />
      );

      mockCalculateMonthlyReadings.mockClear();

      rerender(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2023}
          onYearChange={jest.fn()}
          availableYears={[2024, 2023]}
        />
      );

      expect(mockCalculateMonthlyReadings).toHaveBeenCalledWith(mockEnergyData, 2023, 'power');
      expect(mockCalculateMonthlyReadings).toHaveBeenCalledWith(mockEnergyData, 2023, 'gas');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders on narrow screens', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      const { container } = render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024]}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('renders on wide screens', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));

      const { container } = render(
        <MonthlyMeterReadingsChart
          energyData={mockEnergyData}
          selectedYear={2024}
          onYearChange={jest.fn()}
          availableYears={[2024]}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });
});
