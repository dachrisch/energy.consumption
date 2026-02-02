import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import Meters from '../Meters';
import { Router, Route } from '@solidjs/router';
import { ToastProvider } from '../../context/ToastContext';

// Mock the global fetch
global.fetch = vi.fn();

describe('Meters Page', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses a 2-column grid layout on medium screens', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ meters: [], readings: [], contracts: [] })
    });

    render(() => (
      <Router>
        <Route path="/" component={() => (
          <ToastProvider>
            <Meters />
          </ToastProvider>
        )} />
      </Router>
    ));

    const grid = await screen.findByTestId('meters-grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    // We want to remove lg:grid-cols-3
    expect(grid.className).not.toContain('lg:grid-cols-3');
  });
});