import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import AddReading from '../AddReading';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

global.fetch = vi.fn();
const mockedFetch = vi.mocked(global.fetch);

const meter = {
  _id: 'm1',
  name: 'Power',
  meterNumber: 'P1',
  unit: 'kWh',
  stats: { dailyAverage: 10 },
};

function mockApi(apiReadings: unknown = [
  { _id: 'r1', value: 1000, date: '2026-01-10T00:00:00.000Z', kind: 'regular' },
]) {
  mockedFetch.mockImplementation(async (input) => {
    const url = input.toString();
    const data = url === '/api/meters'
      ? [meter]
      : url.startsWith('/api/readings')
        ? apiReadings
        : { _id: 'u1', name: 'User' };
    return { ok: true, json: async () => data } as Response;
  });
}

function renderPage(path: string) {
  window.history.replaceState({}, '', path);
  const page = () => (
    <AuthProvider>
      <ToastProvider>
        <AddReading />
      </ToastProvider>
    </AuthProvider>
  );
  return render(() => (
    <Router>
      <Route path="/meters/:id/add-reading" component={page} />
      <Route path="/meters/:id/readings/:readingId/edit" component={page} />
    </Router>
  ));
}

const valueInput = () => screen.getByPlaceholderText('0.00') as HTMLInputElement;
const dateInput = () => document.querySelector('input[type="date"]') as HTMLInputElement;

describe('Add and edit reading', () => {
  afterEach(() => {
    cleanup();
    mockedFetch.mockReset();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('shows the last reading below the value field', async () => {
    mockApi();
    renderPage('/meters/m1/add-reading');

    const guidance = await screen.findByText(/Last reading:/);
    expect(guidance.textContent).toContain((1000).toLocaleString());
    expect(guidance.textContent).toContain('kWh');
    expect(guidance.textContent).toContain(new Date('2026-01-10T00:00:00.000Z').toLocaleDateString());
  });

  it('warns without blocking when the value is lower than the last reading', async () => {
    mockApi();
    renderPage('/meters/m1/add-reading');
    await screen.findByText(/Last reading:/);

    fireEvent.input(valueInput(), { target: { value: '900' } });

    expect(await screen.findByText(/lower than the last reading/i)).toBeTruthy();
    expect(screen.getByText(/tick .*new meter/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Reading' })).not.toBeDisabled();
  });

  it('warns when implied daily consumption exceeds ten times the current average', async () => {
    mockApi();
    renderPage('/meters/m1/add-reading');
    await screen.findByText(/Last reading:/);

    fireEvent.input(dateInput(), { target: { value: '2026-01-11' } });
    fireEvent.input(valueInput(), { target: { value: '1200' } });

    expect(await screen.findByText(/more than 10× the current average/i)).toBeTruthy();
  });

  it('creates a meter-change reading when the checkbox is ticked', async () => {
    mockApi();
    renderPage('/meters/m1/add-reading');
    await screen.findByText(/Last reading:/);

    fireEvent.input(valueInput(), { target: { value: '0' } });
    fireEvent.click(screen.getByLabelText(/This is a new meter/));
    fireEvent.click(screen.getByRole('button', { name: 'Save Reading' }));

    await waitFor(() => {
      const call = mockedFetch.mock.calls.find(([url, init]) => url === '/api/readings' && init?.method === 'POST');
      expect(call).toBeDefined();
      expect(JSON.parse(String(call?.[1]?.body)).kind).toBe('meterChange');
    });
  });

  it('loads an existing reading and saves edits with PUT', async () => {
    mockApi([
      { _id: 'rEdit', value: 900, date: '2026-01-10T00:00:00.000Z', kind: 'meterChange' },
      { _id: 'rPrevious', value: 800, date: '2026-01-01T00:00:00.000Z', kind: 'regular' },
    ]);
    renderPage('/meters/m1/readings/rEdit/edit');

    await waitFor(() => expect(valueInput().value).toBe('900'));
    expect((screen.getByLabelText(/This is a new meter/) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Save Reading' }));

    await waitFor(() => {
      const call = mockedFetch.mock.calls.find(([url, init]) => url === '/api/readings/rEdit' && init?.method === 'PUT');
      expect(call).toBeDefined();
      expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({ value: 900, kind: 'meterChange' });
    });
  });
});
