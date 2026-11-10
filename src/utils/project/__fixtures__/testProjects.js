import { addComponent, createEmptyLayouts } from '../pageModel';
import { createEmptyProject, replacePage } from '../projectModel';
import { SINGLE_PAGE_SCHEMA_VERSION } from '../projectSchema';

export const createProjectWithButton = () => {
  const project = createEmptyProject();
  const [firstPage] = project.pages;
  const { page } = addComponent(firstPage, 'desktop', { id: 'a', type: 'Button', width: 3, height: 3 }, { col: 0, row: 0 });
  return replacePage(project, page);
};

export const createSinglePageProject = () => {
  const { page } = addComponent(
    { components: {}, layouts: createEmptyLayouts() },
    'desktop',
    { id: 'a', type: 'Button', width: 3, height: 3, props: { label: 'Saved' } },
    { col: 2, row: 1 }
  );
  return {
    schemaVersion: SINGLE_PAGE_SCHEMA_VERSION,
    name: 'Legacy',
    backgroundColor: '#fafafa',
    components: page.components,
    layouts: page.layouts,
  };
};
