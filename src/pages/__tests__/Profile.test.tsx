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
  googleApiKey?: string;
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

describe('Profile — Google settings', () => {
  afterEach(() => {
    cleanup();
    (fetch as unknown as { mockReset: () => void }).mockReset();
  });

  it('keeps the Gemini API key field', async () => {
    renderProfile({ ...session, googleApiKey: 'AIza-key' });

    expect(await screen.findByText(/google gemini api key/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/AIza/i)).toBeTruthy();
  });

  it('no longer hosts the Google account connection', async () => {
    renderProfile({ ...session, google: { status: 'ok' } });

    await screen.findByText(/google gemini api key/i);

    expect(screen.queryByText(/google connectivity/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /connect google/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /reconnect/i })).toBeNull();
  });
});
