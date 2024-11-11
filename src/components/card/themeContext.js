import React, { createContext, useContext } from 'react';

const ThemeContext = createContext('sap');

export const ThemeProvider = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);