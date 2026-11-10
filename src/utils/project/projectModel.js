import { clearPageContent, createEmptyPage, createPageId } from './pageModel';
import { PAGE_PATH_ERRORS, createUniquePagePath, isValidPagePath, normalizePagePath } from './pagePaths';
import { PROJECT_SCHEMA_VERSION } from './projectSchema';

export const DEFAULT_PROJECT_NAME = 'MyYUildApp';

export const DEFAULT_BACKGROUND_COLOR = '#ffffff';

export const PAGE_ERRORS = {
  ...PAGE_PATH_ERRORS,
  invalidName: 'invalid-name',
  notFound: 'page-not-found',
  lastPage: 'last-page',
};

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

export const createEmptyProject = (settings = {}) => ({
  schemaVersion: PROJECT_SCHEMA_VERSION,
  name: settings.name ?? DEFAULT_PROJECT_NAME,
  backgroundColor: settings.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
  pages: [createEmptyPage()],
});

export const updateProjectSettings = (project, settings) => ({
  ...project,
  name: settings.name ?? project.name,
  backgroundColor: settings.backgroundColor ?? project.backgroundColor,
});

export const getPage = (project, pageId) => project.pages.find((page) => page.id === pageId) ?? null;

export const getPagePaths = (project, excludedPageId) =>
  project.pages.filter((page) => page.id !== excludedPageId).map((page) => page.path);

export const replacePage = (project, nextPage) => ({
  ...project,
  pages: project.pages.map((page) => (page.id === nextPage.id ? nextPage : page)),
});

const failure = (project, error) => ({ project, error, pageId: null });

const getNameError = (name) => (typeof name === 'string' && name.trim().length > 0 ? null : PAGE_ERRORS.invalidName);

const getPathError = (project, path, pageId) => {
  if (!isValidPagePath(path)) {
    return PAGE_ERRORS.invalidPath;
  }
  return getPagePaths(project, pageId).includes(path) ? PAGE_ERRORS.duplicatePath : null;
};

export const addPage = (project, settings = {}) => {
  const name = (settings.name ?? `Page ${project.pages.length + 1}`).trim();
  const nameError = getNameError(name);
  if (nameError) {
    return failure(project, nameError);
  }
  const path = settings.path === undefined ? createUniquePagePath(name, getPagePaths(project)) : settings.path;
  const pathError = getPathError(project, path);
  if (pathError) {
    return failure(project, pathError);
  }
  const page = createEmptyPage({ name, path });
  return { project: { ...project, pages: [...project.pages, page] }, error: null, pageId: page.id };
};

export const renamePage = (project, pageId, name) => {
  const page = getPage(project, pageId);
  if (!page) {
    return failure(project, PAGE_ERRORS.notFound);
  }
  const nameError = getNameError(name);
  if (nameError) {
    return failure(project, nameError);
  }
  return { project: replacePage(project, { ...page, name: name.trim() }), error: null, pageId };
};

export const changePagePath = (project, pageId, path) => {
  const page = getPage(project, pageId);
  if (!page) {
    return failure(project, PAGE_ERRORS.notFound);
  }
  const pathError = getPathError(project, path, pageId);
  if (pathError) {
    return failure(project, pathError);
  }
  return { project: replacePage(project, { ...page, path }), error: null, pageId };
};

export const duplicatePage = (project, pageId) => {
  const page = getPage(project, pageId);
  if (!page) {
    return failure(project, PAGE_ERRORS.notFound);
  }
  const name = `${page.name} copy`;
  const path = createUniquePagePath(page.path === '/' ? name : `${page.path}-copy`, getPagePaths(project));
  const copy = { ...cloneValue(page), id: createPageId(), name, path };
  const index = project.pages.findIndex((candidate) => candidate.id === pageId);
  const pages = [...project.pages.slice(0, index + 1), copy, ...project.pages.slice(index + 1)];
  return { project: { ...project, pages }, error: null, pageId: copy.id };
};

export const removePage = (project, pageId) => {
  if (!getPage(project, pageId)) {
    return failure(project, PAGE_ERRORS.notFound);
  }
  if (project.pages.length === 1) {
    return failure(project, PAGE_ERRORS.lastPage);
  }
  const index = project.pages.findIndex((page) => page.id === pageId);
  const pages = project.pages.filter((page) => page.id !== pageId);
  return { project: { ...project, pages }, error: null, pageId: pages[Math.max(0, index - 1)].id };
};

export const clearPage = (project, pageId) => {
  const page = getPage(project, pageId);
  return page ? replacePage(project, clearPageContent(page)) : project;
};

export { normalizePagePath };
