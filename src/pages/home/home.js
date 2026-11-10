import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import "./home.scss";
import "../../yuild-style.scss";
import DownloadIcon from '../../assets/download-icon.svg';
import ArrowUp from '../../assets/arrow-up.svg';
import ComponentsData from "../../assets/data/components.json";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import GithubLogo from "../../assets/logo/github-mark-white.png";
import YuildLogoLight from "../../assets/logo/yuild-logo-light.svg";
import EditorGrid from "../../components/editorGrid/editorGrid";
import BreakpointSwitcher from "../../components/breakpointSwitcher/breakpointSwitcher";
import VersionPanel from "../../components/versionPanel/versionPanel";
import PagePanel from "../../components/pagePanel/pagePanel";
import CodePanel from "../../components/codePanel/codePanel";
import { LIBRARY_COMPONENTS } from "../../components/componentRegistry";
import { NavigationContext } from "../../components/navigationLink/navigationLink";
import LayoutGenerationBar, { GENERATION_STAGES } from "../../components/layoutGenerationBar/layoutGenerationBar";
import { BREAKPOINTS, DEFAULT_BREAKPOINT, ROW_HEIGHT } from "../../utils/grid/breakpoints";
import { getOccupiedRows, scaleWidth } from "../../utils/grid/gridGeometry";
import { isContainerType } from "../../utils/project/componentTypes";
import {
  LAYOUT_STATUS,
  MODEL_ERRORS,
  addComponent,
  getChildItems,
  getComponent,
  getDescendantIds,
  getLayoutItem,
  moveComponent,
  removeComponent,
  resizeComponent,
  updateComponentProps,
} from "../../utils/project/pageModel";
import {
  PAGE_ERRORS,
  addPage,
  changePagePath,
  clearPage,
  createEmptyProject,
  duplicatePage,
  getPage,
  normalizePagePath,
  removePage,
  renamePage,
  replacePage,
  updateProjectSettings,
} from "../../utils/project/projectModel";
import { loadProject, saveProject } from "../../utils/project/projectStorage";
import { generateProjectCode } from "../../utils/codeGeneration/projectCode";
import { createProjectArchive } from "../../utils/codeGeneration/projectArchive";
import { REFLOW_ERRORS, SOURCE_BREAKPOINT, generateLayoutFromDesktop } from "../../utils/responsive/reflowEngine";
import { findChangedComponents } from "../../utils/responsive/layoutDiff";
import {
  createVersion,
  findVersion,
  getRestoredProject,
  loadVersions,
  saveVersions,
} from "../../utils/project/projectVersions";

const ColorPicker = ({ colorProps, textProps }) => {
  return (
    <span className="color-picker-container">
      <input type="color" {...colorProps} />
      <input type="text" className="input-props-comp" {...colorProps} />
    </span>
  );
};

const MIN_PAGE_ROWS = 60;

const EXTRA_PAGE_ROWS = 10;

const ERROR_MESSAGES = {
  [MODEL_ERRORS.outOfBounds]: 'The component does not fit inside the grid.',
  [MODEL_ERRORS.overlap]: 'That space is already occupied.',
  [MODEL_ERRORS.invalidSize]: 'Width and height must be whole numbers greater than zero.',
  [MODEL_ERRORS.invalidParent]: 'The component cannot be placed there.',
  [MODEL_ERRORS.nestingTooDeep]: 'Containers can be nested at most two levels deep.',
  [MODEL_ERRORS.childrenOutside]: 'The container would be smaller than its content.',
  [MODEL_ERRORS.notFound]: 'The component no longer exists.',
};

const describeModelError = ({ error, breakpointId }) => {
  if (error === MODEL_ERRORS.noSpace) {
    return `There is no free space for the component in the ${BREAKPOINTS[breakpointId].label} layout.`;
  }
  return ERROR_MESSAGES[error] ?? 'The operation is not allowed.';
};

const describeReflowError = ({ error, problems }) => {
  if (error === REFLOW_ERRORS.invalidSource) {
    return 'The desktop layout has overlapping components or components outside the grid: fix them before generating.';
  }
  return `The generated layout would not be valid (${problems.length} problems found), so the current layout was left unchanged.`;
};

const PAGE_ERROR_MESSAGES = {
  [PAGE_ERRORS.invalidName]: 'The page name cannot be empty.',
  [PAGE_ERRORS.invalidPath]: 'Use a path like /about: lowercase letters, numbers and hyphens.',
  [PAGE_ERRORS.duplicatePath]: 'Another page already uses this path.',
  [PAGE_ERRORS.lastPage]: 'A project needs at least one page.',
  [PAGE_ERRORS.notFound]: 'The page no longer exists.',
};

const RIGHT_PANEL_TABS = [
  { id: 'component', label: 'Component' },
  { id: 'document', label: 'Document' },
  { id: 'versions', label: 'Versions' },
];

