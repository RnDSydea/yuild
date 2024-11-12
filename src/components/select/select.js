import React, {useState} from 'react';
import chevronDown from '../../assets/chevron-down-solid.svg';
import './select.scss';

const Select = ({ options = [], onChange, label = '', variant = 'default', disabled = false, readOnly = false,theme = 'sap' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]?.label || '');
  
  const handleSelect = (option) => {
    if (disabled || readOnly) return;
    setSelectedOption(option.label);
    onChange({ target: { value: option.value } });
    setIsOpen(false);
  };
  const selectClass = `${theme}-select ${theme}-select-${variant} ${disabled ? `${theme}-select-${variant}-disabled` : ''} ${readOnly ? `${theme}-select-${variant}-readOnly` : ''}`;
  const chevronDownClass = `${theme}-chevronDown-container ${theme}-chevronDown-container-${variant} }`;
  const chevronDownBtn =  `${theme}-chevronDown-btn`;
  const dropdownClass = `${theme}-select-dropdown`;
  const optionClass = `${theme}-select-option`;
  // const labelContainer = {marginTop: label ? '0' : '21px'};

  return (
    <div>
        {label && (
          // <label className={`${theme}-input-label-${variant}`}>
          <label className='select-label'>
            {label}
          </label>
        )}
       <div
        className={selectClass}
        onClick={() => !disabled && setIsOpen(!isOpen)} 
        style={{ cursor: disabled ? 'auto' : 'pointer' }}
      >
          {selectedOption}
          {!readOnly && (
            <div className={chevronDownClass}>
              <img src={chevronDown} className={chevronDownBtn} alt='chevronDown' />
            </div>
          )}
        </div>
        {isOpen && (
          <div className={dropdownClass}>
            {options.map((option, index) => (
              <div
                key={index}
                className={optionClass}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
  );
};

export default Select;
