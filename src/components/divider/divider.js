import React from 'react';
import './divider.scss';

const Divider = ({ theme = 'sap', orientation = 'horizontal' }) => (
  <div className={`${theme}-divider ${theme}-divider-${orientation}`} role="separator" aria-orientation={orientation} />
);

export default Divider;
