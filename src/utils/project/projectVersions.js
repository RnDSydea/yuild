import { upgradeStoredProject } from './projectSchema';

export const VERSIONS_STORAGE_KEY = 'yuild-project-versions';

export const MAX_VERSIONS = 30;

export const DEFAULT_VERSION_LABEL = 'Version';

const cloneProject = (project) => JSON.parse(JSON.stringify(project));

const createVersionId = (createdAt) => `version-${createdAt.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createVersion = (versions, project, label, createdAt = Date.now()) => {
  const version = {
    id: createVersionId(createdAt),
    label: (label ?? '').trim() || DEFAULT_VERSION_LABEL,
    createdAt,
    project: cloneProject(project),
  };
  return [version, ...versions].slice(0, MAX_VERSIONS);
};

export const findVersion = (versions, versionId) => versions.find((version) => version.id === versionId) ?? null;

export const getRestoredProject = (version) => cloneProject(version.project);

const hasVersionMetadata = (version) =>
  version !== null &&
  typeof version === 'object' &&
  typeof version.id === 'string' &&
  typeof version.label === 'string' &&
  Number.isFinite(version.createdAt);

const upgradeVersion = (version) => {
  if (!hasVersionMetadata(version)) {
    return null;
  }
  const project = upgradeStoredProject(version.project);
  return project ? { ...version, project } : null;
};

export const parseStoredVersions = (rawValue) => {
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.map(upgradeVersion).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
};

const getDefaultStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

export const loadVersions = (storage = getDefaultStorage()) => {
  try {
    return storage ? parseStoredVersions(storage.getItem(VERSIONS_STORAGE_KEY)) : [];
  } catch (error) {
    return [];
  }
};

export const saveVersions = (versions, storage = getDefaultStorage()) => {
  let versionsToSave = versions;
  while (versionsToSave.length > 0) {
    try {
      storage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(versionsToSave));
      return versionsToSave;
    } catch (error) {
      versionsToSave = versionsToSave.slice(0, -1);
    }
  }
  try {
    storage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    return [];
  }
  return [];
};
