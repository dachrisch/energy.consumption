import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom';
import ContractTemplateCard from '../ContractTemplateCard';
import { Router, Route } from '@solidjs/router';

describe('ContractTemplateCard', () => {
  const gap = {
    startDate: new Date(2023, 0, 1),
    endDate: new Date(2023, 0, 31)
  };
  const meter = { _id: 'meter-123', name: 'Main Meter' };

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
    expect(href).toContain(`startDate=${gap.startDate.toISOString().split('T')[0]}`);
    expect(href).toContain(`endDate=${gap.endDate.toISOString().split('T')[0]}`);
  });
});
