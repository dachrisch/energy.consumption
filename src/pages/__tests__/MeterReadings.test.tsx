import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import MeterReadings from '../MeterReadings';
import { ToastProvider } from '../../context/ToastContext';

global.fetch = vi.fn();

const readings = [
  { _id: 'r2', value: 999, date: '2024-02-01T00:00:00.000Z', source: 'provider' },
  { _id: 'r1', value: 888, date: '2024-01-01T00:00:00.000Z', source: 'manual' },
];

function mockApi() {
  (fetch as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(async (url: string) => ({
    ok: true,
    json: async () => (url.startsWith('/api/meters')
      ? [{ _id: 'm1', name: 'Strom', unit: 'kWh' }]
      : readings),
  }));
}

function renderReadings(path = '/meters/m1/readings') {
  window.history.replaceState({}, '', path);
  return render(() => (
    <Router>
      <Route path="/meters/:id/readings" component={() => (
        <ToastProvider>
          <MeterReadings />
        </ToastProvider>
      )} />
    </Router>
  ));
}

const rowFor = (value: string) => screen.getByText(value).closest('tr');

describe('Meter readings page', () => {
  afterEach(() => {
    cleanup();
    (fetch as unknown as { mockReset: () => void }).mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('shows meter tabs and a consistently labelled add-reading action', async () => {
    mockApi();
    renderReadings();

    expect(await screen.findByText('999')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/meters/m1');
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/meters/m1/readings');
    expect(screen.getByRole('link', { name: 'Contracts' })).toHaveAttribute('href', '/meters/m1?tab=contracts');
    expect(screen.getByRole('link', { name: 'Add reading' })).toHaveAttribute('href', '/meters/m1/add-reading');
  });

  it('labels datapoints that came from a provider document', async () => {
    mockApi();
    renderReadings();

    expect(await screen.findByText('999')).toBeTruthy();
    expect(screen.getByText(/^provider$/i)).toBeTruthy();
    // Only the provider-sourced row carries the badge.
    expect(rowFor('999')?.textContent).toMatch(/provider/i);
    expect(rowFor('888')?.textContent).not.toMatch(/provider/i);
  });

  it('highlights the datapoint addressed by the highlight param', async () => {
    mockApi();
    renderReadings('/meters/m1/readings?highlight=r2');

    expect(await screen.findByText('999')).toBeTruthy();
    expect(rowFor('999')?.className).toContain('bg-primary/10');
    expect(rowFor('888')?.className).not.toContain('bg-primary/10');
  });

  it('matches the highlight param against a reading date too', async () => {
    mockApi();
    renderReadings('/meters/m1/readings?highlight=2024-01-01');

    expect(await screen.findByText('888')).toBeTruthy();
    expect(rowFor('888')?.className).toContain('bg-primary/10');
    expect(rowFor('999')?.className).not.toContain('bg-primary/10');
  });
});
