export const PAGE_PATH_ERRORS = {
  invalidPath: 'invalid-path',
  duplicatePath: 'duplicate-path',
};

const VALID_PAGE_PATH = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;

export const isValidPagePath = (path) => typeof path === 'string' && VALID_PAGE_PATH.test(path);

export const slugify = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizePagePath = (rawPath) => {
  const segments = String(rawPath ?? '')
    .split('/')
    .map(slugify)
    .filter(Boolean);
  return `/${segments.join('/')}`;
};

export const createUniquePagePath = (basePath, existingPaths) => {
  const normalizedBase = normalizePagePath(basePath);
  if (!existingPaths.includes(normalizedBase)) {
    return normalizedBase;
  }
  const prefix = normalizedBase === '/' ? '/page' : normalizedBase;
  let suffix = 2;
  while (existingPaths.includes(`${prefix}-${suffix}`)) {
    suffix += 1;
  }
  return `${prefix}-${suffix}`;
};
