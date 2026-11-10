import React from 'react';
import './link.scss';
import NavigationLink from '../navigationLink/navigationLink';

const Link = ({ theme = 'sap', label = 'Link', to = '/' }) => (
  <NavigationLink to={to} className={`${theme}-link`}>
    {label}
  </NavigationLink>
);

export default Link;
