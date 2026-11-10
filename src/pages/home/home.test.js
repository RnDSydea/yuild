import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { MemoryRouter } from 'react-router-dom';
import { Home } from './home';
import { PROJECT_STORAGE_KEY } from '../../utils/project/projectStorage';
import { VERSIONS_STORAGE_KEY } from '../../utils/project/projectVersions';

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

const GRID_WIDTH = 960;

const createDataTransfer = () => ({ setData: jest.fn(), getData: jest.fn(), effectAllowed: '', dropEffect: '' });

const fireDragEvent = (element, eventName, clientX, clientY) => {
  const event = createEvent[eventName](element, { dataTransfer: createDataTransfer() });
  Object.defineProperty(event, 'clientX', { value: clientX });
  Object.defineProperty(event, 'clientY', { value: clientY });
  fireEvent(element, event);
};

const renderEditor = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

const getPaletteTile = (name) => screen.getAllByText(name).find((element) => element.closest('.tile')).closest('.tile');

const getPageGrid = (container) => container.querySelector('[data-parent-id="page"]');

const getStoredProject = () => JSON.parse(window.localStorage.getItem(PROJECT_STORAGE_KEY));

const getStoredPage = (index = 0) => getStoredProject().pages[index];

const dropFromPalette = (container, name, clientX, clientY) => {
  fireEvent.dragStart(getPaletteTile(name), { dataTransfer: createDataTransfer() });
  const grid = getPageGrid(container);
  fireDragEvent(grid, 'dragOver', clientX, clientY);
  fireDragEvent(grid, 'drop', clientX, clientY);
};

