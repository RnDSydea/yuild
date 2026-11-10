import React, { useEffect, useState } from 'react';
import './codePanel.scss';

const getFileName = (path) => path.split('/').pop();

const CodePanel = ({ isOpen, files, preferredFile, onClose }) => {
  const paths = Object.keys(files);
  const [selectedPath, setSelectedPath] = useState(preferredFile);
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    setSelectedPath(preferredFile);
  }, [preferredFile]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const activePath = files[selectedPath] === undefined ? paths[0] : selectedPath;
  const content = activePath ? files[activePath] : '';

  const copyCode = () => {
    if (!navigator.clipboard) {
      setCopyState('Copy not available');
      return;
    }
    navigator.clipboard.writeText(content).then(
      () => setCopyState('Copied'),
      () => setCopyState('Copy failed')
    );
  };

  return (
    <aside className={`code-panel ${isOpen ? 'open' : ''}`} aria-label="Generated code" aria-hidden={!isOpen}>
      <div className="code-panel-header">
        <div>
          <p className="code-panel-title">Generated code</p>
          <p className="code-panel-subtitle">Updates while you edit the project</p>
        </div>
        <div className="code-panel-actions">
          <button type="button" className="code-panel-button" onClick={copyCode} tabIndex={isOpen ? 0 : -1}>
            {copyState || 'Copy'}
          </button>
          <button
            type="button"
            className="code-panel-close"
            onClick={onClose}
            aria-label="Close generated code"
            tabIndex={isOpen ? 0 : -1}
          >
            ×
          </button>
        </div>
      </div>
      <div className="code-panel-files" role="tablist" aria-label="Generated files">
        {paths.map((path) => (
          <button
            key={path}
            type="button"
            role="tab"
            title={path}
            aria-selected={path === activePath}
            tabIndex={isOpen ? 0 : -1}
            className={`code-panel-file ${path === activePath ? 'selected' : ''}`}
            onClick={() => {
              setSelectedPath(path);
              setCopyState('');
            }}
          >
            {getFileName(path)}
          </button>
        ))}
      </div>
      <p className="code-panel-path">{activePath}</p>
      <pre className="code-panel-code" role="tabpanel">
        <code>{content}</code>
      </pre>
    </aside>
  );
};

export default CodePanel;
