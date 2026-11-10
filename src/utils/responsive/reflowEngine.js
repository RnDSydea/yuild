import { BREAKPOINTS } from '../grid/breakpoints';
import { getOccupiedRows } from '../grid/gridGeometry';
import { isContainerType } from '../project/componentTypes';
import { LAYOUT_STATUS, findLayoutProblems, getChildItems } from '../project/pageModel';
import { groupIntoBands, sortBandInReadingOrder } from './layoutStructure';
import { validateGeneratedLayout } from './layoutQuality';
import { getMinimumWidth } from './minimumWidths';

export const SOURCE_BREAKPOINT = 'desktop';

export const STACK_GAP_ROWS = 1;

export const REFLOW_ERRORS = {
  invalidTarget: 'invalid-target',
  invalidSource: 'invalid-source',
  invalidResult: 'invalid-result',
};

export const ARRANGEMENTS = {
  sideBySide: 'side-by-side',
  twoPerRow: 'two-per-row',
  onePerRow: 'one-per-row',
};

const createContext = (page, targetBreakpointId) => ({
  page,
  targetBreakpointId,
  minimumWidthCache: new Map(),
  decisions: [],
});

const getEffectiveMinimumWidth = (context, componentId) => {
  if (context.minimumWidthCache.has(componentId)) {
    return context.minimumWidthCache.get(componentId);
  }
  const component = context.page.components[componentId];
  const ownMinimum = getMinimumWidth(component.type, context.targetBreakpointId);
  const childrenMinimum = isContainerType(component.type)
    ? Math.max(0, ...getChildItems(context.page, SOURCE_BREAKPOINT, componentId).map((child) => getEffectiveMinimumWidth(context, child.id)))
    : 0;
  const minimum = Math.min(Math.max(ownMinimum, childrenMinimum), BREAKPOINTS[context.targetBreakpointId].columns);
  context.minimumWidthCache.set(componentId, minimum);
  return minimum;
};

const scaleEdge = (edge, sourceColumns, targetColumns) => Math.round((edge * targetColumns) / sourceColumns);

const planSideBySide = (band, sourceColumns, targetColumns) =>
  band.items.map((item) => {
    const col = scaleEdge(item.col, sourceColumns, targetColumns);
    const end = scaleEdge(item.col + item.width, sourceColumns, targetColumns);
    return { item, col, width: end - col };
  });

const getSlotLayout = (targetColumns, slotsPerRow) => {
  const baseWidth = Math.floor(targetColumns / slotsPerRow);
  const remainder = targetColumns - baseWidth * slotsPerRow;
  let col = 0;
  return Array.from({ length: slotsPerRow }, (unused, slotIndex) => {
    const width = baseWidth + (slotIndex < remainder ? 1 : 0);
    const slot = { col, width };
    col += width;
    return slot;
  });
};

const planGrid = (band, targetColumns, slotsPerRow) => {
  const slots = getSlotLayout(targetColumns, slotsPerRow);
  return sortBandInReadingOrder(band.items).map((item, index) => ({
    item,
    col: slots[index % slotsPerRow].col,
    width: slots[index % slotsPerRow].width,
    gridRow: Math.floor(index / slotsPerRow),
  }));
};

const planOnePerRow = (context, band, sourceColumns, targetColumns) =>
  sortBandInReadingOrder(band.items).map((item, index) => {
    const scaledCol = scaleEdge(item.col, sourceColumns, targetColumns);
    const scaledWidth = scaleEdge(item.col + item.width, sourceColumns, targetColumns) - scaledCol;
    const width = Math.min(targetColumns, Math.max(scaledWidth, getEffectiveMinimumWidth(context, item.id), 1));
    return { item, col: Math.min(Math.max(scaledCol, 0), targetColumns - width), width, gridRow: index };
  });

const planArrangement = (context, band, candidate, sourceColumns, targetColumns) => {
  if (candidate.arrangement === ARRANGEMENTS.sideBySide) {
    return planSideBySide(band, sourceColumns, targetColumns);
  }
  if (candidate.arrangement === ARRANGEMENTS.onePerRow) {
    return planOnePerRow(context, band, sourceColumns, targetColumns);
  }
  return planGrid(band, targetColumns, candidate.slotsPerRow);
};

const respectsMinimumWidths = (context, plan) =>
  plan.every((entry) => entry.width >= Math.max(1, getEffectiveMinimumWidth(context, entry.item.id)));

const getCandidateArrangements = (context, band) => {
  const candidates = [{ arrangement: ARRANGEMENTS.sideBySide }];
  if (context.targetBreakpointId === 'tablet' && band.items.length > 1) {
    candidates.push({ arrangement: ARRANGEMENTS.twoPerRow, slotsPerRow: 2 });
  }
  candidates.push({ arrangement: ARRANGEMENTS.onePerRow, slotsPerRow: 1 });
  return candidates;
};

const chooseArrangement = (context, band, sourceColumns, targetColumns) => {
  const candidates = getCandidateArrangements(context, band);
  for (const candidate of candidates) {
    const plan = planArrangement(context, band, candidate, sourceColumns, targetColumns);
    if (respectsMinimumWidths(context, plan)) {
      return { arrangement: candidate.arrangement, plan };
    }
  }
  const fallback = candidates[candidates.length - 1];
  return { arrangement: fallback.arrangement, plan: planArrangement(context, band, fallback, sourceColumns, targetColumns) };
};

