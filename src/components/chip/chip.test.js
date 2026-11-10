import { render, screen } from '@testing-library/react';
import Chip from './chip';

test('renders the label with theme and variant classes', () => {
  render(<Chip label="Paid" variant="success" theme="material" />);
  expect(screen.getByText('Paid')).toHaveClass('material-chip', 'material-chip-success');
});

test('defaults to the sap theme', () => {
  render(<Chip />);
  expect(screen.getByText('Chip')).toHaveClass('sap-chip-default');
});
