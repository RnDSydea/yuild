import { BREAKPOINT_ORDER } from '../grid/breakpoints';
import {
  LAYOUT_STATUS,
  MODEL_ERRORS,
  addComponent,
  createEmptyPage,
  findLayoutProblems,
  getChildItems,
  getLayoutItem,
  moveComponent,
  removeComponent,
  resizeComponent,
  setLayoutStatus,
  updateComponentProps,
} from './pageModel';
import { isValidPage } from './projectSchema';

const add = (page, breakpointId, definition, target) => {
  const result = addComponent(page, breakpointId, definition, target);
  if (result.error) {
    throw new Error(result.error);
  }
  return result;
};

const expectNoProblems = (page) => {
  BREAKPOINT_ORDER.forEach((breakpointId) => {
    expect(findLayoutProblems(page, breakpointId)).toEqual([]);
  });
};

describe('createEmptyPage', () => {
  test('produces a valid page with an empty layout for every breakpoint', () => {
    const page = createEmptyPage();
    expect(isValidPage(page)).toBe(true);
    expect(Object.keys(page.layouts)).toEqual(BREAKPOINT_ORDER);
  });
});

describe('addComponent', () => {
  test('places the component in the active breakpoint and scales it into the others', () => {
    const { page, componentId } = add(
      createEmptyPage(),
      'desktop',
      { id: 'button', type: 'Button', width: 12, height: 3, props: { label: 'Ok' } },
      { parentId: null, col: 4, row: 2 }
    );
    expect(getLayoutItem(page, 'desktop', componentId)).toEqual({ id: 'button', col: 4, row: 2, width: 12, height: 3 });
    expect(getLayoutItem(page, 'tablet', componentId)).toEqual({ id: 'button', col: 0, row: 0, width: 6, height: 3 });
    expect(getLayoutItem(page, 'mobile', componentId)).toEqual({ id: 'button', col: 0, row: 0, width: 3, height: 3 });
    expect(page.components.button).toEqual({ id: 'button', type: 'Button', props: { label: 'Ok' }, parentId: null });
    expect(isValidPage(page)).toBe(true);
  });

  test('copies props instead of sharing the catalog object', () => {
    const catalogProps = { layout: { display: 'block' } };
    const { page } = add(createEmptyPage(), 'desktop', { id: 'a', type: 'Button', width: 2, height: 2, props: catalogProps }, { col: 0, row: 0 });
    catalogProps.layout.display = 'flex';
    expect(page.components.a.props.layout.display).toBe('block');
  });

  test('rejects overlaps and positions outside the grid without changing the page', () => {
    const { page } = add(createEmptyPage(), 'desktop', { id: 'a', type: 'Button', width: 6, height: 3 }, { col: 0, row: 0 });
    const overlapping = addComponent(page, 'desktop', { id: 'b', type: 'Button', width: 6, height: 3 }, { col: 3, row: 1 });
    expect(overlapping.error).toBe(MODEL_ERRORS.overlap);
    expect(overlapping.page).toBe(page);
    const outside = addComponent(page, 'desktop', { id: 'c', type: 'Button', width: 6, height: 3 }, { col: 20, row: 0 });
    expect(outside.error).toBe(MODEL_ERRORS.outOfBounds);
  });

  test('new layouts start as automatic', () => {
    BREAKPOINT_ORDER.forEach((breakpointId) => {
      expect(createEmptyPage().layouts[breakpointId].status).toBe(LAYOUT_STATUS.auto);
    });
  });

  test('marks only the active layout as manual', () => {
    const start = setLayoutStatus(createEmptyPage(), 'tablet', LAYOUT_STATUS.auto);
    const { page } = add(start, 'desktop', { id: 'a', type: 'Button', width: 2, height: 2 }, { col: 0, row: 0 });
    expect(page.layouts.desktop.status).toBe(LAYOUT_STATUS.manual);
    expect(page.layouts.tablet.status).toBe(LAYOUT_STATUS.auto);
  });

  test('stacks components in the other breakpoints without overlaps', () => {
    let page = createEmptyPage();
    for (let index = 0; index < 8; index++) {
      page = add(page, 'desktop', { id: `item-${index}`, type: 'Input', width: 6, height: 4 }, { col: (index % 4) * 6, row: Math.floor(index / 4) * 4 }).page;
    }
    expectNoProblems(page);
    expect(getLayoutItem(page, 'mobile', 'item-7')).toEqual({ id: 'item-7', col: 2, row: 8, width: 2, height: 4 });
  });
});

