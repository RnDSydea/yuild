import { render, screen } from '@testing-library/react';
import Divider from './divider';

test('renders a separator with the requested orientation', () => {
  render(<Divider orientation="vertical" theme="material" />);
  const separator = screen.getByRole('separator');
  expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  expect(separator).toHaveClass('material-divider-vertical');
});
