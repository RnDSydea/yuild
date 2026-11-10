import { upgradeStoredProject } from './projectSchema';

export const PROJECT_STORAGE_KEY = 'yuild-project';

export const parseStoredProject = (rawValue) => {
  if (!rawValue) {
    return null;
  }
  try {
    return upgradeStoredProject(JSON.parse(rawValue));
  } catch (error) {
    return null;
  }
};

const getDefaultStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

export const loadProject = (storage = getDefaultStorage()) => {
  try {
    return storage ? parseStoredProject(storage.getItem(PROJECT_STORAGE_KEY)) : null;
  } catch (error) {
    return null;
  }
};

export const saveProject = (project, storage = getDefaultStorage()) => {
  try {
    storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch (error) {
    return false;
  }
};
