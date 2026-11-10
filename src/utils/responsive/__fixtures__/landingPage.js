const featureCards = [0, 8, 16].flatMap((col, index) => [
  { id: `feature-${index}`, type: 'Card', parentId: 'features', col, row: 1, width: 8, height: 12 },
  { id: `feature-${index}-chip`, type: 'Chip', parentId: `feature-${index}`, col: 1, row: 1, width: 3, height: 2 },
  { id: `feature-${index}-button`, type: 'Button', parentId: `feature-${index}`, col: 1, row: 8, width: 4, height: 3 },
]);

const footerLinks = [0, 3, 6, 9].map((col, index) => ({
  id: `footer-link-${index}`,
  type: 'Link',
  parentId: 'footer',
  col,
  row: 2,
  width: 3,
  height: 2,
}));

export const landingPageDefinitions = [
  { id: 'hero', type: 'Section', col: 0, row: 0, width: 24, height: 16 },
  { id: 'logo', type: 'Link', parentId: 'hero', col: 0, row: 0, width: 2, height: 2 },
  { id: 'menu', type: 'Menu', parentId: 'hero', col: 20, row: 0, width: 4, height: 3 },
  { id: 'claim', type: 'Alert', parentId: 'hero', col: 6, row: 5, width: 12, height: 3 },
  { id: 'call-to-action', type: 'Button', parentId: 'hero', col: 9, row: 10, width: 6, height: 3 },
  { id: 'features', type: 'Section', col: 0, row: 17, width: 24, height: 14 },
  ...featureCards,
  { id: 'footer', type: 'Section', col: 0, row: 32, width: 24, height: 6 },
  ...footerLinks,
  { id: 'newsletter', type: 'Input', parentId: 'footer', col: 16, row: 0, width: 8, height: 5 },
];
