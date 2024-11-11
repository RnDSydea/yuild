import React from 'react';
import './yUildBody.css';
import { useTheme } from '../card/themeContext';

const YuildBody = ({ children }) => {
  const theme = useTheme();
  const bodyClass = `${theme}-card-body`;

  return <div className={bodyClass}>{children}</div>;
};


export default YuildBody;
