import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders the editor on the home route', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/editor mode/i)).toBeInTheDocument();
});

test('opens the library from the editor and comes back', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Go to Library UI' }));
  expect(screen.getByText('Library UI')).toBeInTheDocument();
  expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Back to editor' }));
  expect(screen.getByText(/editor mode/i)).toBeInTheDocument();
});
