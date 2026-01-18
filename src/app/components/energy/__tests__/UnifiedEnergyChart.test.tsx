import React from 'react';
import { render, screen } from '@testing-library/react';
import UnifiedEnergyChart from '../UnifiedEnergyChart';
import { UnifiedInsightData } from '@/app/types';

// Mock Chart.js to avoid rendering complexity in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: { data: any; options: any }) => (
    <div 
      data-testid="chart-mock" 
      data-chart-data={JSON.stringify(data)} 
      data-chart-options={JSON.stringify(options)}
    >
      Mocked Chart
    </div>
  ),
}));

describe('UnifiedEnergyChart', () => {
  const mockData: UnifiedInsightData = {
    energyType: 'power',
    points: [
      { month: 0, year: 2024, monthLabel: 'Jan', consumption: 300, cost: 100, type: 'actual', isForecast: false },
      { month: 1, year: 2024, monthLabel: 'Feb', consumption: 280, cost: 95, type: 'actual', isForecast: false },
      { month: 2, year: 2024, monthLabel: 'Mar', consumption: 310, cost: 105, type: 'projected', isForecast: true },
      { month: 3, year: 2024, monthLabel: 'Apr', consumption: 305, cost: 102, type: 'projected', isForecast: true },
    ],
    summary: {
      periodActual: 580,
      periodProjected: 615,
      periodTotal: 1195,
      periodCost: 402
    }
  };

  it('renders without crashing', () => {
    const { container } = render(<UnifiedEnergyChart data={mockData} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('chart-mock')).toBeInTheDocument();
  });

  it('displays the correct energy type in the heading', () => {
    render(<UnifiedEnergyChart data={mockData} />);
    expect(screen.getByText(/Power Consumption/i)).toBeInTheDocument();
  });

  it('passes correct labels and data to Chart.js', () => {
    render(<UnifiedEnergyChart data={mockData} />);
    const chart = screen.getByTestId('chart-mock');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
    
    expect(chartData.labels).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
    expect(chartData.datasets[0].data).toEqual([300, 280, 310, 305]);
  });

  it('applies different styling for actual vs projected data points', () => {
    render(<UnifiedEnergyChart data={mockData} />);
    const chart = screen.getByTestId('chart-mock');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
    
    // Dataset 0 is the line chart
    const dataset = chartData.datasets[0];
    
    // Points should have different background colors or styles
    // (Actual implementation details will vary, but we expect some distinction)
    expect(dataset.pointBackgroundColor).toBeDefined();
    expect(Array.isArray(dataset.pointBackgroundColor)).toBe(true);
  });
});
