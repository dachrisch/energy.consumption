import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import '@testing-library/jest-dom';
import ContractTemplateCard from '../ContractTemplateCard';
import { Router, Route } from '@solidjs/router';

describe('ContractTemplateCard', () => {
  const gap = {
    startDate: new Date(2023, 0, 1),
    endDate: new Date(2023, 0, 31)
  };
  const meter = { _id: 'meter-123', name: 'Main Meter', type: 'power' };

  afterEach(() => {
    cleanup();
  });

  const formatDateForURL = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  it('displays the correct missing date range', () => {
    render(() => (
      <Router>
        <Route path="/" component={() => <ContractTemplateCard gap={gap} meter={meter as any} />} />
      </Router>
    ));

    expect(screen.getByText(/Missing Coverage/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(gap.startDate.toLocaleDateString()))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(gap.endDate.toLocaleDateString()))).toBeInTheDocument();
  });

  it('pre-fills the add link with gap dates', () => {
    render(() => (
      <Router>
        <Route path="/" component={() => <ContractTemplateCard gap={gap} meter={meter as any} />} />
      </Router>
    ));

    const link = screen.getByRole('link');
    const href = link.getAttribute('href');
    expect(href).toContain('meterId=meter-123');
    expect(href).toContain(`startDate=${formatDateForURL(gap.startDate)}`);
    expect(href).toContain(`endDate=${formatDateForURL(gap.endDate)}`);
  });
});
