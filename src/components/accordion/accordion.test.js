import { fireEvent, render, screen } from '@testing-library/react';
import Accordion from './accordion';

test('opens and closes its content from the header', () => {
  render(<Accordion title="Shipping" content="Free over 50 euro" />);
  const header = screen.getByRole('button', { name: 'Shipping' });
  const content = screen.getByText('Free over 50 euro');
  expect(header).toHaveAttribute('aria-expanded', 'false');
  expect(content).not.toBeVisible();
  fireEvent.click(header);
  expect(header).toHaveAttribute('aria-expanded', 'true');
  expect(content).toBeVisible();
  expect(header).toHaveAttribute('aria-controls', content.id);
  fireEvent.click(header);
  expect(content).not.toBeVisible();
});

test('can start open', () => {
  render(<Accordion title="Returns" content="30 days" defaultOpen theme="material" />);
  expect(screen.getByText('30 days')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Returns' })).toHaveClass('material-accordion-header');
});
