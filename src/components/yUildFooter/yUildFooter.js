import React from 'react';
import './yUildFooter.css';
import { useTheme } from '../card/themeContext';

const YuildFooter = ({ children }) => {
  const theme = useTheme();
  const footerClass = `${theme}-card-footer`;

  return <div className={footerClass}>{children}</div>;
};


export default YuildFooter;
