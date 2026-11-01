import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import Intake from '../Intake';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

global.fetch = vi.fn();

const session = { _id: 'u1', name: 'Chris', email: 'chris@example.com' };

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

function mockApi(
  overrides: Record<string, (call: Call) => unknown> = {},
  sessionUser: Record<string, unknown> = session,
) {
  const calls: Call[] = [];
  (fetch as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(async (input: string, init?: RequestInit) => {
    const call: Call = { url: String(input), method: init?.method ?? 'GET', body: init?.body as string | undefined };
    calls.push(call);
    const handler = overrides[`${call.method} ${call.url.split('?')[0]}`] ?? overrides[`${call.method} ${call.url}`];
    const payload = handler
      ? handler(call)
      : {
          '/api/session': sessionUser,
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
        <AuthProvider>
          <ToastProvider>
            <Intake />
          </ToastProvider>
        </AuthProvider>
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

    // The stacked mobile list and the desktop table both render the values.
    expect((await screen.findAllByText('50.00 EUR')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('65.48 EUR').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\(-23\.6%\)/).length).toBeGreaterThan(0);
  });

  it('stacks the billed period so the values stay readable on phones', async () => {
    mockApi();
    renderIntake();

    const stacked = await screen.findByTestId('bills-stacked');
    expect(stacked.textContent).toContain('50.00 EUR');
    expect(stacked.textContent).toContain('65.48 EUR');
    expect(stacked.textContent).toContain('100 kWh');
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

  it('links a staged reading to the datapoint on the meter readings page', async () => {
    mockApi();
    renderIntake();

    const link = await screen.findByRole('link', { name: /view reading/i });

    // i1 has a meter but no matched reading, so the date is the highlight target.
    expect(link.getAttribute('href')).toBe('/meters/m1/readings?highlight=2024-01-01');
  });

  it('links archived documents to their Drive copy', async () => {
    mockApi({
      'GET /api/intake/documents': () => ({
        documents: [
          { ...documents[0], driveWebLink: 'https://drive.google.com/file/d/full-link/view' },
          { ...documents[1], driveFileId: 'id-only' },
        ],
      }),
    });
    renderIntake();

    const links = await screen.findAllByRole('link', { name: /^drive$/i });

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://drive.google.com/file/d/full-link/view',
      'https://drive.google.com/file/d/id-only/view',
    ]);
    expect(links.every((link) => link.getAttribute('target') === '_blank')).toBe(true);
  });

  it('archives a document that has no Drive copy yet', async () => {
    const calls = mockApi({
      'POST /api/intake/documents/archive': () => ({ archived: 1, failed: 0, documents: [] }),
    });
    renderIntake();
    await screen.findByText('lastgang.csv');

    const saveButtons = screen.getAllByRole('button', { name: /save to drive/i });
    // Only parsed documents are archived; the failed one offers no action.
    expect(saveButtons).toHaveLength(1);
    expect(screen.getByText('bill.pdf').closest('li')?.querySelector('button')).toBeNull();
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/intake/documents/archive')).toBe(true);
    });
    const archive = calls.find((call) => call.url === '/api/intake/documents/archive');
    expect(JSON.parse(archive?.body ?? '{}')).toEqual({ documentId: 'd1' });
  });

  it('explains why a parsed document could not be archived', async () => {
    mockApi({
      'POST /api/intake/documents/archive': () => ({
        archived: 0,
        failed: 1,
        documents: [{ documentId: 'd1', status: 'failed', error: 'Original is no longer available in Gmail' }],
      }),
    });
    renderIntake();
    await screen.findByText('lastgang.csv');

    fireEvent.click(screen.getByRole('button', { name: /save to drive/i }));

    expect(await screen.findByText(/Original is no longer available in Gmail/)).toBeTruthy();
  });
});

/**
 * @solidjs/router intercepts same-origin anchor clicks client-side. These links
 * point at an API redirect, so they must opt out with rel="external" — without
 * it the URL changes but no request is made and the page goes blank.
 */
describe('Intake — Google connection', () => {
  afterEach(() => {
    cleanup();
    (fetch as unknown as { mockReset: () => void }).mockReset();
  });

  it('offers the connect link and opts it out of client-side routing', async () => {
    mockApi();
    renderIntake();

    const link = await screen.findByRole('link', { name: /connect google/i });

    expect(link.getAttribute('href')).toBe('/api/google/connect');
    expect(link.getAttribute('rel')).toBe('external');
  });

  it('asks for a reconnect when the authorization expired', async () => {
    mockApi({}, { ...session, google: { status: 'reconnect_required' } });
    renderIntake();

    const expired = await screen.findByRole('link', { name: /reconnect google/i });
    expect(expired.getAttribute('rel')).toBe('external');
    expect(expired.getAttribute('href')).toBe('/api/google/connect');
  });

  it('shows the connected state and lets the account reconnect', async () => {
    mockApi({}, { ...session, google: { status: 'ok', email: 'chris@example.com' } });
    renderIntake();

    expect(await screen.findByText(/google connected/i)).toBeTruthy();
    expect(screen.getByText('chris@example.com')).toBeTruthy();

    const connected = screen.getByRole('link', { name: /^reconnect$/i });
    expect(connected.getAttribute('rel')).toBe('external');
    expect(connected.getAttribute('href')).toBe('/api/google/connect');
  });
});
