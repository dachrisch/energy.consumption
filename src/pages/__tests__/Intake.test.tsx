import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import Intake from '../Intake';
import { ToastProvider } from '../../context/ToastContext';

global.fetch = vi.fn();

const providers = [
  {
    name: 'Stadtwerke',
    senders: ['rechnung@stadtwerke.example'],
    subjectHints: ['Abrechnung'],
    gmailQuery: null,
    unit: 'kWh',
    contractCount: 1,
    meterIds: ['m1'],
  },
];

const items = [
  {
    _id: 'i1', documentId: 'd1', kind: 'reading', value: 500, unit: 'kWh', date: '2024-01-01T00:00:00.000Z',
    meterNumber: '1-234-567', meterId: 'm1', status: 'pending', note: 'Matches nothing yet', userId: 'u1',
  },
  {
    _id: 'i2', documentId: 'd1', kind: 'reading', value: 620, unit: 'kWh', date: '2024-02-01T00:00:00.000Z',
    status: 'conflict', note: 'Existing reading is 610', userId: 'u1',
  },
];

const documents = [
  { _id: 'd1', fileName: 'lastgang.csv', mimeType: 'text/csv', status: 'parsed', subject: 'Ihre Abrechnung', receivedAt: '2024-02-10T00:00:00.000Z' },
  { _id: 'd2', fileName: 'bill.pdf', mimeType: 'application/pdf', status: 'failed', error: 'PDF extraction needs a Gemini API key', receivedAt: '2024-02-09T00:00:00.000Z' },
];

const bills = [
  {
    _id: 'b1', meterId: 'm1', periodStart: '2024-01-01T00:00:00.000Z', periodEnd: '2024-03-31T00:00:00.000Z',
    consumption: 100, unit: 'kWh', amountGross: 50, currency: 'EUR',
    expected: 65.48, variance: { absolute: -15.48, percent: -23.64 },
  },
];

interface Call {
  url: string;
  method: string;
  body?: string;
}

function mockApi(overrides: Record<string, (call: Call) => unknown> = {}) {
  const calls: Call[] = [];
  (fetch as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(async (input: string, init?: RequestInit) => {
    const call: Call = { url: String(input), method: init?.method ?? 'GET', body: init?.body as string | undefined };
    calls.push(call);
    const handler = overrides[`${call.method} ${call.url.split('?')[0]}`] ?? overrides[`${call.method} ${call.url}`];
    const payload = handler
      ? handler(call)
      : {
          '/api/providers': { providers },
          '/api/intake/items': { items },
          '/api/intake/documents': { documents },
          '/api/intake/bills': { bills },
        }[call.url.split('?')[0]] ?? {};
    return { ok: true, status: 200, json: async () => payload };
  });
  return calls;
}

const renderIntake = () =>
  render(() => (
    <Router>
      <Route path="/" component={() => (
        <ToastProvider>
          <Intake />
        </ToastProvider>
      )} />
    </Router>
  ));

describe('Intake page', () => {
  afterEach(() => {
    cleanup();
    (fetch as unknown as { mockReset: () => void }).mockReset();
  });

  it('lists providers, staged items and ingested documents', async () => {
    mockApi();
    renderIntake();

    expect(await screen.findByText('Stadtwerke')).toBeTruthy();
    expect(screen.getByText('500 kWh')).toBeTruthy();
    expect(screen.getByText('620 kWh')).toBeTruthy();
    expect(screen.getByText('lastgang.csv')).toBeTruthy();
    expect(screen.getByText('PDF extraction needs a Gemini API key')).toBeTruthy();
  });

  it('shows the metered variance next to the billed amount', async () => {
    mockApi();
    renderIntake();

    expect(await screen.findByText('50.00 EUR')).toBeTruthy();
    expect(screen.getByText('65.48 EUR')).toBeTruthy();
    expect(screen.getByText(/\(-23\.6%\)/)).toBeTruthy();
  });

  it('asks for the staged items only, unless decided items are requested', async () => {
    const calls = mockApi();
    renderIntake();
    await screen.findByText('Stadtwerke');

    expect(calls.some((call) => call.url === '/api/intake/items?status=pending,conflict')).toBe(true);

    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => {
      expect(calls.some((call) => call.url === '/api/intake/items')).toBe(true);
    });
  });

  it('saves mail settings for a provider through the PATCH endpoint', async () => {
    const calls = mockApi({
      'PATCH /api/providers': () => ({
        provider: {
          name: 'Stadtwerke',
          senders: ['a@b.example', 'c@d.example'],
          subjectHints: [],
          gmailQuery: null,
          contractCount: 1,
          meterIds: ['m1'],
        },
        contractsUpdated: 1,
      }),
    });
    renderIntake();
    await screen.findByText('Stadtwerke');
    expect(screen.getByText(/1 contract/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /mail settings/i }));
    fireEvent.input(screen.getByPlaceholderText(/sender addresses/i), { target: { value: 'a@b.example, c@d.example' } });
    fireEvent.input(screen.getByPlaceholderText(/subject hints/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH' && call.url === '/api/providers')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH' && call.url === '/api/providers');
    expect(JSON.parse(patch?.body ?? '{}')).toEqual({
      providerName: 'Stadtwerke',
      senders: ['a@b.example', 'c@d.example'],
      subjectHints: [],
      gmailQuery: null,
    });
  });

  it('points at contracts when no provider exists yet', async () => {
    mockApi({ 'GET /api/providers': () => ({ providers: [], count: 0 }) });
    renderIntake();

    expect(await screen.findByText(/providers come from your contracts/i)).toBeTruthy();
    const link = screen.getByRole('link', { name: /add a contract/i });
    expect(link.getAttribute('href')).toBe('/contracts/add');
  });

  it('accepts a staged item through the accept endpoint', async () => {
    const calls = mockApi({ 'POST /api/intake/items/i1/accept': () => ({ item: { id: 'i1', status: 'accepted' } }) });
    renderIntake();
    await screen.findByText('500 kWh');

    const acceptButtons = screen.getAllByRole('button', { name: /^accept$/i });
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/intake/items/i1/accept')).toBe(true);
    });
  });

  it('runs a sync for a provider and reports the result', async () => {
    const calls = mockApi({
      'POST /api/intake/sync': () => ({
        provider: 'Stadtwerke',
        count: 1,
        processed: [{ messageId: 'm1', attachment: 'lastgang.csv', status: 'parsed' }],
      }),
    });
    renderIntake();
    await screen.findByText('Stadtwerke');

    fireEvent.click(screen.getByRole('button', { name: /sync now/i }));

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/intake/sync')).toBe(true);
    });
    const sync = calls.find((call) => call.url === '/api/intake/sync');
    expect(JSON.parse(sync?.body ?? '{}')).toEqual({ providerName: 'Stadtwerke' });
    expect(await screen.findByText(/last sync/i)).toBeTruthy();
  });
});