beforeEach(() => {
  window.localStorage.clear();
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: GRID_WIDTH,
    bottom: 2000,
    width: GRID_WIDTH,
    height: 2000,
    x: 0,
    y: 0,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('drops a component from the palette onto explicit grid coordinates', () => {
  const { container } = renderEditor();
  dropFromPalette(container, 'Button', 85, 40);
  const project = getStoredPage();
  const [component] = Object.values(project.components);
  expect(component.type).toBe('Button');
  expect(project.layouts.desktop.items).toEqual([{ id: component.id, col: 2, row: 2, width: 3, height: 3 }]);
  expect(project.layouts.tablet.items).toHaveLength(1);
  expect(project.layouts.mobile.items).toHaveLength(1);
  expect(container.querySelectorAll('.editor-grid-item')).toHaveLength(1);
});

test('rejects a drop on an occupied area and explains why', () => {
  const { container } = renderEditor();
  dropFromPalette(container, 'Button', 85, 40);
  dropFromPalette(container, 'Button', 85, 40);
  expect(Object.keys(getStoredPage().components)).toHaveLength(1);
  expect(screen.getByRole('alert')).toHaveTextContent('That space is already occupied.');
});

test('shows a separate layout for each breakpoint', () => {
  const { container } = renderEditor();
  dropFromPalette(container, 'Button', 85, 40);
  fireEvent.click(screen.getByRole('button', { name: /tablet/i }));
  expect(getPageGrid(container).style.gridTemplateColumns).toBe('repeat(12, minmax(0, 1fr))');
  const project = getStoredPage();
  const tabletItem = project.layouts.tablet.items[0];
  expect(tabletItem.col).toBe(0);
  expect(tabletItem.row).toBe(0);
});

test('restores a saved version after clearing the page', () => {
  const { container } = renderEditor();
  dropFromPalette(container, 'Button', 85, 40);
  fireEvent.click(screen.getByRole('button', { name: 'Versions' }));
  fireEvent.change(screen.getByPlaceholderText('Version'), { target: { value: 'First layout' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save version' }));
  fireEvent.click(screen.getByText('Clear'));
  expect(Object.keys(getStoredPage().components)).toHaveLength(0);
  const savedVersions = JSON.parse(window.localStorage.getItem(VERSIONS_STORAGE_KEY));
  expect(savedVersions.map((version) => version.label)).toEqual(['Before clearing Home', 'First layout']);
  const firstLayout = screen.getByText('First layout').closest('li');
  fireEvent.click(firstLayout.querySelector('button'));
  expect(Object.keys(getStoredPage().components)).toHaveLength(1);
  expect(container.querySelectorAll('.editor-grid-item')).toHaveLength(1);
});

test('moves an existing component to a new position', () => {
  jest.useFakeTimers();
  const { container } = renderEditor();
  dropFromPalette(container, 'Button', 85, 40);
  const item = container.querySelector('.editor-grid-item');
  fireDragEvent(item, 'dragStart', 0, 0);
  act(() => {
    jest.runAllTimers();
  });
  const grid = getPageGrid(container);
  fireDragEvent(grid, 'dragOver', 400, 160);
  fireDragEvent(grid, 'drop', 400, 160);
  const [movedItem] = getStoredPage().layouts.desktop.items;
  expect(movedItem).toMatchObject({ col: 10, row: 10, width: 3, height: 3 });
  jest.useRealTimers();
});

test('drops a component inside a section using coordinates relative to the section', () => {
  const { container } = renderEditor();
  dropFromPalette(container, 'Section', 5, 5);
  const sectionId = Object.keys(getStoredPage().components)[0];
  fireEvent.dragStart(getPaletteTile('Button'), { dataTransfer: createDataTransfer() });
  const sectionGrid = container.querySelector(`[data-parent-id="${sectionId}"]`);
  fireDragEvent(sectionGrid, 'dragOver', 85, 40);
  fireDragEvent(sectionGrid, 'drop', 85, 40);
  const project = getStoredPage();
  const button = Object.values(project.components).find((component) => component.type === 'Button');
  expect(button.parentId).toBe(sectionId);
  expect(project.layouts.desktop.items.find((item) => item.id === button.id)).toMatchObject({ col: 2, row: 2 });
});

const moveFirstItemTo = (container, clientX, clientY) => {
  jest.useFakeTimers();
  const item = container.querySelector('.editor-grid-item');
  fireDragEvent(item, 'dragStart', 0, 0);
  act(() => {
    jest.runAllTimers();
  });
  const grid = getPageGrid(container);
  fireDragEvent(grid, 'dragOver', clientX, clientY);
  fireDragEvent(grid, 'drop', clientX, clientY);
  jest.useRealTimers();
};

describe('generating a layout from desktop', () => {
  test('is offered only on tablet and mobile', () => {
    renderEditor();
    expect(screen.queryByRole('button', { name: 'Generate from desktop' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }));
    expect(screen.getByRole('button', { name: 'Generate from desktop' })).toBeInTheDocument();
  });

  test('shows a preview and applies it only after confirmation, saving a version first', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Input', 5, 5);
    dropFromPalette(container, 'Input', 485, 5);
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }));
    const before = getStoredPage().layouts.mobile;
    fireEvent.click(screen.getByRole('button', { name: 'Generate from desktop' }));
    expect(screen.getByRole('region', { name: 'Generated layout preview' })).toBeInTheDocument();
    expect(getStoredPage().layouts.mobile).toEqual(before);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    const mobile = getStoredPage().layouts.mobile;
    expect(mobile.status).toBe('auto');
    expect(mobile.items.map((item) => [item.col, item.row, item.width])).toEqual([
      [0, 0, 6],
      [0, 6, 6],
    ]);
    const savedVersions = JSON.parse(window.localStorage.getItem(VERSIONS_STORAGE_KEY));
    expect(savedVersions[0].label).toBe('Before generating Mobile layout of Home');
    expect(savedVersions[0].project.pages[0].layouts.mobile).toEqual(before);
  });

  test('the preview highlights the components that change and confirming reports the result', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Input', 5, 5);
    dropFromPalette(container, 'Input', 485, 5);
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate from desktop' }));
    expect(screen.getByRole('region', { name: 'Generated layout preview' })).toHaveTextContent('2 of 2 components change position or size');
    expect(container.querySelectorAll('.editor-grid-item.highlighted')).toHaveLength(2);
    expect(container.querySelector('.editor-page')).toHaveClass('previewing');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(container.querySelectorAll('.editor-grid-item.highlighted')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('Mobile layout generated from desktop: 2 of 2 components rearranged.');
  });

  test('says so when the layout already matches the one generated from desktop', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Input', 5, 5);
    fireEvent.click(screen.getByRole('button', { name: /tablet/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate from desktop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate from desktop' }));
    expect(screen.queryByRole('region', { name: 'Generated layout preview' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('The Tablet layout of Home already matches the one generated from desktop');
  });

  test('cancelling the preview leaves the layout unchanged', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Input', 5, 5);
    fireEvent.click(screen.getByRole('button', { name: /tablet/i }));
    const before = getStoredProject();
    fireEvent.click(screen.getByRole('button', { name: 'Generate from desktop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(getStoredProject()).toEqual(before);
    expect(screen.queryByRole('region', { name: 'Generated layout preview' })).toBeNull();
  });

  test('the first manual change turns the layout to manual and generation then asks before replacing it', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Button', 5, 5);
    fireEvent.click(screen.getByRole('button', { name: /tablet/i }));
    expect(screen.getByText('Layout: auto')).toBeInTheDocument();
    moveFirstItemTo(container, 400, 160);
    expect(getStoredPage().layouts.tablet.status).toBe('manuale');
    expect(screen.getByText('Layout: manuale')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Generate from desktop' }));
    expect(screen.getByRole('alertdialog', { name: 'Replace manual layout' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Generate anyway' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(getStoredPage().layouts.tablet.status).toBe('auto');
    expect(getStoredPage().layouts.tablet.items[0]).toMatchObject({ col: 0, row: 0 });
  });
});

test('exports the project as responsive React code in a zip archive', async () => {
  const { container } = renderEditor();
  dropFromPalette(container, 'Button', 85, 40);
  fireEvent.click(screen.getByRole('button', { name: 'Download project' }));
  await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
  expect(saveAs.mock.calls[0][1]).toBe('MyYUildApp.zip');
  expect(saveAs.mock.calls[0][0]).toBeInstanceOf(Blob);
});

test('the code editor opens on demand, follows the changes and closes again', () => {
  const { container } = renderEditor();
  const panel = container.querySelector('aside.code-panel');
  expect(panel).not.toHaveClass('open');
  fireEvent.click(screen.getByRole('button', { name: 'Show editor' }));
  expect(panel).toHaveClass('open');
  expect(screen.getByRole('tab', { name: 'HomePage.js' })).toHaveAttribute('aria-selected', 'true');
  expect(container.querySelector('.code-panel-code')).not.toHaveTextContent('Button');
  dropFromPalette(container, 'Button', 85, 40);
  expect(container.querySelector('.code-panel-code')).toHaveTextContent("import Button from '../components/button/button';");
  fireEvent.click(screen.getByRole('tab', { name: 'App.js' }));
  expect(container.querySelector('.code-panel-code')).toHaveTextContent('<Route path="/" element={<HomePage />} />');
  fireEvent.click(screen.getByRole('button', { name: 'Hide editor' }));
  expect(panel).not.toHaveClass('open');
  fireEvent.click(screen.getByRole('button', { name: 'Show editor' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(panel).not.toHaveClass('open');
});

test('with editor mode off a link opens the linked page of the project', () => {
  const { container } = renderEditor();
  fireEvent.click(screen.getByRole('button', { name: 'Add page' }));
  const pathInput = screen.getByLabelText('Path');
  fireEvent.change(pathInput, { target: { value: '/about' } });
  fireEvent.blur(pathInput);
  fireEvent.click(screen.getByRole('button', { name: /^home/i }));
  dropFromPalette(container, 'Link', 5, 5);
  fireEvent.change(screen.getByRole('combobox', { name: 'Link to page' }), { target: { value: '/about' } });
  fireEvent.click(screen.getByLabelText(/editor mode/i));
  fireEvent.click(screen.getByRole('link', { name: 'Link' }));
  expect(screen.getByRole('button', { name: /page 2/i })).toHaveAttribute('aria-current', 'page');
});

describe('pages', () => {
  const addPageNamed = (name, path) => {
    fireEvent.click(screen.getByRole('button', { name: 'Add page' }));
    const nameInput = screen.getByLabelText('Page name');
    fireEvent.change(nameInput, { target: { value: name } });
    fireEvent.blur(nameInput);
    if (path) {
      const pathInput = screen.getByLabelText('Path');
      fireEvent.change(pathInput, { target: { value: path } });
      fireEvent.blur(pathInput);
    }
  };

  test('creates, renames and moves a page, normalizing the path', () => {
    renderEditor();
    addPageNamed('Chi siamo', 'Chi Siamo');
    const pages = getStoredProject().pages;
    expect(pages.map((page) => [page.name, page.path])).toEqual([
      ['Home', '/'],
      ['Chi siamo', '/chi-siamo'],
    ]);
    expect(screen.getByRole('button', { name: /chi siamo/i })).toHaveAttribute('aria-current', 'page');
  });

  test('rejects a path used by another page and explains why', () => {
    renderEditor();
    addPageNamed('About', '/');
    expect(screen.getByRole('alert')).toHaveTextContent('Another page already uses this path.');
    expect(getStoredPage(1).path).toBe('/page-2');
    expect(screen.getByLabelText('Path')).toHaveValue('/page-2');
  });

  test('each page keeps its own components and Clear empties only the active page', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Button', 85, 40);
    addPageNamed('About');
    expect(container.querySelectorAll('.editor-grid-item')).toHaveLength(0);
    dropFromPalette(container, 'Input', 5, 5);
    fireEvent.click(screen.getByText('Clear'));
    expect(Object.keys(getStoredPage(1).components)).toHaveLength(0);
    expect(Object.keys(getStoredPage(0).components)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /^home/i }));
    expect(container.querySelectorAll('.editor-grid-item')).toHaveLength(1);
  });

  test('generation from desktop acts only on the active page', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Input', 5, 5);
    dropFromPalette(container, 'Input', 485, 5);
    addPageNamed('About');
    dropFromPalette(container, 'Input', 5, 5);
    dropFromPalette(container, 'Input', 485, 5);
    const homeMobileBefore = getStoredPage(0).layouts.mobile;
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate from desktop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(getStoredPage(1).layouts.mobile.items.map((item) => item.row)).toEqual([0, 6]);
    expect(getStoredPage(0).layouts.mobile).toEqual(homeMobileBefore);
  });

  test('duplicates a page and deletes it only after confirmation, keeping at least one page', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Button', 85, 40);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    expect(getStoredProject().pages.map((page) => page.path)).toEqual(['/', '/home-copy']);
    expect(Object.keys(getStoredPage(1).components)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(getStoredProject().pages).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(getStoredProject().pages).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete page' }));
    expect(getStoredProject().pages.map((page) => page.path)).toEqual(['/']);
    const savedVersions = JSON.parse(window.localStorage.getItem(VERSIONS_STORAGE_KEY));
    expect(savedVersions[0].label).toBe('Before deleting page Home copy');
    expect(savedVersions[0].project.pages).toHaveLength(2);
  });

  test('restoring a version brings back every page', () => {
    const { container } = renderEditor();
    dropFromPalette(container, 'Button', 85, 40);
    addPageNamed('About', '/about');
    fireEvent.click(screen.getByRole('button', { name: 'Versions' }));
    fireEvent.change(screen.getByPlaceholderText('Version'), { target: { value: 'Two pages' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save version' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete page' }));
    expect(getStoredProject().pages).toHaveLength(1);
    fireEvent.click(screen.getByText('Two pages').closest('li').querySelector('button'));
    expect(getStoredProject().pages.map((page) => page.path)).toEqual(['/', '/about']);
    expect(Object.keys(getStoredPage(0).components)).toHaveLength(1);
  });
});

test('migrates a project saved with the single page schema', () => {
  window.localStorage.setItem(
    PROJECT_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      name: 'Legacy',
      backgroundColor: '#ffffff',
      components: { a: { id: 'a', type: 'Button', props: {}, parentId: null } },
      layouts: {
        desktop: { status: 'manuale', items: [{ id: 'a', col: 0, row: 0, width: 3, height: 3 }] },
        tablet: { status: 'auto', items: [{ id: 'a', col: 0, row: 0, width: 2, height: 3 }] },
        mobile: { status: 'auto', items: [{ id: 'a', col: 0, row: 0, width: 1, height: 3 }] },
      },
    })
  );
  const { container } = renderEditor();
  expect(container.querySelectorAll('.editor-grid-item')).toHaveLength(1);
  expect(screen.getByRole('button', { name: /^home/i })).toHaveAttribute('aria-current', 'page');
});

test('ignores data saved with the old format', () => {
  window.localStorage.setItem('yuild-builded-page', JSON.stringify([{ id: 'comp-1', component: 'Button' }]));
  window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify([{ id: 'comp-1', component: 'Button' }]));
  const { container } = renderEditor();
  expect(container.querySelectorAll('.editor-grid-item')).toHaveLength(0);
});
