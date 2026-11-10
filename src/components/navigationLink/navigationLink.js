import React, { createContext, useContext } from 'react';
import { Link as RouterLink, useInRouterContext } from 'react-router-dom';

export const NavigationContext = createContext(null);

const isInternalPath = (to) => typeof to === 'string' && to.startsWith('/');

const NavigationLink = ({ to, className, children, ...rest }) => {
  const navigation = useContext(NavigationContext);
  const insideRouter = useInRouterContext();
  if (!to) {
    return (
      <span className={className} {...rest}>
        {children}
      </span>
    );
  }
  if (navigation && isInternalPath(to)) {
    return (
      <a
        href={to}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          navigation.navigateTo(to);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
  if (insideRouter && isInternalPath(to)) {
    return (
      <RouterLink to={to} className={className} {...rest}>
        {children}
      </RouterLink>
    );
  }
  return (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  );
};

export default NavigationLink;
