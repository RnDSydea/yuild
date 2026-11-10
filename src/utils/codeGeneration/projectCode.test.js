import { fireEvent, render, screen } from '@testing-library/react';
import catalog from '../../assets/data/components.json';
import { LIBRARY_COMPONENTS } from '../../components/componentRegistry';
import { BREAKPOINTS } from '../grid/breakpoints';
import { createEmptyPage } from '../project/pageModel';
import { createEmptyProject } from '../project/projectModel';
import { FIXTURE_PAGES, buildFixturePage } from '../responsive/__fixtures__';
import { buildDesktopPage } from '../responsive/__fixtures__/fixtureBuilder';
import { generateLayoutFromDesktop } from '../responsive/reflowEngine';
import { compileGeneratedFile, loadGeneratedProject } from './__fixtures__/loadGeneratedProject';
import { formatJsxAttribute, toComponentName, toKebabCase } from './jsxFormatting';
import { assignClassNames, getLayoutStyle } from './pageCode';
import { createProjectArchive } from './projectArchive';
import { APP_FILE, assignPageComponentNames, generateProjectCode } from './projectCode';

const withGeneratedLayouts = (page) =>
  ['tablet', 'mobile'].reduce((current, breakpointId) => generateLayoutFromDesktop(current, breakpointId).page, page);

const buildPage = (settings, definitions) => ({
  ...withGeneratedLayouts(buildDesktopPage(definitions)),
  ...settings,
});

const homePage = () =>
  buildPage({ id: 'home', name: 'Home', path: '/' }, [
    { id: 'section', type: 'Section', col: 0, row: 0, width: 24, height: 16, props: { theme: 'sap' } },
    { id: 'card', type: 'Card', parentId: 'section', col: 0, row: 0, width: 12, height: 12, props: { theme: 'material' } },
    {
      id: 'save',
      type: 'Button',
      parentId: 'card',
      col: 0,
      row: 0,
      width: 4,
      height: 3,
      props: { label: 'Save "now"', theme: 'sap', disabled: false, layout: { display: 'flex', 'vertical-align': 'center', 'horizontal-align': 'end' } },
    },
    { id: 'name', type: 'Input', col: 0, row: 17, width: 12, height: 5, props: { label: 'Name', placeholder: 'Your name', required: true } },
  ]);

const aboutPage = () =>
  buildPage({ id: 'about', name: 'Chi siamo', path: '/chi-siamo' }, [
    { id: 'contact', type: 'Button', col: 0, row: 0, width: 6, height: 3, props: { label: 'Contact us' } },
    { id: 'menu', type: 'Menu', col: 12, row: 0, width: 8, height: 3, props: { items: [{ label: 'Back home', to: '/' }] } },
  ]);

const homeWithLink = () => {
  const page = homePage();
  return buildPage({ id: 'home', name: 'Home', path: '/' }, [
    ...Object.values(page.components).map((component) => ({
      ...component,
      ...page.layouts.desktop.items.find((item) => item.id === component.id),
    })),
    { id: 'about-link', type: 'Link', col: 0, row: 23, width: 4, height: 2, props: { label: 'About us', to: '/chi-siamo' } },
  ]);
};

const catalogComponents = catalog.flatMap((section) => Object.values(section).flatMap((category) => category.components));

const sampleProject = () => ({ ...createEmptyProject({ name: 'customer site' }), pages: [homePage(), aboutPage()] });

const renderGeneratedAt = (files, url) => {
  window.history.pushState({}, '', url);
  const App = loadGeneratedProject(files, LIBRARY_COMPONENTS)(APP_FILE).default;
  return render(<App />);
};

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('helpers', () => {
  test('turns names into component names and class prefixes', () => {
    expect(toComponentName('customer site')).toBe('CustomerSite');
    expect(toComponentName('2026 report')).toBe('Page2026Report');
    expect(toComponentName('  ')).toBe('YuildApp');
    expect(toKebabCase('ChiSiamoPage')).toBe('chi-siamo-page');
    expect(toKebabCase('FAQPage')).toBe('faq-page');
  });

  test('gives every page a unique component name', () => {
    const pages = [
      { id: 'a', name: 'Home' },
      { id: 'b', name: 'Home' },
      { id: 'c', name: 'Landing Page' },
      { id: 'd', name: 'App' },
      { id: 'e', name: '!!!' },
    ];
    expect([...assignPageComponentNames(pages).values()]).toEqual(['HomePage', 'HomePage2', 'LandingPage', 'AppPage', 'Page']);
  });

  test('formats JSX attributes safely', () => {
    expect(formatJsxAttribute('label', 'Save')).toBe('label="Save"');
    expect(formatJsxAttribute('label', 'Say "hi" {now}')).toBe('label={"Say \\"hi\\" {now}"}');
    expect(formatJsxAttribute('disabled', true)).toBe('disabled={true}');
    expect(formatJsxAttribute('disabled', false)).toBe('disabled={false}');
    expect(formatJsxAttribute('options', [{ value: 'a' }])).toBe('options={[{"value":"a"}]}');
  });

  test('converts the layout prop into a wrapper style', () => {
    expect(getLayoutStyle({ display: 'flex', direction: 'column', 'vertical-align': 'start', 'horizontal-align': 'space-between' })).toEqual({
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    });
    expect(getLayoutStyle(undefined)).toBeNull();
  });

  test('assigns class names following the desktop reading order, containers first', () => {
    expect([...assignClassNames(homePage(), 'home-page').entries()]).toEqual([
      ['section', 'home-page-c1'],
      ['card', 'home-page-c2'],
      ['save', 'home-page-c3'],
      ['name', 'home-page-c4'],
    ]);
  });
});

