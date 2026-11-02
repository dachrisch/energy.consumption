import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import SupplierDetail from '../SupplierDetail';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

global.fetch = vi.fn();

const session = { _id: 'u1', name: 'Chris', email: 'chris@example.com' };

const supplier = {
  _id: 's1',
  name: 'Stadtwerke',
  senders: ['rechnung@stadtwerke.example'],
  subjectHints: ['Abrechnung'],
  gmailQuery: null,
  contractCount: 1,
  stagedCount: 0,
  meterIds: ['m1'],
};

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

const meters = [
  { _id: 'm1', name: 'Therme', meterNumber: 'SWM 600044', type: 'gas', unit: 'm³' },
  { _id: 'm2', name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh' },
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
          '/api/meters': meters,
          '/api/suppliers/s1': { supplier, contracts: [] },
          '/api/intake/items': { items },
          '/api/intake/documents': { documents },
          '/api/intake/bills': { bills },
        }[call.url.split('?')[0]] ?? {};
    return { ok: true, status: 200, json: async () => payload };
  });
  return calls;
}

const renderSupplier = () =>
  render(() => (
    <Router>
      <Route path="/suppliers/:id" component={() => (
        <AuthProvider>
          <ToastProvider>
            <SupplierDetail />
          </ToastProvider>
        </AuthProvider>
      )} />
    </Router>
  ));

describe('Supplier detail page', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/suppliers/s1');
  });

  afterEach(() => {
    cleanup();
    (fetch as unknown as { mockReset: () => void }).mockReset();
    // Restore the URL so later suites in the same worker (isolate: false) are unaffected.
    window.history.pushState({}, '', '/');
  });

  it('lists the supplier, staged items and ingested documents', async () => {
    mockApi();
    renderSupplier();

    expect(await screen.findByText('Stadtwerke')).toBeTruthy();
    expect(await screen.findByText('500 kWh')).toBeTruthy();
    expect(await screen.findByText('620 kWh')).toBeTruthy();
    expect(await screen.findByText('lastgang.csv')).toBeTruthy();
    expect(await screen.findByText('PDF extraction needs a Gemini API key')).toBeTruthy();
  });

  it('explains which supplier emails are imported in plain language', async () => {
    mockApi();
    renderSupplier();

    expect(await screen.findByText('Which emails from this supplier to import. Applies to all its contracts.')).toBeTruthy();
  });

  it('shows the metered variance next to the billed amount', async () => {
    mockApi();
    renderSupplier();

    // The stacked mobile list and the desktop table both render the values.
    expect((await screen.findAllByText('50.00 EUR')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('65.48 EUR').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\(-23\.6%\)/).length).toBeGreaterThan(0);
  });

  it('stacks the billed period so the values stay readable on phones', async () => {
    mockApi();
    renderSupplier();

    const stacked = await screen.findByTestId('bills-stacked');
    expect(stacked.textContent).toContain('50.00 EUR');
    expect(stacked.textContent).toContain('65.48 EUR');
    expect(stacked.textContent).toContain('100 kWh');
  });

  it('asks for the staged items of this supplier only, unless decided items are requested', async () => {
    const calls = mockApi();
    renderSupplier();
    await screen.findByText('Stadtwerke');

    expect(calls.some((call) => call.url === '/api/intake/items?supplierId=s1&status=pending,conflict')).toBe(true);

    fireEvent.click(await screen.findByRole('checkbox'));
    await waitFor(() => {
      expect(calls.some((call) => call.url === '/api/intake/items?supplierId=s1')).toBe(true);
    });
  });

  it('saves mail settings on the supplier through the PATCH endpoint', async () => {
    const calls = mockApi({
      'PATCH /api/suppliers/s1': () => ({
        supplier: {
          ...supplier,
          senders: ['a@b.example', 'c@d.example'],
          subjectHints: [],
          gmailQuery: null,
        },
      }),
    });
    renderSupplier();
    await screen.findByText('Stadtwerke');

    fireEvent.input(await screen.findByPlaceholderText(/sender addresses/i), { target: { value: 'a@b.example, c@d.example' } });
    fireEvent.input(screen.getByPlaceholderText(/subject hints/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save mail settings/i }));

    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH' && call.url === '/api/suppliers/s1')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH' && call.url === '/api/suppliers/s1');
    expect(JSON.parse(patch?.body ?? '{}')).toEqual({
      senders: ['a@b.example', 'c@d.example'],
      subjectHints: [],
      gmailQuery: null,
    });
  });

  it('lets the user link an unknown-meter item to an existing meter', async () => {
    const calls = mockApi({
      'POST /api/intake/items/i2/link': () => ({
        item: { ...items[1], meterId: 'm1', status: 'pending' },
      }),
    });
    renderSupplier();
    await screen.findByText('620 kWh');

    // One button opens the picker; the meter is chosen there, not inline.
    fireEvent.click(screen.getByRole('button', { name: /link meter/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Therme/i }));

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/intake/items/i2/link')).toBe(true);
    });
    const link = calls.find((call) => call.url === '/api/intake/items/i2/link');
    expect(JSON.parse(link?.body ?? '{}')).toEqual({ meterId: 'm1' });
    expect(await screen.findByText(/meter linked/i)).toBeTruthy();
  });

  it('accepts a staged item through the accept endpoint', async () => {
    const calls = mockApi({ 'POST /api/intake/items/i1/accept': () => ({ item: { id: 'i1', status: 'accepted' } }) });
    renderSupplier();
    await screen.findByText('500 kWh');

    const acceptButtons = screen.getAllByRole('button', { name: /^accept$/i });
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/intake/items/i1/accept')).toBe(true);
    });
  });

  it('runs a sync for the supplier and reports the result', async () => {
    const calls = mockApi({
      'POST /api/suppliers/s1/sync': () => ({
        provider: 'Stadtwerke',
        count: 1,
        processed: [{ messageId: 'm1', attachment: 'lastgang.csv', status: 'parsed' }],
      }),
    });
    renderSupplier();
    await screen.findByText('Stadtwerke');

    fireEvent.click(await screen.findByRole('button', { name: /sync now/i }));

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/suppliers/s1/sync')).toBe(true);
    });
    expect(await screen.findByText(/last sync/i)).toBeTruthy();
  });

  it('files an unassigned document under a supplier', async () => {
    window.history.pushState({}, '', '/suppliers/unassigned');
    const calls = mockApi({
      'GET /api/suppliers': () => ({
        suppliers: [supplier],
        unassigned: { documents: 1, staged: 1 },
      }),
      'PATCH /api/intake/documents/d1': () => ({
        document: { ...documents[0], supplierId: 's1' },
      }),
    });
    renderSupplier();
    await screen.findByText('lastgang.csv');

    const assignButtons = await screen.findAllByRole('button', { name: /assign supplier/i });
    fireEvent.click(assignButtons[0]);
    fireEvent.click(await screen.findByRole('button', { name: /Stadtwerke/ }));

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'PATCH' && call.url === '/api/intake/documents/d1')).toBe(true);
    });
    const patch = calls.find((call) => call.method === 'PATCH' && call.url === '/api/intake/documents/d1');
    expect(JSON.parse(patch?.body ?? '{}')).toEqual({ supplierId: 's1' });
  });

  it('links a staged reading to the datapoint on the meter readings page', async () => {
    mockApi();
    renderSupplier();

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
    renderSupplier();

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
    renderSupplier();
    await screen.findByText('lastgang.csv');

    const saveButtons = screen.getAllByRole('button', { name: /save to drive/i });
    // Only parsed documents are archived; the failed one offers a retry instead.
    expect(saveButtons).toHaveLength(1);
    const failedRow = screen.getByText('bill.pdf').closest('li');
    expect(failedRow?.querySelector('button')?.textContent).toMatch(/retry/i);
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/intake/documents/archive')).toBe(true);
    });
    const archive = calls.find((call) => call.url === '/api/intake/documents/archive');
    expect(JSON.parse(archive?.body ?? '{}')).toEqual({ documentId: 'd1', supplierId: 's1' });
  });

  it('explains why a parsed document could not be archived', async () => {
    mockApi({
      'POST /api/intake/documents/archive': () => ({
        archived: 0,
        failed: 1,
        documents: [{ documentId: 'd1', status: 'failed', error: 'Original is no longer available in Gmail' }],
      }),
    });
    renderSupplier();
    await screen.findByText('lastgang.csv');

    fireEvent.click(screen.getByRole('button', { name: /save to drive/i }));

    expect(await screen.findByText(/Original is no longer available in Gmail/)).toBeTruthy();
  });

  it('retries a failed document through the retry endpoint', async () => {
    const calls = mockApi({
      'POST /api/intake/documents/d2/retry': () => ({
        document: { _id: 'd2', fileName: 'bill.pdf', status: 'parsed', driveWebLink: 'https://drive.example/bill' },
        result: { status: 'parsed' },
      }),
    });
    renderSupplier();
    await screen.findByText('bill.pdf');

    const row = screen.getByText('bill.pdf').closest('li');
    fireEvent.click(row?.querySelector('button') as HTMLButtonElement);

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'POST' && call.url === '/api/intake/documents/d2/retry')).toBe(true);
    });
    expect(await screen.findByText(/bill\.pdf parsed/)).toBeTruthy();
  });
});