describe('containers', () => {
  const withSection = () =>
    add(createEmptyPage(), 'desktop', { id: 'section', type: 'Section', width: 24, height: 10 }, { col: 0, row: 0 }).page;

  test('children use coordinates relative to the container grid', () => {
    const page = add(withSection(), 'desktop', { id: 'child', type: 'Button', width: 4, height: 3 }, { parentId: 'section', col: 20, row: 7 }).page;
    expect(getChildItems(page, 'desktop', 'section').map((item) => item.id)).toEqual(['child']);
    expect(getChildItems(page, 'desktop', null).map((item) => item.id)).toEqual(['section']);
    expectNoProblems(page);
  });

  test('children cannot leave the container bounds', () => {
    const result = addComponent(withSection(), 'desktop', { id: 'child', type: 'Button', width: 4, height: 3 }, { parentId: 'section', col: 0, row: 8 });
    expect(result.error).toBe(MODEL_ERRORS.outOfBounds);
  });

  test('only container types accept children', () => {
    const page = add(createEmptyPage(), 'desktop', { id: 'button', type: 'Button', width: 4, height: 3 }, { col: 0, row: 0 }).page;
    const result = addComponent(page, 'desktop', { id: 'child', type: 'Button', width: 1, height: 1 }, { parentId: 'button', col: 0, row: 0 });
    expect(result.error).toBe(MODEL_ERRORS.invalidParent);
  });

  test('allows two levels of containers and rejects the third', () => {
    let page = withSection();
    page = add(page, 'desktop', { id: 'card', type: 'Card', width: 12, height: 8 }, { parentId: 'section', col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'inner', type: 'Button', width: 4, height: 3 }, { parentId: 'card', col: 0, row: 0 }).page;
    const tooDeep = addComponent(page, 'desktop', { id: 'deep', type: 'Section', width: 4, height: 3 }, { parentId: 'card', col: 6, row: 0 });
    expect(tooDeep.error).toBe(MODEL_ERRORS.nestingTooDeep);
    expectNoProblems(page);
  });

  test('grows a container in another breakpoint when its free space runs out', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'section', type: 'Section', width: 24, height: 3 }, { col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'a', type: 'Button', width: 14, height: 3 }, { parentId: 'section', col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'b', type: 'Button', width: 10, height: 3 }, { parentId: 'section', col: 14, row: 0 }).page;
    expect(getLayoutItem(page, 'mobile', 'section').height).toBe(6);
    expectNoProblems(page);
  });
});

