import { createEmptyProject } from './projectModel';
import { MIGRATED_PAGE_ID, PROJECT_SCHEMA_VERSION } from './projectSchema';
import { PROJECT_STORAGE_KEY, loadProject, parseStoredProject, saveProject } from './projectStorage';
import { createProjectWithButton, createSinglePageProject } from './__fixtures__/testProjects';

const createMemoryStorage = (initialValues = {}) => {
  const values = { ...initialValues };
  return {
    getItem: (key) => (key in values ? values[key] : null),
    setItem: (key, value) => {
      values[key] = String(value);
    },
  };
};

describe('project storage', () => {
  test('saves and loads a project with the current schema', () => {
    const storage = createMemoryStorage();
    const project = createProjectWithButton();
    expect(saveProject(project, storage)).toBe(true);
    expect(loadProject(storage)).toEqual(project);
  });

  test('migrates a project saved with the single page schema into the first page', () => {
    const legacy = createSinglePageProject();
    const loaded = loadProject(createMemoryStorage({ [PROJECT_STORAGE_KEY]: JSON.stringify(legacy) }));
    expect(loaded.schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
    expect(loaded.name).toBe('Legacy');
    expect(loaded.backgroundColor).toBe('#fafafa');
    expect(loaded.pages).toEqual([
      { id: MIGRATED_PAGE_ID, name: 'Home', path: '/', components: legacy.components, layouts: legacy.layouts },
    ]);
  });

  test('ignores projects without schema version or with an unknown one', () => {
    const legacyPatchList = JSON.stringify([{ id: 'comp-1', component: 'Button', top: 0, left: 0 }]);
    expect(loadProject(createMemoryStorage({ [PROJECT_STORAGE_KEY]: legacyPatchList }))).toBeNull();
    const olderSchema = JSON.stringify({ ...createSinglePageProject(), schemaVersion: 0 });
    expect(loadProject(createMemoryStorage({ [PROJECT_STORAGE_KEY]: olderSchema }))).toBeNull();
    const futureSchema = JSON.stringify({ ...createEmptyProject(), schemaVersion: PROJECT_SCHEMA_VERSION + 1 });
    expect(parseStoredProject(futureSchema)).toBeNull();
    const missingSchema = { ...createEmptyProject() };
    delete missingSchema.schemaVersion;
    expect(parseStoredProject(JSON.stringify(missingSchema))).toBeNull();
  });

  test('ignores corrupted or inconsistent data without throwing', () => {
    expect(parseStoredProject('{not json')).toBeNull();
    expect(parseStoredProject('')).toBeNull();
    const orphan = createEmptyProject();
    orphan.pages[0].components.orphan = { id: 'orphan', type: 'Button', props: {}, parentId: null };
    expect(parseStoredProject(JSON.stringify(orphan))).toBeNull();
    const noPages = { ...createEmptyProject(), pages: [] };
    expect(parseStoredProject(JSON.stringify(noPages))).toBeNull();
    const project = createEmptyProject();
    const duplicatePaths = { ...project, pages: [project.pages[0], { ...project.pages[0], id: 'other' }] };
    expect(parseStoredProject(JSON.stringify(duplicatePaths))).toBeNull();
  });

  test('reports a failed save instead of throwing', () => {
    const failingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(saveProject(createEmptyProject(), failingStorage)).toBe(false);
    expect(loadProject({ getItem: () => { throw new Error('denied'); } })).toBeNull();
  });
});
