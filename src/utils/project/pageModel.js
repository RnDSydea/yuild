import { BREAKPOINT_ORDER, getBreakpointColumns } from '../grid/breakpoints';
import {
  PLACEMENT_ERRORS,
  findCollisions,
  findFirstFreePosition,
  getOccupiedRows,
  getPlacementError,
  hasValidGeometry,
  isInsideArea,
  scaleWidth,
} from '../grid/gridGeometry';
import { MAX_CONTAINER_DEPTH, isContainerType } from './componentTypes';

export const LAYOUT_STATUS = {
  auto: 'auto',
  manual: 'manuale',
};

export const MODEL_ERRORS = {
  ...PLACEMENT_ERRORS,
  notFound: 'not-found',
  invalidParent: 'invalid-parent',
  nestingTooDeep: 'nesting-too-deep',
  childrenOutside: 'children-outside',
  noSpace: 'no-space',
};

let componentCounter = 0;

export const createComponentId = () => {
  componentCounter += 1;
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `comp-${Date.now().toString(36)}-${componentCounter.toString(36)}-${randomSuffix}`;
};

let pageCounter = 0;

export const createPageId = () => {
  pageCounter += 1;
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `page-${Date.now().toString(36)}-${pageCounter.toString(36)}-${randomSuffix}`;
};

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

export const createEmptyLayouts = () =>
  BREAKPOINT_ORDER.reduce(
    (layouts, breakpointId) => ({ ...layouts, [breakpointId]: { status: LAYOUT_STATUS.auto, items: [] } }),
    {}
  );

export const DEFAULT_PAGE_NAME = 'Home';

export const DEFAULT_PAGE_PATH = '/';

export const createEmptyPage = (settings = {}) => ({
  id: settings.id ?? createPageId(),
  name: settings.name ?? DEFAULT_PAGE_NAME,
  path: settings.path ?? DEFAULT_PAGE_PATH,
  components: {},
  layouts: createEmptyLayouts(),
});

export const clearPageContent = (page) => ({ ...page, components: {}, layouts: createEmptyLayouts() });

const normalizeParentId = (parentId) => parentId ?? null;

export const getComponent = (page, componentId) => page.components[componentId] ?? null;

export const getLayoutItems = (page, breakpointId) => page.layouts[breakpointId].items;

export const getLayoutItem = (page, breakpointId, componentId) =>
  getLayoutItems(page, breakpointId).find((item) => item.id === componentId) ?? null;

export const getChildItems = (page, breakpointId, parentId) => {
  const expectedParentId = normalizeParentId(parentId);
  return getLayoutItems(page, breakpointId).filter(
    (item) => normalizeParentId(page.components[item.id]?.parentId) === expectedParentId
  );
};

export const getArea = (page, breakpointId, parentId) => {
  if (!parentId) {
    return { columns: getBreakpointColumns(breakpointId) };
  }
  const container = getLayoutItem(page, breakpointId, parentId);
  return { columns: container.width, rows: container.height };
};

export const getAncestorIds = (page, componentId) => {
  const ancestorIds = [];
  let currentId = page.components[componentId]?.parentId;
  while (currentId) {
    ancestorIds.push(currentId);
    currentId = page.components[currentId]?.parentId;
  }
  return ancestorIds;
};

export const getDescendantIds = (page, componentId) => {
  const childIds = Object.values(page.components)
    .filter((component) => component.parentId === componentId)
    .map((component) => component.id);
  return childIds.flatMap((childId) => [childId, ...getDescendantIds(page, childId)]);
};

const getContainerDepth = (page, containerId) =>
  containerId ? getAncestorIds(page, containerId).length + 1 : 0;

const getContainerSubtreeDepth = (page, componentId) => {
  const component = page.components[componentId];
  if (!isContainerType(component.type)) {
    return 0;
  }
  const childDepths = Object.values(page.components)
    .filter((child) => child.parentId === componentId)
    .map((child) => getContainerSubtreeDepth(page, child.id));
  return 1 + Math.max(0, ...childDepths);
};

export const getRequiredInnerSize = (page, breakpointId, containerId) => {
  const children = getChildItems(page, breakpointId, containerId);
  return {
    columns: children.reduce((maxColumn, child) => Math.max(maxColumn, child.col + child.width), 0),
    rows: getOccupiedRows(children),
  };
};

const getParentError = (page, { componentType, componentId, parentId }) => {
  if (!parentId) {
    return null;
  }
  const parent = page.components[parentId];
  if (!parent || !isContainerType(parent.type)) {
    return MODEL_ERRORS.invalidParent;
  }
  if (componentId && (parentId === componentId || getAncestorIds(page, parentId).includes(componentId))) {
    return MODEL_ERRORS.invalidParent;
  }
  const subtreeDepth = componentId
    ? getContainerSubtreeDepth(page, componentId)
    : Number(isContainerType(componentType));
  if (getContainerDepth(page, parentId) + subtreeDepth > MAX_CONTAINER_DEPTH) {
    return MODEL_ERRORS.nestingTooDeep;
  }
  return null;
};

