import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import MeterDetail from '../MeterDetail';

vi.mock('../../components/ConsumptionChart', () => ({
  default: () => <div data-testid="consumption-chart" />,
}));

global.fetch = vi.fn();

const meter = {
  _id: 'm1',
  name: 'Main meter',
  meterNumber: '001',
  type: 'power',
  unit: 'kWh',
  stats: { dailyAverage: 1, yearlyProjection: 365, estimatedYearlyCost: 100, dailyCost: 0.2 },
};

const contract = {
  _id: 'c1',
  supplierId: { _id: 's1', name: 'Supplier One' },
  providerName: 'Supplier One',
  startDate: '2024-01-01T00:00:00.000Z',
  basePrice: 10,
  workingPrice: 0.3,
  meterId: 'm1',
};

function mockApi() {
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    const json = url.startsWith('/api/meters')
      ? [meter]
      : url.startsWith('/api/readings')
        ? []
        : [contract];
    return { ok: true, json: async () => json } as Response;
  });
}

function renderDetail(path = '/meters/m1') {
  window.history.replaceState({}, '', path);
  return render(() => (
    <Router>
      <Route path="/meters/:id" component={MeterDetail} />
    </Router>
  ));
}

describe('Meter detail page', () => {
  afterEach(() => {
    cleanup();
    vi.mocked(fetch).mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('renders overview, history, and contracts links', async () => {
    mockApi();
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Main meter' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/meters/m1');
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/meters/m1/readings');
    expect(screen.getByRole('link', { name: 'Contracts' })).toHaveAttribute('href', '/meters/m1?tab=contracts');
    expect(screen.getByRole('link', { name: 'Add reading' })).toHaveAttribute('href', '/meters/m1/add-reading');
  });

  it('lists contract edit and supplier links on the contracts tab', async () => {
    mockApi();
    renderDetail('/meters/m1?tab=contracts');

    expect(await screen.findByRole('link', { name: 'Supplier One' })).toHaveAttribute('href', '/contracts/s1');
    expect(screen.getByRole('link', { name: 'Edit Supplier One contract' })).toHaveAttribute('href', '/contracts/c1/edit');
    expect(screen.queryByTestId('consumption-chart')).not.toBeInTheDocument();
  });
});
