import React from 'react';
import './radio.scss';

const RadioButton = ({ checked, onChange, label, variant = 'default', disabled = false, readOnly = false, theme = 'sap' }) => {
  const labelClass =  `${theme}-label-${variant}`
  const radioClass = `${theme}-radio-${variant} ${disabled ? `${theme}-radio-${variant}-disabled` : ''}`;

  return (
    <div className="y-d-inline-flex">
      <input
        className={radioClass}
        type="radio"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
      />
      <span className={labelClass}>{label}</span>
    </div>
  );
};

export default RadioButton;
