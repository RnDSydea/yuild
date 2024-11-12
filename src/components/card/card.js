import React from 'react';
import './card.scss';
import { ThemeProvider } from './themeContext';

const Card = ({ theme = 'sap', children }) => {
  const cardClass = `${theme}-card`;

  return (
    <ThemeProvider theme={theme}>
      <div className={cardClass}>
        {children}
      </div>
    </ThemeProvider>
  );
};

export default Card;
