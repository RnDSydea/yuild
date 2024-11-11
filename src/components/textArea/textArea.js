import React from 'react';
import './textarea.css';

const TextArea = ({ value, onChange, placeholder = '', variant = 'default', disabled = false, theme = 'sap', readOnly = false }) => {
  const textareaClass = `${theme}-textarea ${theme}-textarea-${variant} ${disabled ? `${theme}-textarea-${variant}-disabled` : ''}`;

  return (
    <textarea 
      className={textareaClass} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
};

export default TextArea;
