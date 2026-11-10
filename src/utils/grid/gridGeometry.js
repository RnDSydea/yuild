export const PLACEMENT_ERRORS = {
  invalidSize: 'invalid-size',
  outOfBounds: 'out-of-bounds',
  overlap: 'overlap',
};

const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

export const hasValidGeometry = (rect) =>
  isNonNegativeInteger(rect.col) &&
  isNonNegativeInteger(rect.row) &&
  isPositiveInteger(rect.width) &&
  isPositiveInteger(rect.height);

export const rectanglesOverlap = (first, second) =>
  first.col < second.col + second.width &&
  second.col < first.col + first.width &&
  first.row < second.row + second.height &&
  second.row < first.row + first.height;

export const isInsideArea = (rect, area) => {
  const fitsColumns = rect.col + rect.width <= area.columns;
  const fitsRows = area.rows === undefined || rect.row + rect.height <= area.rows;
  return fitsColumns && fitsRows;
};

export const findCollisions = (rect, siblings) =>
  siblings.filter((sibling) => sibling.id !== rect.id && rectanglesOverlap(rect, sibling));

export const getPlacementError = (rect, siblings, area) => {
  if (!hasValidGeometry(rect)) {
    return PLACEMENT_ERRORS.invalidSize;
  }
  if (!isInsideArea(rect, area)) {
    return PLACEMENT_ERRORS.outOfBounds;
  }
  if (findCollisions(rect, siblings).length > 0) {
    return PLACEMENT_ERRORS.overlap;
  }
  return null;
};

export const canPlace = (rect, siblings, area) => getPlacementError(rect, siblings, area) === null;

export const getOccupiedRows = (rects) =>
  rects.reduce((lastRow, rect) => Math.max(lastRow, rect.row + rect.height), 0);

export const getCoveredCells = (rect) => {
  const cells = [];
  for (let row = rect.row; row < rect.row + rect.height; row++) {
    for (let col = rect.col; col < rect.col + rect.width; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
};

export const findFirstFreePosition = (siblings, size, area) => {
  const width = Math.min(size.width, area.columns);
  const height = size.height;
  if (!isPositiveInteger(width) || !isPositiveInteger(height)) {
    return null;
  }
  const lastCandidateRow = area.rows === undefined ? getOccupiedRows(siblings) : area.rows - height;
  for (let row = 0; row <= lastCandidateRow; row++) {
    for (let col = 0; col + width <= area.columns; col++) {
      const candidate = { col, row, width, height };
      if (canPlace(candidate, siblings, area)) {
        return candidate;
      }
    }
  }
  return null;
};

export const scaleWidth = (width, sourceColumns, targetColumns) => {
  const scaled = Math.round((width * targetColumns) / sourceColumns);
  return Math.min(Math.max(scaled, 1), targetColumns);
};
