import React, { useState } from 'react';
import './versionPanel.scss';

const formatVersionDate = (timestamp) =>
  new Date(timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

const VersionPanel = ({ versions, onSave, onRestore }) => {
  const [label, setLabel] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(label);
    setLabel('');
  };

  return (
    <div className="version-panel y-d-flex y-flex-direction-column y-gap-3 y-py-3">
      <form className="y-d-flex y-flex-direction-column y-gap-2" onSubmit={handleSubmit}>
        <p className="props-comp-label">Version name</p>
        <input
          spellCheck="false"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Version"
          className="input-props-comp"
        />
        <button type="submit" className="yuild-button primary">
          Save version
        </button>
      </form>
      {versions.length === 0 && <p className="props-comp-label">No saved versions yet.</p>}
      <ul className="version-panel-list">
        {versions.map((version) => (
          <li key={version.id} className="version-panel-item">
            <div>
              <p className="version-panel-label">{version.label}</p>
              <p className="props-comp-label">{formatVersionDate(version.createdAt)}</p>
            </div>
            <button type="button" className="yuild-button ghost small" onClick={() => onRestore(version.id)}>
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VersionPanel;
