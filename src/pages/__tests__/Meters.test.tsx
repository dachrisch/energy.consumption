import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import Meters from '../Meters';
import { Router, Route } from '@solidjs/router';
import { ToastProvider } from '../../context/ToastContext';

// Mock the global fetch
global.fetch = vi.fn();

const renderMeters = () =>
  render(() => (
    <Router>
      <Route path="/" component={() => (
        <ToastProvider>
          <Meters />
        </ToastProvider>
      )} />
    </Router>
  ));

describe('Meters Page', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses single-column layout when there is only one meter', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        meters: [{ _id: '1', name: 'Meter A', unit: 'kWh', type: 'power', meterNumber: '001' }],
        readings: [],
        contracts: []
      })
    });

    renderMeters();

    const grid = await screen.findByTestId('meters-grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).not.toContain('md:grid-cols-2');
    expect(grid.className).not.toContain('lg:grid-cols-3');
  });

  it('uses a 2-column grid layout on medium screens when there are multiple meters', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        meters: [
          { _id: '1', name: 'Meter A', unit: 'kWh', type: 'power', meterNumber: '001' },
          { _id: '2', name: 'Meter B', unit: 'm³', type: 'gas', meterNumber: '002' }
        ],
        readings: [],
        contracts: []
      })
    });

    renderMeters();

    const grid = await screen.findByTestId('meters-grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).not.toContain('lg:grid-cols-3');
  });
});
