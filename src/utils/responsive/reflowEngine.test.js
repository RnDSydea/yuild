import { BREAKPOINTS } from '../grid/breakpoints';
import { getPlacementError } from '../grid/gridGeometry';
import { LAYOUT_STATUS, createEmptyPage, findLayoutProblems, getArea, getChildItems, getLayoutItem, setLayoutStatus } from '../project/pageModel';
import { FIXTURE_PAGES, buildFixturePage } from './__fixtures__';
import { buildDesktopPage } from './__fixtures__/fixtureBuilder';
import { findMinimumWidthViolations, findReadingOrderViolations } from './layoutQuality';
import { ARRANGEMENTS, REFLOW_ERRORS, generateLayoutFromDesktop } from './reflowEngine';

const TARGET_BREAKPOINTS = ['tablet', 'mobile'];

const MAX_GENERATION_MS = 200;

const generate = (page, breakpointId) => {
  const result = generateLayoutFromDesktop(page, breakpointId);
  if (result.error) {
    throw new Error(`${result.error}: ${JSON.stringify(result.problems.slice(0, 5))}`);
  }
  return result;
};

describe('fixture pages', () => {
  test('there are at least six pages and one has at least one hundred components', () => {
    expect(FIXTURE_PAGES.length).toBeGreaterThanOrEqual(6);
    const largest = Math.max(...FIXTURE_PAGES.map((fixture) => fixture.definitions.length));
    expect(largest).toBeGreaterThanOrEqual(100);
  });

  test('the nested page has containers on two levels', () => {
    const page = buildFixturePage(FIXTURE_PAGES.find((fixture) => fixture.name.includes('nested')));
    const cardInsideSection = Object.values(page.components).find(
      (component) => component.type === 'Card' && page.components[component.parentId]?.type === 'Section'
    );
    expect(cardInsideSection).toBeDefined();
    expect(Object.values(page.components).some((component) => component.parentId === cardInsideSection.id)).toBe(true);
  });
});

describe.each(FIXTURE_PAGES)('$name', (fixture) => {
  const page = buildFixturePage(fixture);

  describe.each(TARGET_BREAKPOINTS)('generated %s layout', (breakpointId) => {
    const { page: generated } = generate(page, breakpointId);

    test('has no overlaps and nothing outside the grid', () => {
      expect(findLayoutProblems(generated, breakpointId)).toEqual([]);
      getChildItems(generated, breakpointId, null).forEach((item) => {
        expect(item.col + item.width).toBeLessThanOrEqual(BREAKPOINTS[breakpointId].columns);
      });
    });

    test('keeps every component at or above its minimum width', () => {
      expect(findMinimumWidthViolations(generated, breakpointId)).toEqual([]);
    });

    test('preserves the reading order', () => {
      expect(findReadingOrderViolations(generated, 'desktop', breakpointId)).toEqual([]);
    });

    test('keeps every component inside its own container', () => {
      Object.values(generated.components).forEach((component) => {
        const item = getLayoutItem(generated, breakpointId, component.id);
        const siblings = getChildItems(generated, breakpointId, component.parentId);
        expect(siblings.map((sibling) => sibling.id)).toContain(component.id);
        expect(getPlacementError(item, siblings, getArea(generated, breakpointId, component.parentId))).toBeNull();
      });
    });

    test('marks the layout as automatic and leaves the other layouts untouched', () => {
      expect(generated.layouts[breakpointId].status).toBe(LAYOUT_STATUS.auto);
      expect(generated.layouts.desktop).toBe(page.layouts.desktop);
      expect(generated.components).toBe(page.components);
    });
  });
});

describe('generation time', () => {
  const largeFixture = FIXTURE_PAGES.find((fixture) => fixture.definitions.length >= 100);
  const page = buildFixturePage(largeFixture);

  test.each(TARGET_BREAKPOINTS)('stays under 200 ms for the large page on %s', (breakpointId) => {
    generateLayoutFromDesktop(page, breakpointId);
    const durations = Array.from({ length: 5 }, () => {
      const start = performance.now();
      generateLayoutFromDesktop(page, breakpointId);
      return performance.now() - start;
    }).sort((first, second) => first - second);
    expect(durations[2]).toBeLessThan(MAX_GENERATION_MS);
  });
});