const TEXT_PROPS = [
  { name: 'title', label: 'Title' },
  { name: 'content', label: 'Content' },
  { name: 'message', label: 'Message' },
  { name: 'initials', label: 'Initials' },
  { name: 'buttonLabel', label: 'Button label' },
  { name: 'confirmLabel', label: 'Confirm label' },
  { name: 'cancelLabel', label: 'Cancel label' },
];

const CHOICE_PROPS = [
  { name: 'size', label: 'Size', options: ['small', 'medium', 'large'] },
  { name: 'orientation', label: 'Orientation', options: ['horizontal', 'vertical'] },
];

const cloneProps = (props) => JSON.parse(JSON.stringify(props ?? {}));

export const Home = () => {
  const navigate = useNavigate();

  const [editorMode, setEditorMode] = useState(true);
  const [project, setProject] = useState(() => loadProject() ?? createEmptyProject());
  const [activePageId, setActivePageId] = useState(() => project.pages[0].id);
  const [versions, setVersions] = useState(() => loadVersions());
  const [activeBreakpoint, setActiveBreakpoint] = useState(DEFAULT_BREAKPOINT);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [draggedComponentId, setDraggedComponentId] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);
  const [editorMessage, setEditorMessage] = useState('');
  const [editorNotice, setEditorNotice] = useState(null);
  const [sizeDraft, setSizeDraft] = useState({ width: '', height: '' });
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('component');
  const [generation, setGeneration] = useState(null);
  const [cssIncluded, setCssIncluded] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState([]);
  const dragSourceRef = useRef(null);
  const previewKeyRef = useRef(null);

  const activePage = getPage(project, activePageId) ?? project.pages[0];
  const selectedComponent = selectedComponentId ? getComponent(activePage, selectedComponentId) : null;
  const selectedProps = selectedComponent?.props ?? {};
  const selectedItem = selectedComponent ? getLayoutItem(activePage, activeBreakpoint, selectedComponentId) : null;
  const breakpointColumns = BREAKPOINTS[activeBreakpoint].columns;
  const activeLayout = activePage.layouts[activeBreakpoint];
  const isPreviewingGeneration = generation?.stage === GENERATION_STAGES.preview;
  const displayedPage = isPreviewingGeneration ? generation.page : activePage;
  const canEdit = editorMode && !isPreviewingGeneration;
  const previewWidth = BREAKPOINTS[activeBreakpoint].previewWidth;

  useEffect(() => {
    saveProject(project);
  }, [project]);

  const generatedCode = useMemo(
    () => (isCodePanelOpen ? generateProjectCode(project, { includeStylesheet: cssIncluded }) : null),
    [isCodePanelOpen, project, cssIncluded]
  );

  const closeCodePanel = useCallback(() => setIsCodePanelOpen(false), []);

  const selectedWidth = selectedItem ? String(selectedItem.width) : '';
  const selectedHeight = selectedItem ? String(selectedItem.height) : '';

  useEffect(() => {
    setSizeDraft({ width: selectedWidth, height: selectedHeight });
  }, [selectedWidth, selectedHeight, selectedComponentId, activeBreakpoint]);

  const pageRows = Math.max(
    MIN_PAGE_ROWS,
    getOccupiedRows(getChildItems(displayedPage, activeBreakpoint, null)) + EXTRA_PAGE_ROWS,
    dropPreview && dropPreview.parentId === null ? dropPreview.row + dropPreview.height + EXTRA_PAGE_ROWS : 0
  );

  const updateActivePage = (nextPage) => {
    setProject(replacePage(project, nextPage));
  };

  const applyModelResult = (result) => {
    if (result.error) {
      setEditorMessage(describeModelError(result));
      return false;
    }
    updateActivePage(result.page);
    setEditorMessage('');
    return true;
  };

  const resetDrag = () => {
    dragSourceRef.current = null;
    previewKeyRef.current = null;
    setDropPreview(null);
    setDraggedComponentId(null);
  };

  const resetPageState = () => {
    setSelectedComponentId(null);
    setGeneration(null);
    setEditorMessage('');
    setEditorNotice(null);
  };

  const handlePaletteDragStart = (event, catalogComponent) => {
    if (!canEdit) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', catalogComponent.nome);
    dragSourceRef.current = {
      kind: 'new',
      type: catalogComponent.nome,
      width: scaleWidth(catalogComponent.lunghezza, BREAKPOINTS.desktop.columns, breakpointColumns),
      height: catalogComponent.altezza,
      props: catalogComponent.props,
      grabCol: 0,
      grabRow: 0,
    };
  };

  const handleItemDragStart = (event, item) => {
    event.stopPropagation();
    if (!canEdit) {
      event.preventDefault();
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const columnWidth = bounds.width / item.width;
    const grabCol = Math.min(Math.max(Math.floor((event.clientX - bounds.left) / columnWidth), 0), item.width - 1);
    const grabRow = Math.min(Math.max(Math.floor((event.clientY - bounds.top) / ROW_HEIGHT), 0), item.height - 1);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
    dragSourceRef.current = { kind: 'existing', componentId: item.id, width: item.width, height: item.height, grabCol, grabRow };
    setTimeout(() => setDraggedComponentId(item.id), 0);
  };

  const getDropTarget = (event, area) => {
    const source = dragSourceRef.current;
    const bounds = event.currentTarget.getBoundingClientRect();
    const columnWidth = bounds.width / area.columns;
    return {
      parentId: area.parentId,
      col: Math.floor((event.clientX - bounds.left) / columnWidth) - source.grabCol,
      row: Math.floor((event.clientY - bounds.top) / ROW_HEIGHT) - source.grabRow,
      width: source.kind === 'new' ? Math.min(source.width, area.columns) : source.width,
      height: source.height,
    };
  };

  const evaluateDrop = (target) => {
    const source = dragSourceRef.current;
    if (source.kind === 'new') {
      return addComponent(
        activePage,
        activeBreakpoint,
        { type: source.type, width: target.width, height: target.height, props: source.props },
        target
      );
    }
    return moveComponent(activePage, activeBreakpoint, source.componentId, target);
  };

  const handleAreaDragOver = (event, area) => {
    if (!dragSourceRef.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const target = getDropTarget(event, area);
    const previewKey = `${target.parentId}|${target.col}|${target.row}|${target.width}`;
    if (previewKey === previewKeyRef.current) {
      return;
    }
    previewKeyRef.current = previewKey;
    setDropPreview({ ...target, valid: evaluateDrop(target).error === null });
  };

  const handleAreaDrop = (event, area) => {
    if (!dragSourceRef.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const source = dragSourceRef.current;
    const result = evaluateDrop(getDropTarget(event, area));
    if (applyModelResult(result)) {
      setSelectedComponentId(source.kind === 'new' ? result.componentId : source.componentId);
    }
    resetDrag();
  };

  const handleSelectComponent = (componentId) => {
    if (!isPreviewingGeneration) {
      setSelectedComponentId(componentId);
    }
  };

  const handleDeleteComponent = (componentId) => {
    const removedIds = [componentId, ...getDescendantIds(activePage, componentId)];
    updateActivePage(removeComponent(activePage, activeBreakpoint, componentId));
    if (removedIds.includes(selectedComponentId)) {
      setSelectedComponentId(null);
    }
    setEditorMessage('');
  };

  const handleDeleteSelectedComponent = () => {
    if (selectedComponentId) {
      handleDeleteComponent(selectedComponentId);
    }
  };

  const handleApplySize = (event) => {
    event.preventDefault();
    if (!selectedComponentId) {
      return;
    }
    applyModelResult(
      resizeComponent(activePage, activeBreakpoint, selectedComponentId, {
        width: Number(sizeDraft.width),
        height: Number(sizeDraft.height),
      })
    );
  };

  const handleBreakpointChange = (breakpointId) => {
    setActiveBreakpoint(breakpointId);
    setGeneration(null);
    setEditorMessage('');
    setEditorNotice(null);
  };

  const persistVersions = (nextVersions) => {
    setVersions(saveVersions(nextVersions));
  };

  const showGeneratedPreview = () => {
    const result = generateLayoutFromDesktop(activePage, activeBreakpoint);
    setEditorNotice(null);
    if (result.error) {
      setGeneration(null);
      setEditorMessage(describeReflowError(result));
      return;
    }
    const changedComponentIds = findChangedComponents(activePage, result.page, activeBreakpoint);
    const breakpointLabel = BREAKPOINTS[activeBreakpoint].label;
    setSelectedComponentId(null);
    setEditorMessage('');
    if (changedComponentIds.length === 0) {
      setGeneration(null);
      setEditorNotice({
        tone: 'info',
        text: `The ${breakpointLabel} layout of ${activePage.name} already matches the one generated from desktop: nothing to change.`,
      });
      return;
    }
    setGeneration({
      stage: GENERATION_STAGES.preview,
      breakpointId: activeBreakpoint,
      page: result.page,
      changedComponentIds,
    });
  };

  const handleGenerateFromDesktop = () => {
    const hasManualLayout = activeLayout.status === LAYOUT_STATUS.manual && activeLayout.items.length > 0;
    if (hasManualLayout) {
      setGeneration({ stage: GENERATION_STAGES.confirmOverwrite, breakpointId: activeBreakpoint });
      return;
    }
    showGeneratedPreview();
  };

  const handleConfirmGeneration = () => {
    const breakpointLabel = BREAKPOINTS[generation.breakpointId].label;
    const label = `Before generating ${breakpointLabel} layout of ${activePage.name}`;
    persistVersions(createVersion(versions, project, label));
    updateActivePage(generation.page);
    setGeneration(null);
    setEditorNotice({
      tone: 'success',
      text: `${breakpointLabel} layout generated from desktop: ${generation.changedComponentIds.length} of ${Object.keys(generation.page.components).length} components rearranged. The previous layout is saved in Versions.`,
    });
  };

  const handleCancelGeneration = () => {
    setGeneration(null);
  };

  const handleSaveVersion = (label) => {
    persistVersions(createVersion(versions, project, label));
  };

  const handleRestoreVersion = (versionId) => {
    const version = findVersion(versions, versionId);
    if (!version) {
      return;
    }
    persistVersions(createVersion(versions, project, 'Before restore'));
    const restoredProject = getRestoredProject(version);
    setProject(restoredProject);
    setActivePageId(getPage(restoredProject, activePage.id) ? activePage.id : restoredProject.pages[0].id);
    resetPageState();
  };

  const handleSelectPage = (pageId) => {
    setActivePageId(pageId);
    resetPageState();
  };

  const applyPageResult = (result) => {
    if (result.error) {
      return PAGE_ERROR_MESSAGES[result.error] ?? 'The operation is not allowed.';
    }
    setProject(result.project);
    if (result.pageId !== activePage.id) {
      setActivePageId(result.pageId);
      resetPageState();
    }
    return null;
  };

  const handleAddPage = () => applyPageResult(addPage(project));

  const handleRenamePage = (pageId, name) => applyPageResult(renamePage(project, pageId, name));

  const handleChangePagePath = (pageId, path) => applyPageResult(changePagePath(project, pageId, normalizePagePath(path)));

  const handleDuplicatePage = (pageId) => applyPageResult(duplicatePage(project, pageId));

  const handleDeletePage = (pageId) => {
    const result = removePage(project, pageId);
    if (!result.error) {
      persistVersions(createVersion(versions, project, `Before deleting page ${getPage(project, pageId).name}`));
    }
    return applyPageResult(result);
  };

  const handleDownloadZip = () => {
    const projectCode = generateProjectCode(project, { includeStylesheet: cssIncluded });
    createProjectArchive(projectCode)
      .generateAsync({ type: "blob" })
      .then((content) => {
        saveAs(content, `${projectCode.appName}.zip`);
      });
  };

  const clearAll = () => {
    if (Object.keys(activePage.components).length > 0) {
      persistVersions(createVersion(versions, project, `Before clearing ${activePage.name}`));
    }
    setProject(clearPage(project, activePage.id));
    resetPageState();
  };

  const handleNavigateToPath = (path) => {
    const targetPage = project.pages.find((page) => page.path === path);
    if (targetPage && targetPage.id !== activePage.id) {
      handleSelectPage(targetPage.id);
    }
  };

  const navigation = { navigateTo: handleNavigateToPath };

  const handleInputChangeProps = (e) => {
    if (!selectedComponentId) {
      return;
    }
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    const keys = name.split(".");

    const updatedSelectedProps = cloneProps(selectedProps);
    let ref = updatedSelectedProps;

    keys.slice(0, -1).forEach((key) => {
      if (!ref[key]) ref[key] = {};
      ref = ref[key];
    });
    ref[keys[keys.length - 1]] = newValue;
    updateActivePage(updateComponentProps(activePage, selectedComponentId, updatedSelectedProps));
  };

  const handleInputDocName = (e) => {
    setProject(updateProjectSettings(project, { name: e.target.value }));
  };

  const toggleCategory = (category) => {
    setCollapsedCategories(
      collapsedCategories.includes(category)
        ? collapsedCategories.filter((collapsed) => collapsed !== category)
        : [...collapsedCategories, category]
    );
  };

  const navigateToLibrary = () => {
    navigate("/library");
  };

  const handleColorChange = (newColor) => {
    setProject(updateProjectSettings(project, { backgroundColor: newColor.target.value }));
  };

  return (
    <div>
      <header className="yuild-header">
        <div className="yuild-header-group">
          <img src={YuildLogoLight} className="yuild-logo-header" alt="Yuild" />
          <span className="yuild-header-divider" aria-hidden="true" />
          <div className="yuild-header-context">
            <span className="yuild-header-project">{project.name}</span>
            <span className="yuild-header-page">
              {activePage.name} <code>{activePage.path}</code>
            </span>
          </div>
        </div>
        <div className="yuild-header-group">
          <BreakpointSwitcher activeBreakpoint={activeBreakpoint} onChange={handleBreakpointChange} />
          {activeBreakpoint !== SOURCE_BREAKPOINT && (
            <>
              <button
                type="button"
                className="yuild-button primary"
                onClick={handleGenerateFromDesktop}
                disabled={generation !== null}
                title={`Rebuild the ${BREAKPOINTS[activeBreakpoint].label} layout of this page from the desktop layout, with a preview before applying it`}
              >
                Generate from desktop
              </button>
              <span className={`layout-status-badge ${activeLayout.status}`}>Layout: {activeLayout.status}</span>
            </>
          )}
        </div>
        <div className="yuild-header-group">
          <label className="yuild-switch">
            <input
              type="checkbox"
              className="yuild-switch-input"
              checked={editorMode}
              onChange={(e) => setEditorMode(e.target.checked)}
            />
            <span className="yuild-switch-track" aria-hidden="true">
              <span className="yuild-switch-thumb" />
            </span>
            <span className="yuild-switch-label">Editor mode</span>
          </label>
          <button type="button" className="yuild-button ghost" onClick={navigateToLibrary}>
            Go to Library UI
          </button>
          <button
            type="button"
            className={`yuild-button ghost ${isCodePanelOpen ? 'active' : ''}`}
            aria-pressed={isCodePanelOpen}
            onClick={() => setIsCodePanelOpen(!isCodePanelOpen)}
          >
            {isCodePanelOpen ? "Hide editor" : "Show editor"}
          </button>
          <button type="button" className="yuild-button ghost danger" onClick={clearAll}>
            Clear
          </button>
          <button type="button" className="yuild-button primary" onClick={handleDownloadZip} aria-label="Download project">
            <img src={DownloadIcon} className="yuild-button-icon" alt="" />
            Export
          </button>
          <span className="yuild-header-divider" aria-hidden="true" />
          <a
            href="https://github.com/RnDSydea/yuild"
            target="_blank"
            rel="noreferrer"
            className="yuild-header-link"
            aria-label="Yuild on GitHub"
          >
            <img src={GithubLogo} alt="" className="logo-github" />
          </a>
          <a href="https://www.sydea.com" target="_blank" rel="noreferrer" className="yuild-header-link" aria-label="Sydea">
            <span className="yuild-header-brand">
              <svg id="Livello_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 772 188.18">
                    <path d="M451.1,57v76.3c0,14.2-2.8,25.3-8.4,33.1-5.6,7.8-14.8,13.3-27.5,16.5s-30.3,4.8-52.9,4.8h-88.6v-68.8l43.6-66.5v103.2h43c12.3,0,21.7-.5,27.9-1.6,6.3-1.1,10.8-3.1,13.6-6.2,2.8-3.1,4.2-7.9,4.2-14.5V56.1c0-8.9-3.5-15.1-10.5-18.7-6.6-3.4-16.9-5.1-30.8-5.3h-.8l-71.2.1-48.8,79.7v75.8h-45.1v-75.2l-48.8-80.7c-31.3.1-68.8.4-76.7.4-15.2,0,1.5.1-7.4.1-12.2,0-20.7,10-20.7,15.8v10.5c0,9.8,8.3,14.8,24.9,14.8h38.1c21.4,0,36.9,3.9,46.5,11.9,9.6,7.9,14.5,19.9,14.5,36.1v12.4c0,22.4-4.2,35.9-16.2,44.6-10.8,7.7-26.4,9.2-36.9,9.2-9.5,0-14.3.7-28,.5-16.5-.1-56.9.3-88-.1v-30c31.9,0,77.5.1,89.5.1,21.6,0,34.5.8,34.5-19.4v-12.1c0-6.2-1.8-10.9-5.4-14.2-3.6-3.3-10-4.9-19.2-4.9h-37.6C20.6,107.5,0,91.1,0,58.3v-13.9C0,28,6.8,16,20.5,8.3,34.2.6,34.8.3,64.5.3h66.4l-.1-.1h51.2l39.6,73.4L260.9.2h101.2c6.2,0,12,.1,17.5.4,13.9.7,25.4,2.2,34.6,4.6,12.7,3.4,22.1,9.2,28,17.5,5.9,8.2,8.9,19.6,8.9,34.3Z" style={{fill: '#f6f6f6'}}/>
                    <polygon points="573.8 150.1 573.8 187.7 463.7 187.7 463.7 123.1 501.5 123.1 501.5 150.1 573.8 150.1" style={{fill: '#f6f6f6'}}/>
                    <path d="M598.1,123.1l-23.9,64.5h44.5l21.6-64.5h-42.2ZM742.9,123.1h-44l21.6,64.5h45.7l-23.3-64.5ZM698.5,0h-54.9l-33.6,91h41.2l17.9-53.4h1.1l17.9,53.4h43.3L698.5,0Z" style={{fill: '#f6f6f6'}}/>
                    <polygon points="574.2 0 574.2 37.6 501.5 37.6 501.5 91 463.7 91 463.7 0 574.2 0" style={{fill: '#f6f6f6'}}/>
                    <polygon points="501.5 123.1 501.5 91 573.9 91 573.9 48.9 598.2 123.1 501.5 123.1" style={{fill: '#fece2f'}}/>
                    <polygon points="772 123.1 640.4 123.1 651.2 91 760.4 91 772 123.1" style={{fill: '#fece2f'}} />
                  </svg>
            </span>
          </a>
        </div>
      </header>

      <div className="main-container">
        <div className="components-container">
          <PagePanel
            pages={project.pages}
            activePageId={activePage.id}
            onSelect={handleSelectPage}
            onAdd={handleAddPage}
            onRename={handleRenamePage}
            onChangePath={handleChangePagePath}
            onDuplicate={handleDuplicatePage}
            onDelete={handleDeletePage}
          />
          <p className="palette-title">Components</p>
          {ComponentsData.map((section, index) => (
            <div key={index}>
              {Object.entries(section).map(([key, value]) => {
                const isCollapsed = collapsedCategories.includes(key);
                return (
                  <div key={key} className="row-key-component">
                    <button
                      type="button"
                      className={`row-key-menu ${isCollapsed ? 'collapsed' : ''}`}
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleCategory(key)}
                    >
                      <span className="key-item-component">{key}</span>
                      <img src={ArrowUp} className="icon-arrow-menu" alt="" />
                    </button>
                    {!isCollapsed &&
                      value.components.map((component, idx) => (
                        <div
                          key={`tile-${index}-${idx}`}
                          className="tile"
                          draggable={editorMode}
                          onDragStart={(event) => handlePaletteDragStart(event, component)}
                          onDragEnd={resetDrag}
                        >
                          <span className="drag-icon" aria-hidden="true">
                            <svg fill="currentcolor" viewBox="0 0 24 24">
                              <path d="M10,4A2,2,0,1,1,8,2,2,2,0,0,1,10,4ZM8,10a2,2,0,1,0,2,2A2,2,0,0,0,8,10Zm0,8a2,2,0,1,0,2,2A2,2,0,0,0,8,18ZM16,6a2,2,0,1,0-2-2A2,2,0,0,0,16,6Zm0,8a2,2,0,1,0-2-2A2,2,0,0,0,16,14Zm0,8a2,2,0,1,0-2-2A2,2,0,0,0,16,22Z" />
                            </svg>
                          </span>
                          <span className="tile-name">{component.nome}</span>
                          <span className="tile-size">
                            {component.lunghezza}×{component.altezza}
                          </span>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="drag-and-drop-container y-relative">
          {generation && (
            <LayoutGenerationBar
              stage={generation.stage}
              breakpointLabel={BREAKPOINTS[generation.breakpointId].label}
              changedCount={generation.changedComponentIds?.length ?? 0}
              totalCount={Object.keys(activePage.components).length}
              onContinue={showGeneratedPreview}
              onConfirm={handleConfirmGeneration}
              onCancel={handleCancelGeneration}
            />
          )}
          {editorNotice && !editorMessage && (
            <p className={`editor-notice ${editorNotice.tone}`} role="status">
              {editorNotice.text}
            </p>
          )}
          {editorMessage && (
            <p className="editor-message" role="alert">
              {editorMessage}
            </p>
          )}
          <div
            className={`y-container box-page editor-page ${isPreviewingGeneration ? 'previewing' : ''}`}
            style={{
              backgroundColor: project.backgroundColor,
              width: previewWidth ? `${previewWidth}px` : "100%",
            }}
            onClick={() => setSelectedComponentId(null)}
          >
            <NavigationContext.Provider value={navigation}>
              <EditorGrid
                page={displayedPage}
                breakpointId={activeBreakpoint}
                parentId={null}
                columns={breakpointColumns}
                rows={pageRows}
                editorMode={canEdit}
                selectedComponentId={selectedComponentId}
                draggedComponentId={draggedComponentId}
                dropPreview={dropPreview}
                highlightedComponentIds={isPreviewingGeneration ? generation.changedComponentIds : []}
                componentMap={LIBRARY_COMPONENTS}
                onAreaDragOver={handleAreaDragOver}
                onAreaDrop={handleAreaDrop}
                onItemDragStart={handleItemDragStart}
                onItemDragEnd={resetDrag}
                onSelect={handleSelectComponent}
                onDelete={handleDeleteComponent}
              />
            </NavigationContext.Provider>
          </div>
        </div>
        <div className="component-details-column" onClick={(event) => event.stopPropagation()}>
          <div className="comp-col-props">
            <div className="panel-tabs">
              {RIGHT_PANEL_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`panel-tab ${rightPanelTab === id ? 'selected' : ''}`}
                  aria-pressed={rightPanelTab === id}
                  onClick={() => setRightPanelTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {rightPanelTab === 'component' && !selectedComponent && (
              <p className="panel-empty">Select a component on the page to edit its size and properties.</p>
            )}
            {rightPanelTab === 'versions' && (
              <VersionPanel versions={versions} onSave={handleSaveVersion} onRestore={handleRestoreVersion} />
            )}
            {
              rightPanelTab === 'document' && 
              <div className="y-d-flex y-flex-direction-column y-gap-3 y-py-3">
                <div className="y-w-100 y-d-flex y-flex-direction-column">
                  <p className="props-comp-label">Name</p>
                  <input
                    spellCheck="false"
                    value={project.name}
                    name="label"
                    onChange={handleInputDocName}
                    className="input-props-comp"
                  />
                </div>
                <div>
                  <p className="props-comp-label">Background Color</p>
                  <ColorPicker colorProps={{ onChange: handleColorChange, value: project.backgroundColor }} />
                </div>
                <label className="yuild-switch">
                  <input
                    type="checkbox"
                    className="yuild-switch-input"
                    checked={cssIncluded}
                    onChange={(ev) => setCssIncluded(ev.target.checked)}
                  />
                  <span className="yuild-switch-track" aria-hidden="true">
                    <span className="yuild-switch-thumb" />
                  </span>
                  <span className="yuild-switch-label">Include CSS</span>
                </label>
              </div>
            }

            <div className="y-d-flex y-justify-content-end y-py-2">
            {selectedComponent && rightPanelTab === 'component' &&
              <>
                <div 
                  onClick={handleDeleteSelectedComponent}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    className="trash-icon"
                  >
                    <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                  </svg>
                </div>
              </>
            }
            </div>
            {selectedComponent && rightPanelTab === 'component' && (
              <>
              <p className="props-comp-topic">{selectedComponent.type}</p>
              <form className="row-comp-props editor-size-form" onSubmit={handleApplySize}>
                <p className="props-comp-label">
                  Size on {BREAKPOINTS[activeBreakpoint].label} (columns × rows)
                </p>
                <div className="y-d-flex y-gap-2 y-align-items-center">
                  <input
                    type="number"
                    min="1"
                    aria-label="Width in columns"
                    value={sizeDraft.width}
                    onChange={(e) => setSizeDraft({ ...sizeDraft, width: e.target.value })}
                    className="input-props-comp editor-size-input"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    min="1"
                    aria-label="Height in rows"
                    value={sizeDraft.height}
                    onChange={(e) => setSizeDraft({ ...sizeDraft, height: e.target.value })}
                    className="input-props-comp editor-size-input"
                  />
                  <button type="submit" className="yuild-button primary small">Apply</button>
                </div>
                {selectedItem && (
                  <p className="props-comp-label">
                    Column {selectedItem.col + 1}, row {selectedItem.row + 1}
                  </p>
                )}
              </form>
              <p className="props-comp-topic">Props</p>
                {selectedProps.theme && (
                  <div className="row-comp-props">
                    <p className="props-comp-label">Theme</p>
                    <select
                      name="theme"
                      id="theme-select"
                      value={selectedProps.theme}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    >
                      <option value="sap">sap</option>
                      <option value="material">yuild</option>
                    </select>
                  </div>
                )}
                {selectedProps.label !== null &&
                  selectedProps.label !== undefined && (
                    <div className="row-comp-props y-w-100 y-d-flex y-flex-direction-column">
                      <p className="props-comp-label">Label</p>
                      <input
                        value={selectedProps.label}
                        name="label"
                        onChange={handleInputChangeProps}
                        className="input-props-comp"
                      />
                    </div>
                  )}
                {selectedProps.placeholder !== null &&
                  selectedProps.placeholder !== undefined && (
                    <div className="row-comp-props y-w-100 y-d-flex y-flex-direction-column">
                      <p className="props-comp-label">Placeholder</p>
                      <input
                        value={selectedProps.placeholder}
                        name="placeholder"
                        onChange={handleInputChangeProps}
                        className="input-props-comp"
                      />
                    </div>
                  )}

                {TEXT_PROPS.filter(({ name }) => typeof selectedProps[name] === 'string').map(({ name, label }) => (
                  <div key={name} className="row-comp-props y-w-100 y-d-flex y-flex-direction-column">
                    <p className="props-comp-label">{label}</p>
                    <input
                      value={selectedProps[name]}
                      name={name}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    />
                  </div>
                ))}
                {typeof selectedProps.to === 'string' && (
                  <div className="row-comp-props">
                    <p className="props-comp-label">Link to page</p>
                    <select
                      name="to"
                      aria-label="Link to page"
                      value={selectedProps.to}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    >
                      {project.pages.map((page) => (
                        <option key={page.id} value={page.path}>
                          {page.name} ({page.path})
                        </option>
                      ))}
                      {!project.pages.some((page) => page.path === selectedProps.to) && (
                        <option value={selectedProps.to}>{selectedProps.to}</option>
                      )}
                    </select>
                  </div>
                )}
                {CHOICE_PROPS.filter(({ name }) => typeof selectedProps[name] === 'string').map(({ name, label, options }) => (
                  <div key={name} className="row-comp-props">
                    <p className="props-comp-label">{label}</p>
                    <select name={name} value={selectedProps[name]} onChange={handleInputChangeProps} className="input-props-comp">
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {typeof selectedProps.defaultOpen === 'boolean' && (
                  <div className="row-comp-props">
                    <p className="props-comp-label">Open by default</p>
                    <input
                      type="checkbox"
                      checked={selectedProps.defaultOpen}
                      name="defaultOpen"
                      onChange={handleInputChangeProps}
                      className="checkbox-props-comp"
                    />
                  </div>
                )}

                {selectedProps.variant && (
                  <div className="row-comp-props">
                    <p className="props-comp-label">Variant</p>
                    <select
                      name="variant"
                      value={selectedProps.variant || "default"}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    >
                      <option value="default">default</option>
                      <option value="disabled">disabled</option>
                      <option value="readOnly">readOnly</option>
                      <option value="error">error</option>
                      <option value="success">success</option>
                      <option value="warning">warning</option>
                      <option value="information">information</option>
                    </select>
                  </div>
                )}

                {selectedProps.disabled !== null &&
                  selectedProps.disabled !== undefined && (
                    <div className="row-comp-props">
                      <p className="props-comp-label">Disabled</p>
                      <input
                        type="checkbox"
                        checked={selectedProps.disabled}
                        name="disabled"
                        onChange={handleInputChangeProps}
                        className="checkbox-props-comp"
                      />
                    </div>
                  )}

                {selectedProps.required !== null &&
                  selectedProps.required !== undefined && (
                    <div className="row-comp-props">
                      <p className="props-comp-label">Required</p>
                      <input
                        type="checkbox"
                        checked={selectedProps.required}
                        name="required"
                        onChange={handleInputChangeProps}
                        className="checkbox-props-comp"
                      />
                    </div>
                  )}

                {selectedProps.readOnly !== null &&
                  selectedProps.readOnly !== undefined && (
                    <div className="row-comp-props">
                      <p className="props-comp-label">Read only</p>
                      <input
                        type="checkbox"
                        checked={selectedProps.readOnly}
                        name="readOnly"
                        onChange={handleInputChangeProps}
                        className="checkbox-props-comp"
                      />
                    </div>
                  )}

                {!isContainerType(selectedComponent.type) && (
                <>
                <p className="props-comp-topic" style={{ marginTop: "1rem" }}>
                  Layout
                </p>
                <div className="row-comp-props">
                  <div>
                    <p className="props-comp-label">Display</p>
                    <select
                      name="layout.display"
                      value={selectedProps.layout?.display || "block"}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    >
                      <option value="block">block</option>
                      <option value="flex">flex</option>
                      <option value="inline">inline</option>
                      <option value="grid">grid</option>
                    </select>
                  </div>
                  {selectedProps.layout?.display === "flex" && (
                    <>
                      <div>
                        <p className="props-comp-label">Direction</p>
                        <select
                          name="layout.direction"
                          value={selectedProps.layout?.direction || "row"}
                          onChange={handleInputChangeProps}
                          className="input-props-comp"
                        >
                          <option value="row">row</option>
                          <option value="row-reverse">row-reverse</option>
                          <option value="column">column</option>
                          <option value="column-reverse">column-reverse</option>
                        </select>
                      </div>
                      <div>
                        <p className="props-comp-label">Vertical Align</p>
                        <select
                          name="layout.vertical-align"
                          value={
                            selectedProps.layout?.["vertical-align"] || "center"
                          }
                          onChange={handleInputChangeProps}
                          className="input-props-comp"
                        >
                          <option value="center">center</option>
                          <option value="start">start</option>
                          <option value="end">end</option>
                          <option value="stretch">stretch</option>
                        </select>
                      </div>
                      <div>
                        <p className="props-comp-label">Horizontal Align</p>
                        <select
                          name="layout.horizontal-align"
                          value={
                            selectedProps.layout?.["horizontal-align"] ||
                            "center"
                          }
                          onChange={handleInputChangeProps}
                          className="input-props-comp"
                        >
                          <option value="center">center</option>
                          <option value="start">start</option>
                          <option value="end">end</option>
                          <option value="space-between">space-between</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <p className="props-comp-topic" style={{ marginTop: "1rem" }}>
                  Spacing
                </p>
                <div className="row-comp-props">
                  <div>
                    <p className="props-comp-label">Margin</p>
                    <p className="props-comp-label">All</p>
                    <input
                      value={selectedProps.spacing?.margin.all}
                      name="spacing.margin.all"
                      onChange={handleInputChangeProps}
                      placeholder="0px"
                      className="input-props-comp"
                    />
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Top</p>
                        <input
                          value={selectedProps.spacing?.margin.top}
                          name="spacing.margin.top"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Left</p>
                        <input
                          value={selectedProps.spacing?.margin.left}
                          name="spacing.margin.left"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Right</p>
                        <input
                          value={selectedProps.spacing?.margin.right}
                          name="spacing.margin.right"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Bottom</p>
                        <input
                          value={selectedProps.spacing?.margin.bottom}
                          name="spacing.margin.bottom"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="props-comp-label">Padding</p>
                    <p className="props-comp-label">All</p>
                    <input
                      value={selectedProps.spacing?.padding.all}
                      name="spacing.padding.all"
                      onChange={handleInputChangeProps}
                      placeholder="0px"
                      className="input-props-comp"
                    />
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Top</p>
                        <input
                          value={selectedProps.spacing?.padding.top}
                          name="spacing.padding.top"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Left</p>
                        <input
                          value={selectedProps.spacing?.padding.left}
                          name="spacing.padding.left"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Right</p>
                        <input
                          value={selectedProps.spacing?.padding.right}
                          name="spacing.padding.right"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Bottom</p>
                        <input
                          value={selectedProps.spacing?.padding.bottom}
                          name="spacing.padding.bottom"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <CodePanel
        isOpen={isCodePanelOpen}
        files={generatedCode?.files ?? {}}
        preferredFile={generatedCode?.pageFiles[activePage.id]?.[0]}
        onClose={closeCodePanel}
      />
    </div>
  );
};
