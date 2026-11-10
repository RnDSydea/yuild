import { fireEvent, render, screen } from '@testing-library/react';
import DialogTrigger from './dialogTrigger';
import DrawerTrigger from '../drawerTrigger/drawerTrigger';
import AlertTrigger from '../alertTrigger/alertTrigger';

test('the dialog opens from its button and closes again', () => {
  render(<DialogTrigger buttonLabel="Show terms" title="Terms" content="Read carefully" />);
  expect(screen.queryByText('Terms')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show terms' }));
  expect(screen.getByRole('heading', { name: 'Terms' })).toBeInTheDocument();
  expect(screen.getByText('Read carefully')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByText('Terms')).toBeNull();
});

test('the drawer slides in from its button', () => {
  const { container } = render(<DrawerTrigger buttonLabel="Filters" content="Filter options" theme="material" />);
  expect(container.querySelector('.material-drawer')).toHaveClass('slide-out');
  fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
  expect(container.querySelector('.material-drawer')).toHaveClass('slide-in');
  expect(screen.getByText('Filter options')).toBeInTheDocument();
});

test('the alert opens from its button and closes with its actions', () => {
  render(<AlertTrigger buttonLabel="Delete" title="Are you sure?" message="This cannot be undone" />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(screen.getByRole('heading', { name: 'Are you sure?' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByText('This cannot be undone')).toBeNull();
});
