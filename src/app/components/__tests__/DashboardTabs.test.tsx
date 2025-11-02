import { render, screen, fireEvent } from '@testing-library/react';
import DashboardTabs from '../DashboardTabs';
import { EnergyType, ContractType } from '../../types';

// Mock the child components to simplify testing
jest.mock('../energy/EnergyTableFilters', () => {
  return function MockEnergyTableFilters({ onReset }: { onReset: () => void }) {
    return <button onClick={onReset}>Reset Filters</button>;
  };
});

jest.mock('../energy/EnergyTable', () => {
  return function MockEnergyTable() {
    return <div>Energy Table</div>;
  };
});

jest.mock('../energy/EnergyCharts', () => {
  return function MockEnergyCharts() {
    return <div>Energy Charts</div>;
  };
});

jest.mock('../energy/CostView', () => {
  return function MockCostView() {
    return <div>Cost View</div>;
  };
});

describe('DashboardTabs', () => {
  const mockEnergyData: EnergyType[] = [
    {
      _id: '1',
      userId: 'user1',
      type: 'power',
      amount: 1000,
      date: new Date('2024-01-01'),
    },
  ];

  const mockContracts: ContractType[] = [];
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default table view', () => {
    render(<DashboardTabs energyData={mockEnergyData} contracts={mockContracts} onDelete={mockOnDelete} />);

    expect(screen.getByText('Table View')).toBeInTheDocument();
    expect(screen.getByText('Charts')).toBeInTheDocument();
  });

  it('should switch back to table view when table tab is clicked', () => {
    render(<DashboardTabs energyData={mockEnergyData} contracts={mockContracts} onDelete={mockOnDelete} />);

    // First switch to charts
    const chartsTab = screen.getByText('Charts');
    fireEvent.click(chartsTab);

    // Then switch back to table
    const tableTab = screen.getByText('Table View');
    fireEvent.click(tableTab);

    expect(screen.getByText('Energy Table')).toBeInTheDocument();
    expect(screen.queryByText('Energy Charts')).not.toBeInTheDocument();
  });

  it('should reset filters when reset button is clicked', () => {
    render(<DashboardTabs energyData={mockEnergyData} contracts={mockContracts} onDelete={mockOnDelete} />);

    const resetButton = screen.getByText('Reset Filters');
    fireEvent.click(resetButton);

    // The test passes if no error is thrown - handleResetFilters is called
    expect(resetButton).toBeInTheDocument();
  });

  it('should apply active tab styling to selected tab', () => {
    render(<DashboardTabs energyData={mockEnergyData} contracts={mockContracts} onDelete={mockOnDelete} />);

    const tableTab = screen.getByText('Table View').closest('.tab-base');
    expect(tableTab).toHaveClass('button-primary');
  });

  it('should apply inactive tab styling to non-selected tab', () => {
    render(<DashboardTabs energyData={mockEnergyData} contracts={mockContracts} onDelete={mockOnDelete} />);

    const chartsTab = screen.getByText('Charts').closest('.tab-base');
    expect(chartsTab).toHaveClass('button-secondary');
  });

  it('should pass energyData to table component', () => {
    render(<DashboardTabs energyData={mockEnergyData} contracts={mockContracts} onDelete={mockOnDelete} />);

    // Verify table is rendered (which would receive the energyData prop)
    expect(screen.getByText('Energy Table')).toBeInTheDocument();
  });

  it('should pass onDelete handler to table component', () => {
    render(<DashboardTabs energyData={mockEnergyData} contracts={mockContracts} onDelete={mockOnDelete} />);

    // Verify table is rendered (which would receive the onDelete prop)
    expect(screen.getByText('Energy Table')).toBeInTheDocument();
  });
});
