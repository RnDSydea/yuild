import React from 'react';
import './input.css';

const Input = ({ value, onChange, placeholder = '', label = '', required = false, variant = 'default', disabled = false, readOnly = false, theme = 'sap' }) => {
  const inputClass = `${theme}-input ${theme}-input-${variant} ${disabled ? `${theme}-input-${variant}-disabled` : ''} ${readOnly ? `${theme}-input-${variant}-readOnly` : ''}`;

  return (
    <div className={`${theme}-input-container`}>
      {label && (
        <label className={`${theme}-input-label-${variant}`}>
          {label}
          {required && <span className={`${theme}-input-required`}>*</span>}
        </label>
      )}
      <input 
        className={inputClass} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        type="text"
      />
    </div>
  );
};

export default Input;
