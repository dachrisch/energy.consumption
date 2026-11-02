import { cleanup, render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Contracts from '../Contracts';
import { ToastProvider } from '../../context/ToastContext';

global.fetch = vi.fn();

const dateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const supplier = {
  _id: 's1',
  name: 'Stadtwerke',
  senders: [],
  subjectHints: [],
  gmailQuery: null,
  contractCount: 3,
  stagedCount: 0,
  meterIds: ['m1'],
};

const contract = (id: string, startDate: string, endDate?: string) => ({
  _id: id,
  providerName: supplier.name,
  supplierId: { _id: supplier._id, name: supplier.name },
  startDate,
  endDate,
  basePrice: 10,
  workingPrice: 0.3,
  meterId: { _id: 'm1', name: 'Power', type: 'power' },
});

const mockApi = () => {
  const dashboard = {
    meters: [{ _id: 'm1', name: 'Power', type: 'power' }],
    readings: [],
    contracts: [
      contract('c-active', dateOffset(0)),
      contract('c-ended', dateOffset(-10), dateOffset(-1)),
      contract('c-upcoming', dateOffset(1)),
    ],
  };
  vi.mocked(fetch).mockImplementation(async (input) => {
    const body = String(input) === '/api/dashboard'
      ? dashboard
      : { suppliers: [supplier], unassigned: { documents: 1, staged: 0 } };
    return { ok: true, json: async () => body } as Response;
  });
};

const renderContracts = () => render(() => (
  <Router>
    <Route path="/contracts" component={() => (
      <ToastProvider>
        <Contracts />
      </ToastProvider>
    )} />
  </Router>
));

describe('Contracts page', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/contracts');
    mockApi();
  });

  afterEach(() => {
    cleanup();
    vi.mocked(fetch).mockReset();
    window.history.pushState({}, '', '/');
  });

  it('explains suppliers and pricing in plain language', async () => {
    renderContracts();

    expect(await screen.findByText('Your suppliers and the prices you pay per meter.')).toBeInTheDocument();
  });

  it('links to supplier pages and keeps contract edit links unchanged', async () => {
    renderContracts();

    const supplierLink = await screen.findByRole('link', { name: 'View supplier' });
    expect(supplierLink).toHaveAttribute('href', '/suppliers/s1');
    expect(supplierLink).not.toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/suppliers/unassigned');
    expect(screen.getAllByRole('link', { name: 'Edit' })[0]).toHaveAttribute('href', '/contracts/c-active/edit');
  });

  it('shows active, ended, and upcoming badges on contract cards', async () => {
    renderContracts();

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Ended')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });
});
