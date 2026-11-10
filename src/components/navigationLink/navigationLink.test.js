import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Breadcrumbs from '../breadcrumbs/breadcrumbs';
import Link from '../link/link';
import Menu from '../menu/menu';
import NavigationLink, { NavigationContext } from './navigationLink';

const renderWithRoutes = (element) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={element} />
        <Route path="/about" element={<p>About page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('navigation components', () => {
  test('Link navigates between pages inside a router', () => {
    renderWithRoutes(<Link label="About us" to="/about" theme="material" />);
    const link = screen.getByRole('link', { name: 'About us' });
    expect(link).toHaveClass('material-link');
    fireEvent.click(link);
    expect(screen.getByText('About page')).toBeInTheDocument();
  });

  test('Menu renders one link per item and navigates', () => {
    renderWithRoutes(<Menu items={[{ label: 'Home', to: '/' }, { label: 'About', to: '/about' }]} orientation="vertical" />);
    expect(screen.getByRole('navigation', { name: 'Menu' })).toHaveClass('sap-menu-vertical');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    fireEvent.click(screen.getByRole('link', { name: 'About' }));
    expect(screen.getByText('About page')).toBeInTheDocument();
  });

  test('Breadcrumbs link every item except the current page', () => {
    renderWithRoutes(<Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About', to: '/about' }, { label: 'Team' }]} />);
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['Home', 'About']);
    expect(screen.getByText('Team')).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('link', { name: 'About' }));
    expect(screen.getByText('About page')).toBeInTheDocument();
  });

  test('outside a router internal paths become plain links', () => {
    render(<Link label="Home" to="/" />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  test('a navigation context receives the path instead of the router', () => {
    const navigateTo = jest.fn();
    render(
      <MemoryRouter>
        <NavigationContext.Provider value={{ navigateTo }}>
          <NavigationLink to="/about">About</NavigationLink>
        </NavigationContext.Provider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('link', { name: 'About' }));
    expect(navigateTo).toHaveBeenCalledWith('/about');
  });

  test('without a destination it renders plain text', () => {
    render(<NavigationLink>Current</NavigationLink>);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Current').tagName).toBe('SPAN');
  });
});