export const canBeChildOf = (page, { componentType, componentId, parentId }) =>
  getParentError(page, { componentType, componentId, parentId }) === null;

const withLayoutItems = (page, breakpointId, items, status) => ({
  ...page,
  layouts: {
    ...page.layouts,
    [breakpointId]: {
      ...page.layouts[breakpointId],
      items,
      status: status ?? page.layouts[breakpointId].status,
    },
  },
});

const replaceLayoutItem = (page, breakpointId, nextItem, status) =>
  withLayoutItems(
    page,
    breakpointId,
    getLayoutItems(page, breakpointId).map((item) => (item.id === nextItem.id ? nextItem : item)),
    status
  );

const growContainerToFit = (page, breakpointId, containerId, siblings, size) => {
  const container = getLayoutItem(page, breakpointId, containerId);
  if (size.width > container.width) {
    return null;
  }
  const position = { col: 0, row: getOccupiedRows(siblings), width: size.width, height: size.height };
  const grownContainer = { ...container, height: Math.max(container.height, position.row + position.height) };
  const grandParentId = normalizeParentId(page.components[containerId].parentId);
  const containerSiblings = getChildItems(page, breakpointId, grandParentId);
  if (getPlacementError(grownContainer, containerSiblings, getArea(page, breakpointId, grandParentId))) {
    return null;
  }
  return { page: replaceLayoutItem(page, breakpointId, grownContainer), position };
};

const placeInFreeSpace = (page, breakpointId, componentId, size, sourceColumns) => {
  const parentId = normalizeParentId(page.components[componentId].parentId);
  const area = getArea(page, breakpointId, parentId);
  const requiredInner = isContainerType(page.components[componentId].type)
    ? getRequiredInnerSize(page, breakpointId, componentId)
    : { columns: 1, rows: 1 };
  const width = Math.max(scaleWidth(size.width, sourceColumns, area.columns), requiredInner.columns);
  const height = Math.max(size.height, requiredInner.rows);
  if (width > area.columns) {
    return { page, error: MODEL_ERRORS.noSpace };
  }
  const siblings = getChildItems(page, breakpointId, parentId).filter((item) => item.id !== componentId);
  let nextPage = page;
  let position = findFirstFreePosition(siblings, { width, height }, area);
  if (!position && parentId) {
    const grown = growContainerToFit(page, breakpointId, parentId, siblings, { width, height });
    if (!grown) {
      return { page, error: MODEL_ERRORS.noSpace };
    }
    nextPage = grown.page;
    position = grown.position;
  }
  if (!position) {
    return { page, error: MODEL_ERRORS.noSpace };
  }
  const otherItems = getLayoutItems(nextPage, breakpointId).filter((item) => item.id !== componentId);
  return {
    page: withLayoutItems(nextPage, breakpointId, [...otherItems, { id: componentId, ...position }]),
    error: null,
  };
};

const failure = (page, error, breakpointId) => ({ page, error, breakpointId: breakpointId ?? null });

export const addComponent = (page, breakpointId, definition, target) => {
  const componentId = definition.id ?? createComponentId();
  const parentId = normalizeParentId(target.parentId);
  const parentError = getParentError(page, { componentType: definition.type, parentId });
  if (parentError) {
    return failure(page, parentError, breakpointId);
  }
  const rect = { id: componentId, col: target.col, row: target.row, width: definition.width, height: definition.height };
  const area = getArea(page, breakpointId, parentId);
  const placementError = getPlacementError(rect, getChildItems(page, breakpointId, parentId), area);
  if (placementError) {
    return failure(page, placementError, breakpointId);
  }
  const component = { id: componentId, type: definition.type, props: cloneValue(definition.props ?? {}), parentId };
  let nextPage = { ...page, components: { ...page.components, [componentId]: component } };
  nextPage = withLayoutItems(
    nextPage,
    breakpointId,
    [...getLayoutItems(nextPage, breakpointId), rect],
    LAYOUT_STATUS.manual
  );
  for (const otherBreakpointId of BREAKPOINT_ORDER.filter((id) => id !== breakpointId)) {
    const result = placeInFreeSpace(nextPage, otherBreakpointId, componentId, rect, area.columns);
    if (result.error) {
      return failure(page, result.error, otherBreakpointId);
    }
    nextPage = result.page;
  }
  return { page: nextPage, error: null, breakpointId: null, componentId };
};

