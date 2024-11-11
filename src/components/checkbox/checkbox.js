import React from 'react';
import './checkbox.css';

const Checkbox = ({ checked, onChange, label, variant = 'default', disabled = false, theme = 'sap' }) => {
  const labelClass =  `${theme}-label-${variant}`
  const checkboxClass = `${theme}-checkbox ${theme}-checkbox-${variant} ${disabled ? `${theme}-checkbox-${variant}-disabled` : ''}`;

  return (
    <div className="checkbox-wrapper">
      <input 
        className={checkboxClass}
        type="checkbox" 
        checked={checked} 
        onChange={onChange} 
        disabled={disabled}
      />
      <span className={labelClass}>{label}</span>
    </div>
  );
};

export default Checkbox;
