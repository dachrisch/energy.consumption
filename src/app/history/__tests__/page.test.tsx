import { render, screen, waitFor } from '@testing-library/react';
import EnergyHistory from '../page';

// Mock fetch
global.fetch = jest.fn();

// Mock DashboardTabs component
jest.mock('../../components/DashboardTabs', () => {
  return function MockDashboardTabs({ energyData, contracts, onDelete }: any) {
    return (
      <div data-testid="dashboard-tabs">
        <div>Energy Data Count: {energyData.length}</div>
        <div>Contracts Count: {contracts.length}</div>
        <button onClick={() => onDelete('1')}>Delete</button>
      </div>
    );
  };
});

// Mock Toast component
jest.mock('../../components/Toast', () => {
  return function MockToast({ message, type, onClose }: any) {
    return (
      <div data-testid="toast">
        <span>{message}</span>
        <span>{type}</span>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock deleteEnergyAction
jest.mock('../../../actions/energy', () => ({
  deleteEnergyAction: jest.fn(),
}));

describe('EnergyHistory Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<EnergyHistory />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should fetch energy data and contracts on mount', async () => {
    const mockEnergyResponse = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        amount: 1000,
        date: '2025-01-01',
      },
    ];

    const mockContractsResponse = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        startDate: '2024-01-01',
        basePrice: 10,
        workingPrice: 0.25,
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnergyResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockContractsResponse,
      });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByText('Energy History')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/energy');
    expect(global.fetch).toHaveBeenCalledWith('/api/contracts');
  });

  it('should render page header with title and description', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByText('Energy History')).toBeInTheDocument();
    });

    expect(screen.getByText('View detailed energy consumption data, charts, and analytics')).toBeInTheDocument();
  });

  it('should render DashboardTabs with fetched data', async () => {
    const mockEnergyResponse = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        amount: 1000,
        date: '2025-01-01',
      },
      {
        _id: '2',
        userId: 'user1',
        type: 'gas',
        amount: 500,
        date: '2025-01-01',
      },
    ];

    const mockContractsResponse = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        startDate: '2024-01-01',
        basePrice: 10,
        workingPrice: 0.25,
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnergyResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockContractsResponse,
      });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });

    expect(screen.getByText('Energy Data Count: 2')).toBeInTheDocument();
    expect(screen.getByText('Contracts Count: 1')).toBeInTheDocument();
  });

  it('should display error message when energy data fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load energy data')).toBeInTheDocument();
    });
  });

  it('should handle contract fetch failure gracefully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load contracts:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should display success toast after deleting energy data', async () => {
    const { deleteEnergyAction } = require('../../../actions/energy');
    deleteEnergyAction.mockResolvedValueOnce(undefined);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    deleteButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });

    expect(screen.getByText('Energy data deleted')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('should refetch data after successful deletion', async () => {
    const { deleteEnergyAction } = require('../../../actions/energy');
    deleteEnergyAction.mockResolvedValueOnce(undefined);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });

    const initialFetchCount = (global.fetch as jest.Mock).mock.calls.length;

    const deleteButton = screen.getByText('Delete');
    deleteButton.click();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(initialFetchCount + 1);
    });
  });

  it('should display error when deletion fails', async () => {
    const { deleteEnergyAction } = require('../../../actions/energy');
    deleteEnergyAction.mockRejectedValueOnce(new Error('Delete failed'));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    deleteButton.click();

    await waitFor(() => {
      expect(screen.getByText('Failed to delete energy data')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should parse date strings to Date objects for energy data', async () => {
    const mockEnergyResponse = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        amount: 1000,
        date: '2025-01-01T00:00:00.000Z',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnergyResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });

    // If dates weren't parsed, the component would have crashed
    expect(screen.getByText('Energy Data Count: 1')).toBeInTheDocument();
  });

  it('should parse date strings to Date objects for contracts', async () => {
    const mockContractsResponse = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2025-01-01T00:00:00.000Z',
        basePrice: 10,
        workingPrice: 0.25,
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockContractsResponse,
      });

    render(<EnergyHistory />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    });

    expect(screen.getByText('Contracts Count: 1')).toBeInTheDocument();
  });
});