describe('band decisions', () => {
  const twoInputs = buildDesktopPage([
    { id: 'left', type: 'Input', col: 0, row: 0, width: 12, height: 5 },
    { id: 'right', type: 'Input', col: 12, row: 0, width: 12, height: 5 },
  ]);

  test('keeps components side by side when they stay above their minimum width', () => {
    const { page, decisions } = generate(twoInputs, 'tablet');
    expect(decisions[0].arrangement).toBe(ARRANGEMENTS.sideBySide);
    expect(getLayoutItem(page, 'tablet', 'left')).toMatchObject({ col: 0, row: 0, width: 6 });
    expect(getLayoutItem(page, 'tablet', 'right')).toMatchObject({ col: 6, row: 0, width: 6 });
  });

  test('stacks components one per row when they would become too narrow', () => {
    const { page, decisions } = generate(twoInputs, 'mobile');
    expect(decisions[0].arrangement).toBe(ARRANGEMENTS.onePerRow);
    expect(getLayoutItem(page, 'mobile', 'left')).toEqual({ id: 'left', col: 0, row: 0, width: 6, height: 5 });
    expect(getLayoutItem(page, 'mobile', 'right')).toEqual({ id: 'right', col: 0, row: 6, width: 6, height: 5 });
  });

  test('tries two per row on tablet before one per row', () => {
    const fourInputs = buildDesktopPage(
      [0, 6, 12, 18].map((col, index) => ({ id: `input-${index}`, type: 'Input', col, row: 0, width: 6, height: 5 }))
    );
    const { page, decisions } = generate(fourInputs, 'tablet');
    expect(decisions[0].arrangement).toBe(ARRANGEMENTS.twoPerRow);
    expect(getLayoutItem(page, 'tablet', 'input-1')).toMatchObject({ col: 6, row: 0, width: 6 });
    expect(getLayoutItem(page, 'tablet', 'input-2')).toMatchObject({ col: 0, row: 6, width: 6 });
  });

  test('stacked components keep their scaled width and horizontal alignment', () => {
    const actions = buildDesktopPage([
      { id: 'cancel', type: 'Button', col: 16, row: 0, width: 4, height: 3 },
      { id: 'save', type: 'Button', col: 20, row: 0, width: 4, height: 3 },
    ]);
    const { page, decisions } = generate(actions, 'mobile');
    expect(decisions[0].arrangement).toBe(ARRANGEMENTS.onePerRow);
    expect(getLayoutItem(page, 'mobile', 'cancel')).toEqual({ id: 'cancel', col: 4, row: 0, width: 2, height: 3 });
    expect(getLayoutItem(page, 'mobile', 'save')).toEqual({ id: 'save', col: 4, row: 4, width: 2, height: 3 });
  });

  test('keeps vertical gaps between bands', () => {
    const spaced = buildDesktopPage([
      { id: 'top', type: 'Button', col: 0, row: 2, width: 24, height: 3 },
      { id: 'bottom', type: 'Button', col: 0, row: 9, width: 24, height: 3 },
    ]);
    const { page } = generate(spaced, 'mobile');
    expect(getLayoutItem(page, 'mobile', 'top').row).toBe(2);
    expect(getLayoutItem(page, 'mobile', 'bottom').row).toBe(9);
  });

  test('a container grows to hold its stacked children', () => {
    const section = buildDesktopPage([
      { id: 'section', type: 'Section', col: 0, row: 0, width: 24, height: 7 },
      { id: 'a', type: 'Input', parentId: 'section', col: 0, row: 1, width: 12, height: 5 },
      { id: 'b', type: 'Input', parentId: 'section', col: 12, row: 1, width: 12, height: 5 },
    ]);
    const { page } = generate(section, 'mobile');
    expect(getLayoutItem(page, 'mobile', 'b')).toMatchObject({ col: 0, row: 7 });
    expect(getLayoutItem(page, 'mobile', 'section').height).toBe(13);
  });
});

describe('errors', () => {
  test('rejects desktop as a target', () => {
    expect(generateLayoutFromDesktop(createEmptyPage(), 'desktop').error).toBe(REFLOW_ERRORS.invalidTarget);
  });

  test('rejects an invalid desktop layout instead of producing an invalid result', () => {
    const page = buildDesktopPage([{ id: 'a', type: 'Button', col: 0, row: 0, width: 4, height: 3 }]);
    const broken = {
      ...page,
      layouts: { ...page.layouts, desktop: { ...page.layouts.desktop, items: [{ id: 'a', col: 22, row: 0, width: 4, height: 3 }] } },
    };
    const result = generateLayoutFromDesktop(broken, 'mobile');
    expect(result.error).toBe(REFLOW_ERRORS.invalidSource);
    expect(result.page).toBe(broken);
  });

  test('replaces a manual layout only when asked and returns it as automatic', () => {
    const page = setLayoutStatus(buildDesktopPage([{ id: 'a', type: 'Button', col: 0, row: 0, width: 4, height: 3 }]), 'tablet', LAYOUT_STATUS.manual);
    const result = generate(page, 'tablet');
    expect(page.layouts.tablet.status).toBe(LAYOUT_STATUS.manual);
    expect(result.page.layouts.tablet.status).toBe(LAYOUT_STATUS.auto);
  });
});
