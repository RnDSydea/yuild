import { addPage, createEmptyProject } from './projectModel';
import { MIGRATED_PAGE_ID } from './projectSchema';
import { createProjectWithButton, createSinglePageProject } from './__fixtures__/testProjects';
import {
  DEFAULT_VERSION_LABEL,
  MAX_VERSIONS,
  VERSIONS_STORAGE_KEY,
  createVersion,
  findVersion,
  getRestoredProject,
  loadVersions,
  parseStoredVersions,
  saveVersions,
} from './projectVersions';

const createMemoryStorage = (maxLength = Infinity) => {
  const values = {};
  return {
    values,
    getItem: (key) => (key in values ? values[key] : null),
    setItem: (key, value) => {
      if (String(value).length > maxLength) {
        throw new Error('quota exceeded');
      }
      values[key] = String(value);
    },
  };
};

const projectWithButton = createProjectWithButton;

describe('project versions', () => {
  test('creates a snapshot that later changes do not affect', () => {
    const project = projectWithButton();
    const versions = createVersion([], project, '  First  ', 1000);
    project.pages[0].components.a.props.label = 'changed';
    expect(versions[0].label).toBe('First');
    expect(versions[0].createdAt).toBe(1000);
    expect(versions[0].project.pages[0].components.a.props.label).toBeUndefined();
  });

  test('uses a default label and keeps the newest versions first', () => {
    const first = createVersion([], createEmptyProject(), '', 1);
    const second = createVersion(first, projectWithButton(), 'Second', 2);
    expect(second.map((version) => version.label)).toEqual(['Second', DEFAULT_VERSION_LABEL]);
  });

  test('keeps at most the configured number of versions', () => {
    let versions = [];
    for (let index = 0; index < MAX_VERSIONS + 5; index++) {
      versions = createVersion(versions, createEmptyProject(), `v${index}`, index);
    }
    expect(versions).toHaveLength(MAX_VERSIONS);
    expect(versions[0].label).toBe(`v${MAX_VERSIONS + 4}`);
  });

  test('restores an independent copy of the saved project', () => {
    const versions = createVersion([], projectWithButton(), 'Saved', 1);
    const restored = getRestoredProject(findVersion(versions, versions[0].id));
    restored.pages[0].components.a.props.label = 'edited';
    expect(versions[0].project.pages[0].components.a.props.label).toBeUndefined();
    expect(findVersion(versions, 'missing')).toBeNull();
  });

  test('persists versions and drops entries with an invalid project', () => {
    const storage = createMemoryStorage();
    const versions = createVersion([], projectWithButton(), 'Saved', 1);
    saveVersions(versions, storage);
    expect(loadVersions(storage)).toEqual(versions);
    const withLegacy = [...versions, { id: 'old', label: 'Old', createdAt: 0, project: [{ component: 'Button' }] }];
    expect(parseStoredVersions(JSON.stringify(withLegacy))).toEqual(versions);
    expect(parseStoredVersions('{broken')).toEqual([]);
  });

  test('saves and restores every page of the project', () => {
    const withTwoPages = addPage(projectWithButton(), { name: 'About', path: '/about' }).project;
    const versions = createVersion([], withTwoPages, 'Two pages', 1);
    const restored = getRestoredProject(versions[0]);
    expect(restored.pages.map((page) => page.path)).toEqual(['/', '/about']);
    expect(restored).toEqual(withTwoPages);
  });

  test('migrates versions saved with the single page schema', () => {
    const legacy = { id: 'legacy', label: 'Legacy', createdAt: 5, project: createSinglePageProject() };
    const [migrated] = parseStoredVersions(JSON.stringify([legacy]));
    expect(migrated.label).toBe('Legacy');
    expect(migrated.project.pages.map((page) => page.id)).toEqual([MIGRATED_PAGE_ID]);
  });

  test('drops the oldest versions when storage is full', () => {
    let versions = [];
    for (let index = 0; index < 5; index++) {
      versions = createVersion(versions, projectWithButton(), `v${index}`, index);
    }
    const singleVersionLength = JSON.stringify(versions.slice(0, 2)).length;
    const storage = createMemoryStorage(singleVersionLength);
    const saved = saveVersions(versions, storage);
    expect(saved.map((version) => version.label)).toEqual(['v4', 'v3']);
    expect(JSON.parse(storage.values[VERSIONS_STORAGE_KEY])).toHaveLength(2);
  });
});
