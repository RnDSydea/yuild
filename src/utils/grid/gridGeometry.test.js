import {
  PLACEMENT_ERRORS,
  canPlace,
  findCollisions,
  findFirstFreePosition,
  getCoveredCells,
  getOccupiedRows,
  getPlacementError,
  rectanglesOverlap,
  scaleWidth,
} from './gridGeometry';

const pageArea = { columns: 24 };

describe('rectanglesOverlap', () => {
  test('detects shared cells', () => {
    expect(rectanglesOverlap({ col: 0, row: 0, width: 4, height: 2 }, { col: 3, row: 1, width: 2, height: 2 })).toBe(true);
  });

  test('treats touching edges as free', () => {
    expect(rectanglesOverlap({ col: 0, row: 0, width: 4, height: 2 }, { col: 4, row: 0, width: 2, height: 2 })).toBe(false);
    expect(rectanglesOverlap({ col: 0, row: 0, width: 4, height: 2 }, { col: 0, row: 2, width: 4, height: 1 })).toBe(false);
  });
});

describe('getPlacementError', () => {
  const siblings = [{ id: 'a', col: 0, row: 0, width: 6, height: 3 }];

  test('accepts a free position', () => {
    expect(getPlacementError({ id: 'b', col: 6, row: 0, width: 6, height: 3 }, siblings, pageArea)).toBeNull();
  });

  test('rejects instead of truncating when the item crosses the right edge', () => {
    expect(getPlacementError({ id: 'b', col: 20, row: 0, width: 6, height: 3 }, siblings, pageArea)).toBe(PLACEMENT_ERRORS.outOfBounds);
  });

  test('rejects positions below a bounded area', () => {
    expect(getPlacementError({ id: 'b', col: 0, row: 4, width: 2, height: 3 }, [], { columns: 6, rows: 6 })).toBe(PLACEMENT_ERRORS.outOfBounds);
  });

  test('allows any row in an unbounded area', () => {
    expect(getPlacementError({ id: 'b', col: 0, row: 500, width: 2, height: 3 }, [], pageArea)).toBeNull();
  });

  test('rejects overlaps', () => {
    expect(getPlacementError({ id: 'b', col: 5, row: 2, width: 2, height: 2 }, siblings, pageArea)).toBe(PLACEMENT_ERRORS.overlap);
  });

  test('ignores the item being moved', () => {
    expect(canPlace({ id: 'a', col: 1, row: 1, width: 6, height: 3 }, siblings, pageArea)).toBe(true);
  });

  test('rejects negative, fractional or empty geometry', () => {
    expect(getPlacementError({ col: -1, row: 0, width: 2, height: 2 }, [], pageArea)).toBe(PLACEMENT_ERRORS.invalidSize);
    expect(getPlacementError({ col: 0, row: 0, width: 1.5, height: 2 }, [], pageArea)).toBe(PLACEMENT_ERRORS.invalidSize);
    expect(getPlacementError({ col: 0, row: 0, width: 0, height: 2 }, [], pageArea)).toBe(PLACEMENT_ERRORS.invalidSize);
  });
});

describe('findCollisions', () => {
  test('returns every overlapping sibling', () => {
    const siblings = [
      { id: 'a', col: 0, row: 0, width: 2, height: 2 },
      { id: 'b', col: 2, row: 0, width: 2, height: 2 },
      { id: 'c', col: 10, row: 0, width: 2, height: 2 },
    ];
    expect(findCollisions({ id: 'x', col: 1, row: 1, width: 2, height: 1 }, siblings).map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('getOccupiedRows and getCoveredCells', () => {
  test('computes the first free row', () => {
    expect(getOccupiedRows([])).toBe(0);
    expect(getOccupiedRows([{ row: 2, height: 3 }, { row: 0, height: 1 }])).toBe(5);
  });

  test('lists covered cells', () => {
    expect(getCoveredCells({ col: 1, row: 2, width: 2, height: 1 })).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ]);
  });
});

describe('findFirstFreePosition', () => {
  test('fills gaps from top to bottom and left to right', () => {
    const siblings = [{ id: 'a', col: 0, row: 0, width: 4, height: 2 }];
    expect(findFirstFreePosition(siblings, { width: 4, height: 2 }, { columns: 12 })).toEqual({ col: 4, row: 0, width: 4, height: 2 });
  });

  test('falls back to the first row after the content in an unbounded area', () => {
    const siblings = [{ id: 'a', col: 0, row: 0, width: 6, height: 2 }];
    expect(findFirstFreePosition(siblings, { width: 6, height: 1 }, { columns: 6 })).toEqual({ col: 0, row: 2, width: 6, height: 1 });
  });

  test('clamps the width to the available columns', () => {
    expect(findFirstFreePosition([], { width: 10, height: 1 }, { columns: 6 })).toEqual({ col: 0, row: 0, width: 6, height: 1 });
  });

  test('returns null when a bounded area is full', () => {
    const siblings = [{ id: 'a', col: 0, row: 0, width: 4, height: 4 }];
    expect(findFirstFreePosition(siblings, { width: 1, height: 1 }, { columns: 4, rows: 4 })).toBeNull();
  });
});

describe('scaleWidth', () => {
  test('scales proportionally between column counts', () => {
    expect(scaleWidth(12, 24, 12)).toBe(6);
    expect(scaleWidth(6, 24, 6)).toBe(2);
  });

  test('never goes below one column or above the target', () => {
    expect(scaleWidth(1, 24, 6)).toBe(1);
    expect(scaleWidth(30, 24, 6)).toBe(6);
  });
});