describe('moveComponent', () => {
  test('moves inside the same parent only in the active breakpoint', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'a', type: 'Button', width: 4, height: 2 }, { col: 0, row: 0 }).page;
    const tabletBefore = getLayoutItem(page, 'tablet', 'a');
    const result = moveComponent(page, 'desktop', 'a', { parentId: null, col: 10, row: 5 });
    expect(result.error).toBeNull();
    page = result.page;
    expect(getLayoutItem(page, 'desktop', 'a')).toEqual({ id: 'a', col: 10, row: 5, width: 4, height: 2 });
    expect(getLayoutItem(page, 'tablet', 'a')).toEqual(tabletBefore);
  });

  test('allows moving onto the area the item already occupies', () => {
    const page = add(createEmptyPage(), 'desktop', { id: 'a', type: 'Button', width: 4, height: 2 }, { col: 0, row: 0 }).page;
    expect(moveComponent(page, 'desktop', 'a', { col: 1, row: 1 }).error).toBeNull();
  });

  test('moving into a container updates the parent in every breakpoint', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'section', type: 'Section', width: 24, height: 10 }, { col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'a', type: 'Button', width: 4, height: 2 }, { col: 0, row: 12 }).page;
    page = moveComponent(page, 'desktop', 'a', { parentId: 'section', col: 2, row: 2 }).page;
    expect(page.components.a.parentId).toBe('section');
    BREAKPOINT_ORDER.forEach((breakpointId) => {
      expect(getChildItems(page, breakpointId, 'section').map((item) => item.id)).toEqual(['a']);
    });
    expectNoProblems(page);
  });

  test('a container cannot be moved into itself or its descendants', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'section', type: 'Section', width: 24, height: 10 }, { col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'card', type: 'Card', width: 12, height: 8 }, { parentId: 'section', col: 0, row: 0 }).page;
    expect(moveComponent(page, 'desktop', 'section', { parentId: 'section', col: 0, row: 0 }).error).toBe(MODEL_ERRORS.invalidParent);
    expect(moveComponent(page, 'desktop', 'section', { parentId: 'card', col: 0, row: 0 }).error).toBe(MODEL_ERRORS.invalidParent);
  });

  test('rejects nesting that would exceed two container levels', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'outer', type: 'Section', width: 24, height: 10 }, { col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'inner', type: 'Card', width: 12, height: 8 }, { parentId: 'outer', col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'other', type: 'Section', width: 24, height: 10 }, { col: 0, row: 12 }).page;
    expect(moveComponent(page, 'desktop', 'outer', { parentId: 'other', col: 0, row: 0 }).error).toBe(MODEL_ERRORS.nestingTooDeep);
  });
});

describe('resizeComponent', () => {
  test('validates the new size against siblings and grid', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'a', type: 'Button', width: 4, height: 2 }, { col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'b', type: 'Button', width: 4, height: 2 }, { col: 6, row: 0 }).page;
    expect(resizeComponent(page, 'desktop', 'a', { width: 8, height: 2 }).error).toBe(MODEL_ERRORS.overlap);
    expect(resizeComponent(page, 'desktop', 'b', { width: 20, height: 2 }).error).toBe(MODEL_ERRORS.outOfBounds);
    const result = resizeComponent(page, 'desktop', 'a', { width: 6, height: 4 });
    expect(result.error).toBeNull();
    expect(getLayoutItem(result.page, 'desktop', 'a')).toEqual({ id: 'a', col: 0, row: 0, width: 6, height: 4 });
  });

  test('a container cannot shrink below its children', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'section', type: 'Section', width: 24, height: 10 }, { col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'a', type: 'Button', width: 4, height: 2 }, { parentId: 'section', col: 10, row: 6 }).page;
    expect(resizeComponent(page, 'desktop', 'section', { width: 12, height: 10 }).error).toBe(MODEL_ERRORS.childrenOutside);
    expect(resizeComponent(page, 'desktop', 'section', { width: 14, height: 8 }).error).toBeNull();
  });
});

describe('removeComponent and updateComponentProps', () => {
  test('removing a container removes its descendants from every breakpoint', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'section', type: 'Section', width: 24, height: 10 }, { col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'card', type: 'Card', width: 12, height: 8 }, { parentId: 'section', col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'button', type: 'Button', width: 4, height: 2 }, { parentId: 'card', col: 0, row: 0 }).page;
    page = add(page, 'desktop', { id: 'free', type: 'Button', width: 4, height: 2 }, { col: 0, row: 12 }).page;
    page = removeComponent(page, 'desktop', 'section');
    expect(Object.keys(page.components)).toEqual(['free']);
    BREAKPOINT_ORDER.forEach((breakpointId) => {
      expect(page.layouts[breakpointId].items.map((item) => item.id)).toEqual(['free']);
    });
    expect(isValidPage(page)).toBe(true);
  });

  test('props are shared by all breakpoints', () => {
    let page = add(createEmptyPage(), 'desktop', { id: 'a', type: 'Button', width: 4, height: 2, props: { label: 'A' } }, { col: 0, row: 0 }).page;
    page = updateComponentProps(page, 'a', { label: 'B' });
    expect(page.components.a.props).toEqual({ label: 'B' });
  });
});
