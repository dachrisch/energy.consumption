import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import { AuthProvider } from '../../context/AuthContext';
import Landing from '../Landing';

const fetchMock = vi.fn();

function renderLanding() {
  return render(() => (
    <Router>
      <Route path="/" component={() => (
        <AuthProvider>
          <Landing />
        </AuthProvider>
      )} />
      <Route path="/dashboard" component={() => <div>Dashboard page</div>} />
    </Router>
  ));
}

describe('Landing', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('redirects authenticated users to the dashboard', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ _id: 'user-1', name: 'Chris', email: 'chris@example.com' }),
    });
    renderLanding();

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
    expect(screen.queryByText('Account Access')).not.toBeInTheDocument();
  });

  it('renders the landing for signed-out users', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    renderLanding();

    expect(await screen.findByText('Account Access')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login');
    expect(window.location.pathname).toBe('/');
  });

  it('renders nothing while the session is loading', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { container } = renderLanding();

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Account Access')).not.toBeInTheDocument();
  });
});
