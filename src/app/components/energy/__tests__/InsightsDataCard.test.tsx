import React from 'react';
import { render, screen } from '@testing-library/react';
import InsightsDataCard from '../InsightsDataCard';
import { InsightDataPoint } from '@/app/types';

describe('InsightsDataCard', () => {
  const mockActualPoint: InsightDataPoint = {
    month: 0,
    year: 2024,
    monthLabel: 'Jan',
    consumption: 300.5,
    cost: 100.25,
    type: 'actual',
    isForecast: false
  };

  const mockProjectedPoint: InsightDataPoint = {
    month: 5,
    year: 2024,
    monthLabel: 'Jun',
    consumption: 250.0,
    cost: 85.00,
    type: 'projected',
    isForecast: true
  };

  it('renders actual data correctly', () => {
    render(<InsightsDataCard point={mockActualPoint} energyType="power" />);
    
    expect(screen.getByText('Jan 2024')).toBeInTheDocument();
    expect(screen.getByText('300.5')).toBeInTheDocument();
    expect(screen.getByText('€100.25')).toBeInTheDocument();
    expect(screen.getByText('actual')).toBeInTheDocument();
    expect(screen.getByText('Historical Data')).toBeInTheDocument();
  });

  it('renders projected data correctly', () => {
    render(<InsightsDataCard point={mockProjectedPoint} energyType="power" />);
    
    expect(screen.getByText('Jun 2024')).toBeInTheDocument();
    expect(screen.getByText('250.0')).toBeInTheDocument();
    expect(screen.getByText('€85.00')).toBeInTheDocument();
    expect(screen.getByText('projected')).toBeInTheDocument();
    expect(screen.getByText('Forecast Period')).toBeInTheDocument();
    expect(screen.getByText(/Based on current usage trends/i)).toBeInTheDocument();
  });

  it('shows correct units for gas', () => {
    render(<InsightsDataCard point={mockActualPoint} energyType="gas" />);
    expect(screen.getByText('m³')).toBeInTheDocument();
  });
});
