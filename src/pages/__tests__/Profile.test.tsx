import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import Profile from '../Profile';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

global.fetch = vi.fn();

interface SessionUser {
  _id: string;
  name: string;
  email: string;
  google?: { status?: 'ok' | 'reconnect_required' };
}

function renderProfile(session: SessionUser) {
  (fetch as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
    ok: true,
    json: async () => session,
  });
  return render(() => (
    <Router>
      <Route path="/" component={() => (
        <AuthProvider>
          <ToastProvider>
            <Profile />
          </ToastProvider>
        </AuthProvider>
      )} />
    </Router>
  ));
}

const session: SessionUser = { _id: 'u1', name: 'Chris', email: 'chris@example.com' };

/**
 * @solidjs/router intercepts same-origin anchor clicks client-side. These links
 * point at an API redirect, so they must opt out with rel="external" — without
 * it the URL changes but no request is made and the page goes blank.
 */
describe('Profile — Google connectivity links', () => {
  afterEach(() => {
    cleanup();
    (fetch as unknown as { mockReset: () => void }).mockReset();
  });

  it('opts the connect link out of client-side routing', async () => {
    renderProfile(session);

    const link = await screen.findByRole('link', { name: /connect google/i });

    expect(link.getAttribute('href')).toBe('/api/google/connect');
    expect(link.getAttribute('rel')).toBe('external');
  });

  it('opts the reconnect links out of client-side routing too', async () => {
    renderProfile({ ...session, google: { status: 'reconnect_required' } });

    const expired = await screen.findByRole('link', { name: /reconnect google/i });
    expect(expired.getAttribute('rel')).toBe('external');
    expect(expired.getAttribute('href')).toBe('/api/google/connect');
  });

  it('uses the same opt-out when the account is already connected', async () => {
    renderProfile({ ...session, google: { status: 'ok' } });

    const connected = await screen.findByRole('link', { name: /^reconnect$/i });
    expect(connected.getAttribute('rel')).toBe('external');
    expect(connected.getAttribute('href')).toBe('/api/google/connect');
  });
});
