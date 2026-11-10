import { moveComponent } from '../project/pageModel';
import { buildDesktopPage } from './__fixtures__/fixtureBuilder';
import { findChangedComponents } from './layoutDiff';
import { generateLayoutFromDesktop } from './reflowEngine';

const page = buildDesktopPage([
  { id: 'left', type: 'Input', col: 0, row: 0, width: 12, height: 5 },
  { id: 'right', type: 'Input', col: 12, row: 0, width: 12, height: 5 },
]);

test('lists the components whose position or size changes in the breakpoint', () => {
  const generated = generateLayoutFromDesktop(page, 'mobile').page;
  expect(findChangedComponents(page, generated, 'mobile').sort()).toEqual(['left', 'right']);
});

test('returns nothing when the generated layout matches the current one', () => {
  const generated = generateLayoutFromDesktop(page, 'tablet').page;
  expect(findChangedComponents(generated, generateLayoutFromDesktop(generated, 'tablet').page, 'tablet')).toEqual([]);
});

test('ignores the other breakpoints', () => {
  const moved = moveComponent(page, 'desktop', 'left', { parentId: null, col: 0, row: 10 }).page;
  expect(findChangedComponents(page, moved, 'tablet')).toEqual([]);
  expect(findChangedComponents(page, moved, 'desktop')).toEqual(['left']);
});