const resolveSize = (context, entry) => {
  const { item } = entry;
  const component = context.page.components[item.id];
  if (!isContainerType(component.type)) {
    return { height: item.height, nestedItems: [] };
  }
  const sourceChildren = getChildItems(context.page, SOURCE_BREAKPOINT, item.id);
  const bottomPadding = Math.max(0, item.height - getOccupiedRows(sourceChildren));
  const inner = reflowArea(context, item.id, item.width, entry.width);
  return { height: Math.max(1, inner.rows + bottomPadding), nestedItems: inner.items };
};

const columnsOverlap = (first, second) => first.col < second.col + second.width && second.col < first.col + first.width;

const placeSideBySide = (context, band, plan, bandTop) => {
  const placed = [];
  const nestedItems = [];
  const orderedPlan = [...plan].sort((first, second) => first.item.row - second.item.row || first.item.col - second.item.col);
  orderedPlan.forEach((entry) => {
    const size = resolveSize(context, entry);
    let row = bandTop + (entry.item.row - band.top);
    placed.forEach((previous) => {
      const sourceBottom = previous.source.row + previous.source.height;
      if (sourceBottom <= entry.item.row && columnsOverlap(previous.target, entry)) {
        row = Math.max(row, previous.target.row + previous.target.height + (entry.item.row - sourceBottom));
      }
    });
    const target = { id: entry.item.id, col: entry.col, row, width: entry.width, height: size.height };
    placed.push({ source: entry.item, target });
    nestedItems.push(...size.nestedItems);
  });
  return { items: [...placed.map((entry) => entry.target), ...nestedItems] };
};

const placeGridRow = (context, rowEntries, rowTop) => {
  const placedEntries = rowEntries.map((entry) => ({ entry, size: resolveSize(context, entry) }));
  return {
    items: placedEntries.map(({ entry, size }) => ({ id: entry.item.id, col: entry.col, row: rowTop, width: entry.width, height: size.height })),
    nestedItems: placedEntries.flatMap(({ size }) => size.nestedItems),
    height: Math.max(...placedEntries.map(({ size }) => size.height)),
  };
};

const placeGrid = (context, plan, bandTop) => {
  const items = [];
  const nestedItems = [];
  let rowTop = bandTop;
  const rowCount = Math.max(...plan.map((entry) => entry.gridRow)) + 1;
  for (let gridRow = 0; gridRow < rowCount; gridRow++) {
    const placedRow = placeGridRow(context, plan.filter((entry) => entry.gridRow === gridRow), rowTop);
    items.push(...placedRow.items);
    nestedItems.push(...placedRow.nestedItems);
    rowTop += placedRow.height + (gridRow < rowCount - 1 ? STACK_GAP_ROWS : 0);
  }
  return { items: [...items, ...nestedItems] };
};

const reflowArea = (context, parentId, sourceColumns, targetColumns) => {
  const children = getChildItems(context.page, SOURCE_BREAKPOINT, parentId);
  const bands = groupIntoBands(children);
  const items = [];
  let nextRow = 0;
  let previousSourceBottom = 0;
  bands.forEach((band) => {
    const bandTop = nextRow + (band.top - previousSourceBottom);
    const { arrangement, plan } = chooseArrangement(context, band, sourceColumns, targetColumns);
    context.decisions.push({ parentId, componentIds: band.items.map((item) => item.id), arrangement });
    const placed =
      arrangement === ARRANGEMENTS.sideBySide
        ? placeSideBySide(context, band, plan, bandTop)
        : placeGrid(context, plan, bandTop);
    const directItems = placed.items.filter((item) => band.items.some((bandItem) => bandItem.id === item.id));
    items.push(...placed.items);
    nextRow = getOccupiedRows(directItems);
    previousSourceBottom = band.bottom;
  });
  return { items, rows: nextRow };
};

export const generateLayoutFromDesktop = (page, targetBreakpointId) => {
  if (targetBreakpointId === SOURCE_BREAKPOINT || !BREAKPOINTS[targetBreakpointId]) {
    return { page, error: REFLOW_ERRORS.invalidTarget, problems: [], decisions: [] };
  }
  const sourceProblems = findLayoutProblems(page, SOURCE_BREAKPOINT);
  if (sourceProblems.length > 0) {
    return { page, error: REFLOW_ERRORS.invalidSource, problems: sourceProblems, decisions: [] };
  }
  const context = createContext(page, targetBreakpointId);
  const { items } = reflowArea(
    context,
    null,
    BREAKPOINTS[SOURCE_BREAKPOINT].columns,
    BREAKPOINTS[targetBreakpointId].columns
  );
  const generatedPage = {
    ...page,
    layouts: {
      ...page.layouts,
      [targetBreakpointId]: { status: LAYOUT_STATUS.auto, items },
    },
  };
  const problems = validateGeneratedLayout(generatedPage, SOURCE_BREAKPOINT, targetBreakpointId);
  if (problems.length > 0) {
    return { page, error: REFLOW_ERRORS.invalidResult, problems, decisions: context.decisions };
  }
  return { page: generatedPage, error: null, problems: [], decisions: context.decisions };
};
