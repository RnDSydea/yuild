import React from 'react';
import './layoutGenerationBar.scss';

export const GENERATION_STAGES = {
  confirmOverwrite: 'confirm-overwrite',
  preview: 'preview',
};

const LayoutGenerationBar = ({ stage, breakpointLabel, changedCount = 0, totalCount = 0, onContinue, onConfirm, onCancel }) => {
  if (stage === GENERATION_STAGES.confirmOverwrite) {
    return (
      <div className="layout-generation-bar warning" role="alertdialog" aria-label="Replace manual layout">
        <p className="layout-generation-text">
          The {breakpointLabel} layout has been edited by hand. Generating it from desktop will replace it.
        </p>
        <div className="layout-generation-actions">
          <button type="button" className="yuild-button primary" onClick={onContinue}>
            Generate anyway
          </button>
          <button type="button" className="yuild-button ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="layout-generation-bar preview" role="region" aria-label="Generated layout preview">
      <p className="layout-generation-text">
        <strong>Preview of the {breakpointLabel} layout generated from desktop.</strong> {changedCount} of {totalCount}{' '}
        components change position or size and are highlighted. Confirm to apply it: the current layout is saved as a
        version first.
      </p>
      <div className="layout-generation-actions">
        <button type="button" className="yuild-button primary" onClick={onConfirm}>
          Confirm
        </button>
        <button type="button" className="yuild-button ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LayoutGenerationBar;
