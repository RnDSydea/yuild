import { fireEvent, render, screen } from '@testing-library/react';
import Tabs from './tabs';

const tabs = [
  { label: 'Details', content: 'Product details' },
  { label: 'Reviews', content: 'Customer reviews' },
];

test('shows the content of the selected tab', () => {
  render(<Tabs tabs={tabs} />);
  expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Product details');
  fireEvent.click(screen.getByRole('tab', { name: 'Reviews' }));
  expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Customer reviews');
});

test('starts from a valid default tab even when the index is out of range', () => {
  render(<Tabs tabs={tabs} defaultActive={7} />);
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Customer reviews');
});
