import { render, screen } from '@testing-library/react';
import Avatar from './avatar';

test('shows at most two uppercase initials with the theme and size classes', () => {
  render(<Avatar initials="mario rossi" size="large" theme="material" />);
  const avatar = screen.getByRole('img', { name: 'MA' });
  expect(avatar).toHaveTextContent('MA');
  expect(avatar).toHaveClass('material-avatar', 'material-avatar-large');
});

test('uses the label as accessible name when given', () => {
  render(<Avatar initials="AR" label="Angelo" />);
  expect(screen.getByRole('img', { name: 'Angelo' })).toHaveClass('sap-avatar-medium');
});
