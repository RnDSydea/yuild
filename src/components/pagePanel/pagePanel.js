import React, { useEffect, useState } from 'react';
import './pagePanel.scss';

const PagePanel = ({ pages, activePageId, onSelect, onAdd, onRename, onChangePath, onDuplicate, onDelete }) => {
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const [nameDraft, setNameDraft] = useState(activePage.name);
  const [pathDraft, setPathDraft] = useState(activePage.path);
  const [pageError, setPageError] = useState('');
  const [pendingDeletionId, setPendingDeletionId] = useState(null);

  useEffect(() => {
    setNameDraft(activePage.name);
    setPathDraft(activePage.path);
    setPageError('');
    setPendingDeletionId(null);
  }, [activePage.id, activePage.name, activePage.path]);

  const applyName = () => {
    if (nameDraft === activePage.name) {
      return;
    }
    const error = onRename(activePage.id, nameDraft);
    setPageError(error ?? '');
    if (error) {
      setNameDraft(activePage.name);
    }
  };

  const applyPath = () => {
    if (pathDraft === activePage.path) {
      return;
    }
    const error = onChangePath(activePage.id, pathDraft);
    setPageError(error ?? '');
    if (error) {
      setPathDraft(activePage.path);
    }
  };

  const applyOnEnter = (apply) => (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      apply();
    }
  };

  const canDelete = pages.length > 1;

  return (
    <section className="page-panel" aria-label="Pages">
      <div className="page-panel-header">
        <p className="page-panel-title">Pages</p>
        <button type="button" className="page-panel-add" onClick={onAdd} aria-label="Add page">
          +
        </button>
      </div>
      <ul className="page-panel-list">
        {pages.map((page) => (
          <li key={page.id}>
            <button
              type="button"
              className={`page-panel-item ${page.id === activePage.id ? 'selected' : ''}`}
              aria-current={page.id === activePage.id ? 'page' : undefined}
              onClick={() => onSelect(page.id)}
            >
              <span className="page-panel-name">{page.name}</span>
              <span className="page-panel-path">{page.path}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="page-panel-settings">
        <label className="page-panel-label" htmlFor="page-name">
          Page name
        </label>
        <input
          id="page-name"
          className="page-panel-input"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={applyName}
          onKeyDown={applyOnEnter(applyName)}
        />
        <label className="page-panel-label" htmlFor="page-path">
          Path
        </label>
        <input
          id="page-path"
          className="page-panel-input"
          value={pathDraft}
          onChange={(event) => setPathDraft(event.target.value)}
          onBlur={applyPath}
          onKeyDown={applyOnEnter(applyPath)}
        />
        {pageError && (
          <p className="page-panel-error" role="alert">
            {pageError}
          </p>
        )}
        {pendingDeletionId === activePage.id ? (
          <div className="page-panel-confirm" role="alertdialog" aria-label="Confirm page deletion">
            <p>Delete the page “{activePage.name}”? A version of the project is saved first.</p>
            <div className="page-panel-actions">
              <button
                type="button"
                className="page-panel-button danger"
                onClick={() => {
                  setPendingDeletionId(null);
                  onDelete(activePage.id);
                }}
              >
                Delete page
              </button>
              <button type="button" className="page-panel-button" onClick={() => setPendingDeletionId(null)}>
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <div className="page-panel-actions">
            <button type="button" className="page-panel-button" onClick={() => onDuplicate(activePage.id)}>
              Duplicate
            </button>
            <button
              type="button"
              className="page-panel-button danger"
              disabled={!canDelete}
              title={canDelete ? undefined : 'A project needs at least one page'}
              onClick={() => setPendingDeletionId(activePage.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PagePanel;
