const INPUT_ROWS = 18;

const inputGrid = Array.from({ length: INPUT_ROWS }, (unused, rowIndex) =>
  [0, 6, 12, 18].map((col, columnIndex) => ({
    id: `input-${rowIndex}-${columnIndex}`,
    type: 'Input',
    col,
    row: rowIndex * 6,
    width: 6,
    height: 5,
  }))
).flat();

const toolbarTop = INPUT_ROWS * 6;

const toolbars = Array.from({ length: 3 }, (unused, sectionIndex) => {
  const sectionId = `toolbar-${sectionIndex}`;
  return [
    { id: sectionId, type: 'Section', col: 0, row: toolbarTop + sectionIndex * 9, width: 24, height: 8 },
    ...[0, 4, 8, 12, 16, 20].map((col, buttonIndex) => ({
      id: `${sectionId}-button-${buttonIndex}`,
      type: 'Button',
      parentId: sectionId,
      col,
      row: 1,
      width: 4,
      height: 3,
    })),
  ];
}).flat();

const cardTop = toolbarTop + 27;

const cards = [0, 6, 12, 18].flatMap((col, index) => [
  { id: `card-${index}`, type: 'Card', col, row: cardTop, width: 6, height: 10 },
  { id: `card-${index}-chip`, type: 'Chip', parentId: `card-${index}`, col: 0, row: 1, width: 3, height: 2 },
  { id: `card-${index}-button`, type: 'Button', parentId: `card-${index}`, col: 0, row: 5, width: 4, height: 3 },
]);

export const largePageDefinitions = [...inputGrid, ...toolbars, ...cards];
