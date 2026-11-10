import { BREAKPOINT_ORDER } from '../grid/breakpoints';
import { hasValidGeometry } from '../grid/gridGeometry';
import { LAYOUT_STATUS } from './pageModel';
import { isValidPagePath } from './pagePaths';

export const PROJECT_SCHEMA_VERSION = 2;

export const SINGLE_PAGE_SCHEMA_VERSION = 1;

export const MIGRATED_PAGE_ID = 'page-home';

const LAYOUT_STATUSES = Object.values(LAYOUT_STATUS);

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const hasValidLayout = (layout, componentIds) => {
  if (!isPlainObject(layout) || !Array.isArray(layout.items) || !LAYOUT_STATUSES.includes(layout.status)) {
    return false;
  }
  const layoutIds = layout.items.map((item) => item.id);
  const everyItemIsValid = layout.items.every(
    (item) => isPlainObject(item) && componentIds.includes(item.id) && hasValidGeometry(item)
  );
  const everyComponentIsPlaced = componentIds.every((id) => layoutIds.includes(id));
  return everyItemIsValid && everyComponentIsPlaced && new Set(layoutIds).size === layoutIds.length;
};

const hasValidComponents = (components) =>
  isPlainObject(components) &&
  Object.entries(components).every(
    ([id, component]) =>
      isPlainObject(component) &&
      component.id === id &&
      typeof component.type === 'string' &&
      isPlainObject(component.props) &&
      (component.parentId === null || Boolean(components[component.parentId]))
  );

export const hasValidPageContent = (content) => {
  if (!isPlainObject(content) || !hasValidComponents(content.components) || !isPlainObject(content.layouts)) {
    return false;
  }
  const componentIds = Object.keys(content.components);
  return BREAKPOINT_ORDER.every((breakpointId) => hasValidLayout(content.layouts[breakpointId], componentIds));
};

export const isValidPage = (page) =>
  isPlainObject(page) &&
  typeof page.id === 'string' &&
  page.id.length > 0 &&
  typeof page.name === 'string' &&
  page.name.trim().length > 0 &&
  isValidPagePath(page.path) &&
  hasValidPageContent(page);

const hasValidSettings = (project) => typeof project.name === 'string' && typeof project.backgroundColor === 'string';

export const isValidProject = (project) => {
  if (!isPlainObject(project) || project.schemaVersion !== PROJECT_SCHEMA_VERSION || !hasValidSettings(project)) {
    return false;
  }
  if (!Array.isArray(project.pages) || project.pages.length === 0 || !project.pages.every(isValidPage)) {
    return false;
  }
  const ids = project.pages.map((page) => page.id);
  const paths = project.pages.map((page) => page.path);
  return new Set(ids).size === ids.length && new Set(paths).size === paths.length;
};

export const isValidSinglePageProject = (project) =>
  isPlainObject(project) &&
  project.schemaVersion === SINGLE_PAGE_SCHEMA_VERSION &&
  hasValidSettings(project) &&
  hasValidPageContent(project);

export const migrateSinglePageProject = (project) => ({
  schemaVersion: PROJECT_SCHEMA_VERSION,
  name: project.name,
  backgroundColor: project.backgroundColor,
  pages: [
    {
      id: MIGRATED_PAGE_ID,
      name: 'Home',
      path: '/',
      components: project.components,
      layouts: project.layouts,
    },
  ],
});

export const upgradeStoredProject = (value) => {
  if (isValidProject(value)) {
    return value;
  }
  if (isValidSinglePageProject(value)) {
    return migrateSinglePageProject(value);
  }
  return null;
};
