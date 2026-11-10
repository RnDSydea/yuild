import React, { useId, useState } from 'react';
import './accordion.scss';

const Accordion = ({ theme = 'sap', title = 'Accordion', content = '', defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  const contentId = useId();
  return (
    <div className={`${theme}-accordion ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className={`${theme}-accordion-header`}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className={`${theme}-accordion-icon`} aria-hidden="true" />
      </button>
      <div id={contentId} className={`${theme}-accordion-content`} hidden={!isOpen}>
        {content}
      </div>
    </div>
  );
};

export default Accordion;
