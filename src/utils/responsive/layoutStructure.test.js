import { comesBefore, findReadingOrderInversions, getReadingOrder, groupIntoBands } from './layoutStructure';
import { getMinimumWidth } from './minimumWidths';

describe('groupIntoBands', () => {
  test('groups items that share rows, even through a chain of overlaps', () => {
    const bands = groupIntoBands([
      { id: 'tall', col: 0, row: 0, width: 6, height: 10 },
      { id: 'top-right', col: 12, row: 0, width: 6, height: 4 },
      { id: 'bottom-right', col: 12, row: 6, width: 6, height: 4 },
      { id: 'footer', col: 0, row: 12, width: 24, height: 2 },
    ]);
    expect(bands.map((band) => band.items.map((item) => item.id))).toEqual([
      ['tall', 'top-right', 'bottom-right'],
      ['footer'],
    ]);
    expect(bands[0]).toMatchObject({ top: 0, bottom: 10 });
  });

  test('items that only touch vertically belong to different bands', () => {
    const bands = groupIntoBands([
      { id: 'a', col: 0, row: 0, width: 6, height: 3 },
      { id: 'b', col: 6, row: 3, width: 6, height: 3 },
    ]);
    expect(bands).toHaveLength(2);
  });
});

describe('reading order', () => {
  test('reads bands from top to bottom and each band from left to right', () => {
    expect(
      getReadingOrder([
        { id: 'right-column', col: 12, row: 0, width: 12, height: 10 },
        { id: 'left-top', col: 0, row: 0, width: 12, height: 5 },
        { id: 'left-bottom', col: 0, row: 5, width: 12, height: 5 },
        { id: 'footer', col: 0, row: 11, width: 24, height: 2 },
      ])
    ).toEqual(['left-top', 'left-bottom', 'right-column', 'footer']);
  });

  test('an item comes before another when it is fully above or fully to its left on shared rows', () => {
    expect(comesBefore({ col: 0, row: 0, width: 6, height: 2 }, { col: 0, row: 2, width: 6, height: 2 })).toBe(true);
    expect(comesBefore({ col: 0, row: 0, width: 6, height: 4 }, { col: 6, row: 2, width: 6, height: 4 })).toBe(true);
    expect(comesBefore({ col: 6, row: 0, width: 6, height: 4 }, { col: 0, row: 2, width: 6, height: 4 })).toBe(false);
  });

  test('reports pairs whose order is inverted in the target layout', () => {
    const source = [
      { id: 'a', col: 0, row: 0, width: 12, height: 2 },
      { id: 'b', col: 12, row: 0, width: 12, height: 2 },
    ];
    expect(findReadingOrderInversions(source, [
      { id: 'a', col: 0, row: 0, width: 6, height: 2 },
      { id: 'b', col: 0, row: 3, width: 6, height: 2 },
    ])).toEqual([]);
    expect(findReadingOrderInversions(source, [
      { id: 'a', col: 0, row: 3, width: 6, height: 2 },
      { id: 'b', col: 0, row: 0, width: 6, height: 2 },
    ])).toEqual([{ earlierId: 'a', laterId: 'b' }]);
  });
});

describe('getMinimumWidth', () => {
  test('reads the table and falls back to the default', () => {
    expect(getMinimumWidth('Input', 'mobile')).toBe(6);
    expect(getMinimumWidth('Unknown', 'tablet')).toBe(2);
  });

  test('never exceeds the columns of the breakpoint', () => {
    expect(getMinimumWidth('Table', 'mobile')).toBeLessThanOrEqual(6);
  });
});
