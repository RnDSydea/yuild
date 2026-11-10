import { addComponent } from './pageModel';
import {
  PAGE_ERRORS,
  addPage,
  changePagePath,
  clearPage,
  createEmptyProject,
  duplicatePage,
  getPage,
  removePage,
  renamePage,
  replacePage,
  updateProjectSettings,
} from './projectModel';
import { isValidProject } from './projectSchema';
import { createProjectWithButton } from './__fixtures__/testProjects';

const expectValid = (project) => expect(isValidProject(project)).toBe(true);

describe('createEmptyProject', () => {
  test('starts with one home page on the root path', () => {
    const project = createEmptyProject();
    expectValid(project);
    expect(project.pages).toHaveLength(1);
    expect(project.pages[0]).toMatchObject({ name: 'Home', path: '/' });
  });

  test('updates the shared settings', () => {
    const project = updateProjectSettings(createEmptyProject(), { name: 'Shop', backgroundColor: '#000000' });
    expect(project).toMatchObject({ name: 'Shop', backgroundColor: '#000000' });
  });
});

describe('addPage', () => {
  test('adds an empty page with a path derived from the name', () => {
    const { project, pageId, error } = addPage(createEmptyProject(), { name: 'Chi siamo' });
    expect(error).toBeNull();
    expect(getPage(project, pageId)).toMatchObject({ name: 'Chi siamo', path: '/chi-siamo', components: {} });
    expectValid(project);
  });

  test('uses a default name and a unique path', () => {
    let project = createEmptyProject();
    project = addPage(project).project;
    project = addPage(project, { name: 'Page 2' }).project;
    expect(project.pages.map((page) => [page.name, page.path])).toEqual([
      ['Home', '/'],
      ['Page 2', '/page-2'],
      ['Page 2', '/page-2-2'],
    ]);
    expectValid(project);
  });

  test('rejects empty names, invalid or duplicate paths', () => {
    const project = createEmptyProject();
    expect(addPage(project, { name: '   ' }).error).toBe(PAGE_ERRORS.invalidName);
    expect(addPage(project, { name: 'About', path: 'about' }).error).toBe(PAGE_ERRORS.invalidPath);
    expect(addPage(project, { name: 'About', path: '/' }).error).toBe(PAGE_ERRORS.duplicatePath);
    expect(addPage(project, { name: 'About', path: '/' }).project).toBe(project);
  });
});

describe('renamePage and changePagePath', () => {
  test('rename keeps the path', () => {
    const project = createEmptyProject();
    const pageId = project.pages[0].id;
    const result = renamePage(project, pageId, '  Start  ');
    expect(getPage(result.project, pageId)).toMatchObject({ name: 'Start', path: '/' });
    expect(renamePage(project, pageId, '').error).toBe(PAGE_ERRORS.invalidName);
    expect(renamePage(project, 'missing', 'X').error).toBe(PAGE_ERRORS.notFound);
  });

  test('a page can keep its own path but not take another page path', () => {
    const { project, pageId } = addPage(createEmptyProject(), { name: 'About', path: '/about' });
    expect(changePagePath(project, pageId, '/about').error).toBeNull();
    expect(changePagePath(project, pageId, '/').error).toBe(PAGE_ERRORS.duplicatePath);
    expect(changePagePath(project, pageId, '/About Us').error).toBe(PAGE_ERRORS.invalidPath);
    const moved = changePagePath(project, pageId, '/company/about').project;
    expect(getPage(moved, pageId).path).toBe('/company/about');
    expectValid(moved);
  });
});

describe('duplicatePage', () => {
  test('copies components and layouts into an independent page right after the original', () => {
    let project = createProjectWithButton();
    project = addPage(project, { name: 'Contact', path: '/contact' }).project;
    const original = project.pages[0];
    const { project: duplicated, pageId } = duplicatePage(project, original.id);
    expect(duplicated.pages.map((page) => page.path)).toEqual(['/', '/home-copy', '/contact']);
    const copy = getPage(duplicated, pageId);
    expect(copy.name).toBe('Home copy');
    expect(copy.components).toEqual(original.components);
    expect(copy.layouts).toEqual(original.layouts);
    copy.components.a.props.label = 'changed';
    expect(original.components.a.props.label).toBeUndefined();
    expectValid(duplicated);
  });

  test('duplicating twice keeps paths unique', () => {
    const { project, pageId } = addPage(createEmptyProject(), { name: 'About', path: '/about' });
    const once = duplicatePage(project, pageId).project;
    const twice = duplicatePage(once, pageId).project;
    expect(twice.pages.map((page) => page.path)).toEqual(['/', '/about', '/about-copy-2', '/about-copy']);
    expectValid(twice);
  });
});

describe('removePage and clearPage', () => {
  test('always keeps at least one page', () => {
    const project = createEmptyProject();
    const result = removePage(project, project.pages[0].id);
    expect(result.error).toBe(PAGE_ERRORS.lastPage);
    expect(result.project).toBe(project);
  });

  test('removes a page and suggests the previous one as active', () => {
    let project = createEmptyProject();
    project = addPage(project, { name: 'About', path: '/about' }).project;
    project = addPage(project, { name: 'Contact', path: '/contact' }).project;
    const result = removePage(project, project.pages[2].id);
    expect(result.project.pages.map((page) => page.path)).toEqual(['/', '/about']);
    expect(result.pageId).toBe(project.pages[1].id);
    expect(removePage(project, project.pages[0].id).pageId).toBe(project.pages[1].id);
  });

  test('clearing empties only the given page', () => {
    let project = createProjectWithButton();
    const { project: withAbout, pageId } = addPage(project, { name: 'About', path: '/about' });
    const about = getPage(withAbout, pageId);
    const filledAbout = addComponent(about, 'desktop', { id: 'b', type: 'Button', width: 3, height: 3 }, { col: 0, row: 0 }).page;
    project = replacePage(withAbout, filledAbout);
    const cleared = clearPage(project, pageId);
    expect(getPage(cleared, pageId)).toMatchObject({ name: 'About', path: '/about', components: {} });
    expect(Object.keys(cleared.pages[0].components)).toEqual(['a']);
    expectValid(cleared);
  });
});
