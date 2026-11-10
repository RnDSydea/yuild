import { createUniquePagePath, isValidPagePath, normalizePagePath, slugify } from './pagePaths';

describe('page paths', () => {
  test('accepts the root and lowercase segments separated by hyphens', () => {
    ['/', '/chi-siamo', '/blog/2026', '/a1/b-2'].forEach((path) => expect(isValidPagePath(path)).toBe(true));
  });

  test('rejects malformed paths', () => {
    ['', 'chi-siamo', '/Chi-Siamo', '/chi siamo', '/chi-siamo/', '//', '/-a', '/a--b', '/à', null].forEach((path) =>
      expect(isValidPagePath(path)).toBe(false)
    );
  });

  test('normalizes free text into a valid path', () => {
    expect(slugify('Chi siamo?')).toBe('chi-siamo');
    expect(normalizePagePath('Chi Siamo')).toBe('/chi-siamo');
    expect(normalizePagePath('/Prodotti/Novità 2026/')).toBe('/prodotti/novita-2026');
    expect(normalizePagePath('')).toBe('/');
  });

  test('creates a path that is not used yet', () => {
    expect(createUniquePagePath('About', ['/'])).toBe('/about');
    expect(createUniquePagePath('About', ['/', '/about', '/about-2'])).toBe('/about-3');
    expect(createUniquePagePath('/', ['/'])).toBe('/page-2');
  });
});
