import React from 'react';
import './breadcrumbs.scss';
import NavigationLink from '../navigationLink/navigationLink';

const DEFAULT_ITEMS = [{ label: 'Home', to: '/' }, { label: 'Current page' }];

const Breadcrumbs = ({ theme = 'sap', items = DEFAULT_ITEMS }) => (
  <nav className={`${theme}-breadcrumbs`} aria-label="Breadcrumbs">
    <ol>
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`}>
            {isCurrent ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <NavigationLink to={item.to} className={`${theme}-breadcrumbs-link`}>
                {item.label}
              </NavigationLink>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Breadcrumbs;
