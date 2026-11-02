import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import Dashboard from '../Dashboard';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('solid-chartjs', () => ({ Bar: () => <div data-testid="dashboard-chart" /> }));
vi.mock('../../components/TimeRangeCostCard', () => ({ default: () => <div /> }));
vi.mock('../../components/UnifiedImportModal', () => ({ default: () => null }));

global.fetch = vi.fn();

function renderDashboard() {
  window.history.replaceState({}, '', '/');
  return render(() => (
    <Router>
      <Route path="/" component={() => (
        <ToastProvider>
          <Dashboard />
        </ToastProvider>
      )} />
    </Router>
  ));
}

describe('Dashboard navigation', () => {
  afterEach(() => {
    cleanup();
    vi.mocked(fetch).mockReset();
  });

  it('uses the standard add-reading label without duplicate management cards', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        meters: [{ _id: 'm1', name: 'Main meter', type: 'power', unit: 'kWh' }],
        readings: [],
        contracts: [],
        aggregates: { yearlyHistory: [] },
      }),
    } as Response);

    renderDashboard();

    expect(await screen.findByText('Projected Yearly Cost')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add reading' })).toHaveAttribute('href', '/add-reading');
    expect(screen.queryByText('Meter management')).not.toBeInTheDocument();
    expect(screen.queryByText('Contract management')).not.toBeInTheDocument();
  });
});
