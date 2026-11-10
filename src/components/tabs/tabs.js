import React, { useId, useState } from 'react';
import './tabs.scss';

const DEFAULT_TABS = [
  { label: 'Tab 1', content: 'First tab content' },
  { label: 'Tab 2', content: 'Second tab content' },
];

const Tabs = ({ theme = 'sap', tabs = DEFAULT_TABS, defaultActive = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(Math.min(Math.max(Number(defaultActive) || 0, 0), tabs.length - 1));
  const baseId = useId();
  return (
    <div className={`${theme}-tabs`}>
      <div className={`${theme}-tabs-list`} role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={`${tab.label}-${index}`}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={index === activeIndex}
            aria-controls={`${baseId}-panel-${index}`}
            className={`${theme}-tabs-tab ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs[activeIndex] && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeIndex}`}
          aria-labelledby={`${baseId}-tab-${activeIndex}`}
          className={`${theme}-tabs-panel`}
        >
          {tabs[activeIndex].content}
        </div>
      )}
    </div>
  );
};

export default Tabs;
