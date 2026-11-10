import { INDENT, formatJsxAttribute, toComponentName, toKebabCase } from './jsxFormatting';
import { GRID_BASE_CSS, GRID_STYLESHEET_NAME } from './layoutCss';
import { findMissingImplementations, generatePageCode } from './pageCode';

export const APP_FILE = 'src/App.js';

export const PAGES_DIRECTORY = 'pages';

const COMPONENTS_DIRECTORY_FROM_PAGES = '../components';

const PAGE_SUFFIX = 'Page';

export const assignPageComponentNames = (pages) => {
  const usedNames = new Set(['App']);
  return new Map(
    pages.map((page) => {
      const baseName = toComponentName(page.name, PAGE_SUFFIX);
      const withSuffix = baseName.endsWith(PAGE_SUFFIX) ? baseName : `${baseName}${PAGE_SUFFIX}`;
      let name = withSuffix;
      let counter = 2;
      while (usedNames.has(name)) {
        name = `${withSuffix}${counter}`;
        counter += 1;
      }
      usedNames.add(name);
      return [page.id, name];
    })
  );
};

const buildAppCode = (project, pageNames, includeStylesheet) => {
  const imports = [
    "import React from 'react';",
    "import { BrowserRouter, Route, Routes } from 'react-router-dom';",
    ...project.pages.map((page) => `import ${pageNames.get(page.id)} from './${PAGES_DIRECTORY}/${pageNames.get(page.id)}';`),
  ];
  if (includeStylesheet) {
    imports.push(`import './${GRID_STYLESHEET_NAME}';`);
  }
  const indentation = INDENT.repeat(4);
  const routes = project.pages.map(
    (page) => `${indentation}<Route ${formatJsxAttribute('path', page.path)} element={<${pageNames.get(page.id)} />} />`
  );
  routes.push(`${indentation}<Route path="*" element={<${pageNames.get(project.pages[0].id)} />} />`);
  const baseStylesheet = includeStylesheet ? [] : [`${INDENT.repeat(3)}<style>{${JSON.stringify(GRID_BASE_CSS)}}</style>`];
  return [
    ...imports,
    '',
    'const App = () => {',
    `${INDENT}return (`,
    `${INDENT.repeat(2)}<BrowserRouter>`,
    ...baseStylesheet,
    `${INDENT.repeat(3)}<Routes>`,
    ...routes,
    `${INDENT.repeat(3)}</Routes>`,
    `${INDENT.repeat(2)}</BrowserRouter>`,
    `${INDENT});`,
    '};',
    '',
    'export default App;',
    '',
  ].join('\n');
};

export const generateProjectCode = (project, options = {}) => {
  const includeStylesheet = options.includeStylesheet ?? true;
  const pageNames = assignPageComponentNames(project.pages);
  const files = { [APP_FILE]: buildAppCode(project, pageNames, includeStylesheet) };
  if (includeStylesheet) {
    files[`src/${GRID_STYLESHEET_NAME}`] = GRID_BASE_CSS;
  }
  const pageFiles = {};
  project.pages.forEach((page) => {
    const componentName = pageNames.get(page.id);
    const stylesheetFileName = includeStylesheet ? `${componentName}.css` : null;
    const { code, css } = generatePageCode(page, {
      componentName,
      classPrefix: toKebabCase(componentName),
      backgroundColor: project.backgroundColor,
      componentsDirectory: COMPONENTS_DIRECTORY_FROM_PAGES,
      stylesheetFileName,
    });
    const codePath = `src/${PAGES_DIRECTORY}/${componentName}.js`;
    files[codePath] = code;
    pageFiles[page.id] = [codePath];
    if (stylesheetFileName) {
      const stylesheetPath = `src/${PAGES_DIRECTORY}/${stylesheetFileName}`;
      files[stylesheetPath] = css;
      pageFiles[page.id].push(stylesheetPath);
    }
  });
  return {
    appName: toComponentName(project.name),
    mainFile: APP_FILE,
    files,
    pageFiles,
    missingImplementations: [...new Set(project.pages.flatMap(findMissingImplementations))],
  };
};
