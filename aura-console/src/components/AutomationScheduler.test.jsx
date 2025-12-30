import React from 'react';
import { render, screen } from '@testing-library/react';
import AutomationScheduler from './AutomationScheduler';

describe('AutomationScheduler', () => {
  it('renders the scheduler UI', () => {
    render(<AutomationScheduler />);
    // There are multiple elements with 'automation' in the text, so use getAllByText
    const matches = screen.getAllByText(/automation/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
