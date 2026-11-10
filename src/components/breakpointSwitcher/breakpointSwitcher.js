import React from 'react';
import './breakpointSwitcher.scss';
import { BREAKPOINTS, BREAKPOINT_ORDER } from '../../utils/grid/breakpoints';

const BreakpointSwitcher = ({ activeBreakpoint, onChange }) => (
  <div className="breakpoint-switcher" role="group" aria-label="Breakpoint">
    {BREAKPOINT_ORDER.map((breakpointId) => (
      <button
        key={breakpointId}
        type="button"
        className={`breakpoint-switcher-button ${breakpointId === activeBreakpoint ? 'selected' : ''}`}
        aria-pressed={breakpointId === activeBreakpoint}
        onClick={() => onChange(breakpointId)}
      >
        {BREAKPOINTS[breakpointId].label}
        <span className="breakpoint-switcher-columns">{BREAKPOINTS[breakpointId].columns} col</span>
      </button>
    ))}
  </div>
);

export default BreakpointSwitcher;
