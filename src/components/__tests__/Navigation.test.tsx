import { cleanup, render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Navigation from '../Navigation';
import { AuthProvider } from '../../context/AuthContext';

global.fetch = vi.fn();

afterEach(() => {
  cleanup();
  vi.mocked(fetch).mockReset();
  window.history.pushState({}, '', '/');
});

describe('Navigation user badge', () => {
  it('does not show a technical role below the user name', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ _id: 'u1', name: 'Chris', email: 'chris@example.com' }),
    } as Response);
    window.history.pushState({}, '', '/');

    render(() => (
      <Router>
        <Route path="/" component={() => (
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        )} />
      </Router>
    ));

    expect((await screen.findAllByText('Chris')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Operator')).not.toBeInTheDocument();
  });
});
