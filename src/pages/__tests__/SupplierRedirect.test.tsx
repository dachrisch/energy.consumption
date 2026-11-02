import { cleanup, render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SupplierRedirect from '../SupplierRedirect';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.pushState({}, '', '/');
});

describe('SupplierRedirect', () => {
  it('redirects legacy contract supplier URLs to the supplier route', async () => {
    window.history.pushState({}, '', '/contracts/s1?from=mail#documents');

    render(() => (
      <Router>
        <Route path="/contracts/:id" component={SupplierRedirect} />
        <Route path="/suppliers/:id" component={() => <div>Supplier destination</div>} />
      </Router>
    ));

    expect(await screen.findByText('Supplier destination')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/suppliers/s1');
    expect(window.location.search).toBe('?from=mail');
    expect(window.location.hash).toBe('#documents');
  });
});
