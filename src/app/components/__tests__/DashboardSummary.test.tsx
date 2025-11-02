import { render, screen, fireEvent } from '@testing-library/react';
import DashboardSummary from '../DashboardSummary';
import { EnergyType, ContractType } from '../../types';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('DashboardSummary', () => {
  // Use current month for accurate consumption calculations
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const midMonth = new Date(now.getFullYear(), now.getMonth(), 15);

  const mockEnergyData: EnergyType[] = [
    {
      _id: '1',
      userId: 'user1',
      type: 'power',
      amount: 1000,
      date: firstDayOfMonth,
    },
    {
      _id: '2',
      userId: 'user1',
      type: 'power',
      amount: 1100,
      date: midMonth,
    },
    {
      _id: '3',
      userId: 'user1',
      type: 'gas',
      amount: 500,
      date: firstDayOfMonth,
    },
    {
      _id: '4',
      userId: 'user1',
      type: 'gas',
      amount: 600,
      date: midMonth,
    },
  ];

  const mockContracts: ContractType[] = [
    {
      _id: '1',
      userId: 'user1',
      type: 'power',
      startDate: new Date('2024-01-01'),
      basePrice: 10,
      workingPrice: 0.25,
    },
    {
      _id: '2',
      userId: 'user1',
      type: 'gas',
      startDate: new Date('2024-01-01'),
      basePrice: 5,
      workingPrice: 0.15,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the dashboard title and subtitle', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Energy Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your energy consumption and costs')).toBeInTheDocument();
  });

  it('should display total readings count', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Total Readings')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should display latest power reading', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Latest Power Reading')).toBeInTheDocument();
    expect(screen.getByText('1100.00 kWh')).toBeInTheDocument();
  });

  it('should display latest gas reading', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Latest Gas Reading')).toBeInTheDocument();
    expect(screen.getByText('600.00 m³')).toBeInTheDocument();
  });

  it('should display active contracts count', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Active Contracts')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Currently active')).toBeInTheDocument();
  });

  it('should calculate and display monthly power consumption', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Power Consumption')).toBeInTheDocument();
    expect(screen.getByText('100.00 kWh')).toBeInTheDocument();
  });

  it('should calculate and display monthly gas consumption', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Gas Consumption')).toBeInTheDocument();
    expect(screen.getByText('100.00 m³')).toBeInTheDocument();
  });

  it('should calculate and display estimated cost', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Estimated Cost')).toBeInTheDocument();
    // Power: 10 + (100 * 0.25) = 35
    // Gas: 5 + (100 * 0.15) = 20
    // Total: 55
    expect(screen.getByText('€55.00')).toBeInTheDocument();
  });

  it('should navigate to /readings when Total Readings card is clicked', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    const totalReadingsCard = screen.getByText('Total Readings').closest('.metric-card');
    fireEvent.click(totalReadingsCard!);

    expect(mockPush).toHaveBeenCalledWith('/readings');
  });

  it('should navigate to /contracts when Active Contracts card is clicked', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    const activeContractsCard = screen.getByText('Active Contracts').closest('.metric-card');
    fireEvent.click(activeContractsCard!);

    expect(mockPush).toHaveBeenCalledWith('/contracts');
  });

  it('should render quick action buttons', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('Add Reading')).toBeInTheDocument();
    expect(screen.getByText('View Readings')).toBeInTheDocument();
    expect(screen.getByText('Manage Contracts')).toBeInTheDocument();
  });

  it('should navigate to /add when Add Reading button is clicked', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    const addReadingButton = screen.getByText('Add Reading').closest('button');
    fireEvent.click(addReadingButton!);

    expect(mockPush).toHaveBeenCalledWith('/add');
  });

  it('should navigate to /readings when View Readings button is clicked', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    const viewReadingsButton = screen.getByText('View Readings').closest('button');
    fireEvent.click(viewReadingsButton!);

    expect(mockPush).toHaveBeenCalledWith('/readings');
  });

  it('should navigate to /contracts when Manage Contracts button is clicked', () => {
    render(<DashboardSummary energyData={mockEnergyData} contracts={mockContracts} />);

    const manageContractsButton = screen.getByText('Manage Contracts').closest('button');
    fireEvent.click(manageContractsButton!);

    expect(mockPush).toHaveBeenCalledWith('/contracts');
  });

  it('should display "No data" when there are no power readings', () => {
    const noDataEnergyData = mockEnergyData.filter(d => d.type !== 'power');
    render(<DashboardSummary energyData={noDataEnergyData} contracts={mockContracts} />);

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should display "Insufficient data" for consumption when less than 2 readings exist', () => {
    const singleReading: EnergyType[] = [mockEnergyData[0]];
    render(<DashboardSummary energyData={singleReading} contracts={mockContracts} />);

    expect(screen.getAllByText('Insufficient data').length).toBeGreaterThan(0);
  });

  it('should not display estimated cost when there is insufficient consumption data', () => {
    const singleReading: EnergyType[] = [mockEnergyData[0]];
    render(<DashboardSummary energyData={singleReading} contracts={mockContracts} />);

    expect(screen.queryByText('ESTIMATED COST')).not.toBeInTheDocument();
  });

  it('should only count contracts that are currently active', () => {
    const contractsWithExpired: ContractType[] = [
      ...mockContracts,
      {
        _id: '3',
        userId: 'user1',
        type: 'power',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2021-01-01'), // Expired
        basePrice: 10,
        workingPrice: 0.25,
      },
    ];

    render(<DashboardSummary energyData={mockEnergyData} contracts={contractsWithExpired} />);

    // Should still show 2 active contracts (the expired one shouldn't be counted)
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
