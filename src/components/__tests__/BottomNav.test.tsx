import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import BottomNav from '../BottomNav';

function renderBottomNav() {
  return render(() => (
    <Router>
      <Route path="*" component={BottomNav} />
    </Router>
  ));
}

describe('BottomNav', () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('links to Contracts and does not link to Intake', () => {
    renderBottomNav();

    expect(screen.getByRole('link', { name: 'Contracts' })).toHaveAttribute('href', '/contracts');
    expect(screen.queryByRole('link', { name: 'Intake' })).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/intake"]')).not.toBeInTheDocument();
  });

  it.each(['/contracts', '/contracts/supplier-1'])('highlights Contracts at %s', (path) => {
    window.history.replaceState({}, '', path);
    renderBottomNav();

    expect(screen.getByRole('link', { name: 'Contracts' })).toHaveClass('text-primary');
  });
});
