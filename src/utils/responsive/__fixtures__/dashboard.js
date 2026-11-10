const kpiCards = [0, 6, 12, 18].flatMap((col, index) => [
  { id: `kpi-${index}`, type: 'Card', col, row: 4, width: 6, height: 8 },
  { id: `kpi-${index}-avatar`, type: 'Avatar', parentId: `kpi-${index}`, col: 0, row: 1, width: 1, height: 3 },
  { id: `kpi-${index}-chip`, type: 'Chip', parentId: `kpi-${index}`, col: 2, row: 1, width: 3, height: 2 },
  { id: `kpi-${index}-link`, type: 'Link', parentId: `kpi-${index}`, col: 0, row: 5, width: 4, height: 2 },
]);

export const dashboardDefinitions = [
  { id: 'tabs', type: 'Tabs', col: 0, row: 0, width: 24, height: 3 },
  ...kpiCards,
  { id: 'chart-card', type: 'Card', col: 0, row: 13, width: 16, height: 18 },
  { id: 'chart', type: 'Table', parentId: 'chart-card', col: 1, row: 1, width: 14, height: 15 },
  { id: 'activity-card', type: 'Card', col: 16, row: 13, width: 8, height: 18 },
  { id: 'activity-1', type: 'Accordion', parentId: 'activity-card', col: 1, row: 1, width: 6, height: 3 },
  { id: 'activity-2', type: 'Accordion', parentId: 'activity-card', col: 1, row: 5, width: 6, height: 3 },
  { id: 'activity-3', type: 'Accordion', parentId: 'activity-card', col: 1, row: 9, width: 6, height: 3 },
  { id: 'alert', type: 'Alert', col: 0, row: 32, width: 12, height: 3 },
  { id: 'toast', type: 'Toast', col: 12, row: 32, width: 12, height: 3 },
];
