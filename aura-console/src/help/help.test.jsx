import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CostBadge from './CostBadge.jsx';
import HelpTip from './HelpTip.jsx';
import HelpDrawer from './HelpDrawer.jsx';

jest.mock('../api', () => ({
  apiFetchJSON: jest.fn(() => Promise.resolve({ ok: true, costs: { 'product-description': 2 }, modelMultipliers: { 'gpt-4': 3 } })),
}));

describe('help components', () => {
  it('shows the live credit price, and the model multiplier', async () => {
    render(<><CostBadge action="product-description" /><CostBadge action="product-description" model="gpt-4" /></>);
    await waitFor(() => expect(screen.getByText('2 credits')).toBeInTheDocument());
    expect(screen.getByText('6 credits')).toBeInTheDocument();
  });

  it('shows nothing for an unknown action', async () => {
    const { container } = render(<CostBadge action="nope" />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('opens and closes a help tip', () => {
    render(<HelpTip title="AI box">Explains the box.</HelpTip>);
    fireEvent.click(screen.getByLabelText('Help: AI box'));
    expect(screen.getByText('Explains the box.')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Explains the box.')).toBeNull();
  });

  it('drawer lists the tool steps and renders nothing for a tool without a guide', () => {
    const { rerender, container } = render(<HelpDrawer toolId="size-guides" onClose={() => {}} onMore={() => {}} />);
    expect(screen.getByText('How to use it')).toBeInTheDocument();
    rerender(<HelpDrawer toolId="no-such-tool" onClose={() => {}} onMore={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
