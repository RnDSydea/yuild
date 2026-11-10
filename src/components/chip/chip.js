import React from 'react';
import './chip.scss';

const Chip = ({ theme = 'sap', label = 'Chip', variant = 'default' }) => (
  <span className={`${theme}-chip ${theme}-chip-${variant}`}>{label}</span>
);

export default Chip;