describe('generated project', () => {
  test('has an App with the routes, a shared grid stylesheet and one component and stylesheet per page', () => {
    const { files, pageFiles } = generateProjectCode(sampleProject());
    expect(Object.keys(files).sort()).toEqual([
      'src/App.js',
      'src/pages/ChiSiamoPage.css',
      'src/pages/ChiSiamoPage.js',
      'src/pages/HomePage.css',
      'src/pages/HomePage.js',
      'src/yuild-grid.css',
    ]);
    expect(pageFiles.about).toEqual(['src/pages/ChiSiamoPage.js', 'src/pages/ChiSiamoPage.css']);
    const app = files[APP_FILE];
    expect(app).toContain("import { BrowserRouter, Route, Routes } from 'react-router-dom';");
    expect(app).toContain('<Route path="/" element={<HomePage />} />');
    expect(app).toContain('<Route path="/chi-siamo" element={<ChiSiamoPage />} />');
    expect(app).toContain('<Route path="*" element={<HomePage />} />');
  });

  test('pages import the library components with paths relative to the pages folder', () => {
    const home = generateProjectCode(sampleProject()).files['src/pages/HomePage.js'];
    expect(home).toContain("import Button from '../components/button/button';");
    expect(home).toContain("import Card from '../components/card/card';");
    expect(home).toContain("import Input from '../components/input/input';");
    expect(home).toContain("import './HomePage.css';");
  });

  test('every page stylesheet is mobile first and scoped to its own classes', () => {
    const { files } = generateProjectCode(sampleProject());
    const css = files['src/pages/HomePage.css'];
    expect(css.indexOf('@media (min-width: 768px)')).toBeGreaterThan(0);
    expect(css.indexOf('@media (min-width: 768px)')).toBeLessThan(css.indexOf('@media (min-width: 1200px)'));
    const [mobile, tablet, desktop] = css.split(/@media[^{]+\{/);
    expect(mobile).toContain(`.home-page {\n  grid-template-columns: repeat(${BREAKPOINTS.mobile.columns}, minmax(0, 1fr));`);
    expect(tablet).toContain(`grid-template-columns: repeat(${BREAKPOINTS.tablet.columns}, minmax(0, 1fr));`);
    expect(desktop).toContain(`grid-template-columns: repeat(${BREAKPOINTS.desktop.columns}, minmax(0, 1fr));`);
    expect(desktop).toContain('.home-page-c4 {\n    grid-column: 1 / span 12;\n    grid-row: 18 / span 5;\n  }');
    expect(css).not.toContain('chi-siamo-page');
    expect(files['src/pages/ChiSiamoPage.css']).toContain('.chi-siamo-page-c1 {');
  });

  test('can embed the stylesheets in the components instead of separate files', () => {
    const { files } = generateProjectCode(sampleProject(), { includeStylesheet: false });
    expect(Object.keys(files).sort()).toEqual(['src/App.js', 'src/pages/ChiSiamoPage.js', 'src/pages/HomePage.js']);
    expect(files[APP_FILE]).toContain('<style>{');
    expect(files['src/pages/HomePage.js']).toContain('<style>{');
    expect(files['src/pages/HomePage.js']).not.toContain("import './HomePage.css';");
  });

  test('renders the page of the current route with the real components and nested containers', () => {
    const { files } = generateProjectCode(sampleProject());
    const { container } = renderGeneratedAt(files, '/');
    const page = container.querySelector('main.home-page');
    expect(page).toHaveStyle({ backgroundColor: '#ffffff' });
    expect(container.querySelectorAll('.yuild-item')).toHaveLength(4);
    expect(container.querySelector('.home-page-c2').closest('.home-page-c1-grid')).not.toBeNull();
    expect(container.querySelector('.home-page-c2 .material-card .home-page-c2-grid .home-page-c3')).not.toBeNull();
    expect(screen.getByText('Save "now"')).toBeInTheDocument();
    expect(container.querySelector('.home-page-c3')).toHaveStyle({ display: 'flex', justifyContent: 'flex-end' });
    expect(container.querySelector('input[placeholder="Your name"]')).not.toBeNull();
    expect(screen.queryByText('Contact us')).toBeNull();
  });

  test('renders the other page on its own path and falls back to the first page on unknown paths', () => {
    const { files } = generateProjectCode(sampleProject());
    const { container, unmount } = renderGeneratedAt(files, '/chi-siamo');
    expect(container.querySelector('main.chi-siamo-page')).not.toBeNull();
    expect(screen.getByText('Contact us')).toBeInTheDocument();
    unmount();
    const fallback = renderGeneratedAt(files, '/missing');
    expect(fallback.container.querySelector('main.home-page')).not.toBeNull();
  });

  test('navigates between the pages through the generated links and menus', () => {
    const project = { ...createEmptyProject({ name: 'customer site' }), pages: [homeWithLink(), aboutPage()] };
    const { files } = generateProjectCode(project);
    const { container } = renderGeneratedAt(files, '/');
    expect(container.querySelector('main.home-page')).not.toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'About us' }));
    expect(container.querySelector('main.chi-siamo-page')).not.toBeNull();
    expect(window.location.pathname).toBe('/chi-siamo');
    expect(screen.getByText('Contact us')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Back home' }));
    expect(container.querySelector('main.home-page')).not.toBeNull();
    expect(window.location.pathname).toBe('/');
  });

  test('exports every catalog component with its real implementation and no placeholder', () => {
    let row = 0;
    const definitions = catalogComponents.map((component, index) => {
      const definition = {
        id: `component-${index}`,
        type: component.nome,
        col: 0,
        row,
        width: component.lunghezza,
        height: component.altezza,
        props: component.props,
      };
      row += component.altezza + 1;
      return definition;
    });
    const page = buildPage({ id: 'catalog', name: 'Catalog', path: '/' }, definitions);
    const { files, missingImplementations } = generateProjectCode({ ...createEmptyProject(), pages: [page] });
    const code = files['src/pages/CatalogPage.js'];
    expect(missingImplementations).toEqual([]);
    expect(code).not.toContain('yuild-placeholder');
    expect(code).not.toContain('data-component');
    expect(code).not.toMatch(/\svalue=/);
    ['DialogTrigger', 'DrawerTrigger', 'AlertTrigger', 'Avatar', 'Chip', 'Divider', 'Accordion', 'Breadcrumbs', 'Link', 'Menu', 'Tabs', 'Table'].forEach(
      (importName) => expect(code).toMatch(new RegExp(`^import ${importName} from '\\.\\./components/`, 'm'))
    );
    const { container } = renderGeneratedAt(files, '/');
    expect(container.querySelectorAll('.yuild-item')).toHaveLength(catalogComponents.length);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accordion title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dialog' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('an empty project produces a valid application', () => {
    const { files } = generateProjectCode({ ...createEmptyProject({ name: '' }), pages: [createEmptyPage()] });
    const { container } = renderGeneratedAt(files, '/');
    expect(container.querySelector('main.yuild-page')).not.toBeNull();
  });

  test.each(FIXTURE_PAGES)('produces compilable code and a complete stylesheet for the $name', (fixture) => {
    const page = withGeneratedLayouts(buildFixturePage(fixture));
    const { files } = generateProjectCode({ ...createEmptyProject(), pages: [page] });
    Object.entries(files)
      .filter(([file]) => file.endsWith('.js'))
      .forEach(([file, code]) => expect(() => compileGeneratedFile(code, file)).not.toThrow());
    const css = files['src/pages/HomePage.css'];
    assignClassNames(page, 'home-page').forEach((className) => {
      expect(css.split(`.${className} {`)).toHaveLength(4);
    });
  });

  test('creates an archive with every generated file and the instructions', () => {
    const generated = generateProjectCode(sampleProject());
    const archive = createProjectArchive(generated);
    const archivedFiles = Object.keys(archive.files).filter((name) => !name.endsWith('/'));
    expect(archivedFiles.sort()).toEqual(['README.md', ...Object.keys(generated.files)].sort());
  });
});
