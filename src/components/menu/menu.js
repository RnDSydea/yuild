import React from 'react';
import './menu.scss';
import NavigationLink from '../navigationLink/navigationLink';

const DEFAULT_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
];

const Menu = ({ theme = 'sap', items = DEFAULT_ITEMS, orientation = 'horizontal' }) => (
  <nav className={`${theme}-menu ${theme}-menu-${orientation}`} aria-label="Menu">
    <ul>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <NavigationLink to={item.to} className={`${theme}-menu-item`}>
            {item.label}
          </NavigationLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default Menu;