export const moveComponent = (page, breakpointId, componentId, target) => {
  const component = getComponent(page, componentId);
  if (!component) {
    return failure(page, MODEL_ERRORS.notFound, breakpointId);
  }
  const currentParentId = normalizeParentId(component.parentId);
  const nextParentId = normalizeParentId(target.parentId);
  const parentChanged = currentParentId !== nextParentId;
  if (parentChanged) {
    const parentError = getParentError(page, { componentType: component.type, componentId, parentId: nextParentId });
    if (parentError) {
      return failure(page, parentError, breakpointId);
    }
  }
  const sourceColumnsByBreakpoint = BREAKPOINT_ORDER.reduce(
    (columns, id) => ({ ...columns, [id]: getArea(page, id, currentParentId).columns }),
    {}
  );
  let nextPage = parentChanged
    ? { ...page, components: { ...page.components, [componentId]: { ...component, parentId: nextParentId } } }
    : page;
  const currentItem = getLayoutItem(page, breakpointId, componentId);
  const rect = { ...currentItem, col: target.col, row: target.row };
  const placementError = getPlacementError(
    rect,
    getChildItems(nextPage, breakpointId, nextParentId),
    getArea(nextPage, breakpointId, nextParentId)
  );
  if (placementError) {
    return failure(page, placementError, breakpointId);
  }
  nextPage = replaceLayoutItem(nextPage, breakpointId, rect, LAYOUT_STATUS.manual);
  if (parentChanged) {
    for (const otherBreakpointId of BREAKPOINT_ORDER.filter((id) => id !== breakpointId)) {
      const otherItem = getLayoutItem(page, otherBreakpointId, componentId);
      const result = placeInFreeSpace(
        nextPage,
        otherBreakpointId,
        componentId,
        otherItem,
        sourceColumnsByBreakpoint[otherBreakpointId]
      );
      if (result.error) {
        return failure(page, result.error, otherBreakpointId);
      }
      nextPage = result.page;
    }
  }
  return { page: nextPage, error: null, breakpointId: null };
};

export const resizeComponent = (page, breakpointId, componentId, size) => {
  const component = getComponent(page, componentId);
  if (!component) {
    return failure(page, MODEL_ERRORS.notFound, breakpointId);
  }
  const currentItem = getLayoutItem(page, breakpointId, componentId);
  const rect = { ...currentItem, width: size.width, height: size.height };
  const parentId = normalizeParentId(component.parentId);
  const placementError = getPlacementError(
    rect,
    getChildItems(page, breakpointId, parentId),
    getArea(page, breakpointId, parentId)
  );
  if (placementError) {
    return failure(page, placementError, breakpointId);
  }
  if (isContainerType(component.type)) {
    const requiredInner = getRequiredInnerSize(page, breakpointId, componentId);
    if (rect.width < requiredInner.columns || rect.height < requiredInner.rows) {
      return failure(page, MODEL_ERRORS.childrenOutside, breakpointId);
    }
  }
  return { page: replaceLayoutItem(page, breakpointId, rect, LAYOUT_STATUS.manual), error: null, breakpointId: null };
};

export const removeComponent = (page, breakpointId, componentId) => {
  if (!getComponent(page, componentId)) {
    return page;
  }
  const removedIds = [componentId, ...getDescendantIds(page, componentId)];
  const components = Object.fromEntries(
    Object.entries(page.components).filter(([id]) => !removedIds.includes(id))
  );
  const layouts = Object.fromEntries(
    Object.entries(page.layouts).map(([id, layout]) => [
      id,
      {
        ...layout,
        items: layout.items.filter((item) => !removedIds.includes(item.id)),
        status: id === breakpointId ? LAYOUT_STATUS.manual : layout.status,
      },
    ])
  );
  return { ...page, components, layouts };
};

export const updateComponentProps = (page, componentId, props) => {
  const component = getComponent(page, componentId);
  if (!component) {
    return page;
  }
  return { ...page, components: { ...page.components, [componentId]: { ...component, props } } };
};

export const setLayoutStatus = (page, breakpointId, status) =>
  withLayoutItems(page, breakpointId, getLayoutItems(page, breakpointId), status);

export const findLayoutProblems = (page, breakpointId) => {
  const problems = [];
  const items = getLayoutItems(page, breakpointId);
  Object.keys(page.components).forEach((componentId) => {
    if (!items.some((item) => item.id === componentId)) {
      problems.push({ componentId, problem: MODEL_ERRORS.notFound });
    }
  });
  items.forEach((item) => {
    const parentId = normalizeParentId(page.components[item.id]?.parentId);
    if (!hasValidGeometry(item)) {
      problems.push({ componentId: item.id, problem: MODEL_ERRORS.invalidSize });
      return;
    }
    if (!isInsideArea(item, getArea(page, breakpointId, parentId))) {
      problems.push({ componentId: item.id, problem: MODEL_ERRORS.outOfBounds });
    }
    const collisions = findCollisions(item, getChildItems(page, breakpointId, parentId));
    if (collisions.length > 0) {
      problems.push({ componentId: item.id, problem: MODEL_ERRORS.overlap });
    }
  });
  return problems;
};
