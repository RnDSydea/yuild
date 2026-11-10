import React from 'react';
import './editorGrid.scss';
import { ROW_HEIGHT } from '../../utils/grid/breakpoints';
import { getChildItems } from '../../utils/project/pageModel';
import { isContainerType } from '../../utils/project/componentTypes';
import TrashIcon from '../../assets/trash-solid.svg';
import HandIcon from '../../assets/drag-hand.svg';

const getGridPlacement = (rect) => ({
  gridColumn: `${Math.max(rect.col, 0) + 1} / span ${rect.width}`,
  gridRow: `${Math.max(rect.row, 0) + 1} / span ${rect.height}`,
});

const getLayoutClassName = (layout) => {
  if (!layout) {
    return '';
  }
  return [
    layout.display && `yuild-d-${layout.display}`,
    layout.direction && `yuild-flex-dir-${layout.direction}`,
    layout['vertical-align'] && `yuild-vertical-align-${layout['vertical-align']}`,
    layout['horizontal-align'] && `yuild-horizontal-align-${layout['horizontal-align']}`,
  ]
    .filter(Boolean)
    .join(' ');
};

const ContainerSurface = ({ component, children }) => {
  const theme = component.props.theme || 'sap';
  const surfaceClassName = component.type === 'Card' ? `${theme}-card` : `editor-section editor-section-${theme}`;
  return <div className={`editor-container-surface ${surfaceClassName}`}>{children}</div>;
};

const EditorGridItem = ({ item, gridProps }) => {
  const { page, editorMode, selectedComponentId, draggedComponentId, highlightedComponentIds = [], componentMap, onItemDragStart, onItemDragEnd, onSelect, onDelete } = gridProps;
  const component = page.components[item.id];
  const isContainer = isContainerType(component.type);
  const ComponentToRender = componentMap[component.type];
  const itemClassName = [
    'editor-grid-item',
    isContainer && 'container',
    selectedComponentId === item.id && 'selected',
    draggedComponentId === item.id && 'dragged',
    highlightedComponentIds.includes(item.id) && 'highlighted',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={itemClassName}
      style={getGridPlacement(item)}
      draggable={editorMode}
      onDragStart={(event) => onItemDragStart(event, item)}
      onDragEnd={onItemDragEnd}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
    >
      {isContainer ? (
        <ContainerSurface component={component}>
          <EditorGrid {...gridProps} parentId={item.id} columns={item.width} rows={item.height} />
        </ContainerSurface>
      ) : (
        <div className={`editor-grid-item-content ${getLayoutClassName(component.props.layout)}`}>
          {ComponentToRender && <ComponentToRender {...component.props} />}
        </div>
      )}
      {editorMode && (
        <div className="row-inner-tools editor-grid-item-tools y-d-flex y-gap-3 y-justify-content-between">
          <div className="button-drag-component y-d-flex y-gap-1 y-align-items-center">
            <div className="editor-grid-item-icon">
              <img src={HandIcon} alt="" />
            </div>
            <span>{component.type.toUpperCase()}</span>
          </div>
          <button
            type="button"
            className="button-drag-component editor-grid-item-delete y-d-flex y-align-items-center"
            aria-label={`Delete ${component.type}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item.id);
            }}
          >
            <img src={TrashIcon} alt="" />
          </button>
        </div>
      )}
    </div>
  );
};

const EditorGrid = (props) => {
  const { page, breakpointId, parentId = null, columns, rows, editorMode, dropPreview, onAreaDragOver, onAreaDrop } = props;
  const items = getChildItems(page, breakpointId, parentId);
  const area = { parentId, columns, rows };
  const showPreview = dropPreview !== null && dropPreview.parentId === parentId;

  return (
    <div
      className={`editor-grid ${editorMode ? 'editable' : ''}`}
      data-parent-id={parentId ?? 'page'}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, ${ROW_HEIGHT}px)`,
        backgroundSize: `calc(100% / ${columns}) ${ROW_HEIGHT}px`,
      }}
      onDragOver={(event) => onAreaDragOver(event, area)}
      onDrop={(event) => onAreaDrop(event, area)}
    >
      {items.map((item) => (
        <EditorGridItem key={item.id} item={item} gridProps={{ ...props, parentId }} />
      ))}
      {showPreview && (
        <div
          className={`editor-grid-preview ${dropPreview.valid ? 'valid' : 'invalid'}`}
          style={getGridPlacement(dropPreview)}
        />
      )}
    </div>
  );
};

export default EditorGrid;