/**
 * @solidjs/router intercepts same-origin anchor clicks client-side. These links
 * point at an API redirect, so they must opt out with rel="external" — without
 * it the URL changes but no request is made and the page goes blank.
 */
describe('Supplier detail — Google connection', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/suppliers/s1');
  });

  afterEach(() => {
    cleanup();
    (fetch as unknown as { mockReset: () => void }).mockReset();
    window.history.pushState({}, '', '/');
  });

  it('offers the connect link and opts it out of client-side routing', async () => {
    mockApi();
    renderSupplier();

    const link = await screen.findByRole('link', { name: /connect google/i });

    expect(link.getAttribute('href')).toBe('/api/google/connect');
    expect(link.getAttribute('rel')).toBe('external');
  });

  it('asks for a reconnect when the authorization expired', async () => {
    mockApi({}, { ...session, google: { status: 'reconnect_required' } });
    renderSupplier();

    const expired = await screen.findByRole('link', { name: /reconnect google/i });
    expect(expired.getAttribute('rel')).toBe('external');
    expect(expired.getAttribute('href')).toBe('/api/google/connect');
  });

  it('shows the connected state and lets the account reconnect', async () => {
    mockApi({}, { ...session, google: { status: 'ok', email: 'chris@example.com' } });
    renderSupplier();

    expect(await screen.findByText(/google connected/i)).toBeTruthy();
    expect(screen.getByText('chris@example.com')).toBeTruthy();

    const connected = screen.getByRole('link', { name: /^reconnect$/i });
    expect(connected.getAttribute('rel')).toBe('external');
    expect(connected.getAttribute('href')).toBe('/api/google/connect');
  });
});
