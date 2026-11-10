import path from 'path';
import { transformSync } from '@babel/core';
import { COMPONENT_MODULES } from '../componentImports';

const COMPONENTS_PREFIX = 'src/components/';

export const compileGeneratedFile = (code, filename) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    filename,
    presets: [[require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]],
  }).code;

export const loadGeneratedProject = (files, libraryComponents) => {
  const cache = new Map();
  const findLibraryComponent = (componentPath) => {
    const entry = Object.entries(COMPONENT_MODULES).find(([, module]) => module.path === componentPath);
    if (!entry || !libraryComponents[entry[0]]) {
      throw new Error(`Unknown library component ${componentPath}`);
    }
    return { __esModule: true, default: libraryComponents[entry[0]] };
  };
  const load = (file) => {
    if (cache.has(file)) {
      return cache.get(file).exports;
    }
    const generatedModule = { exports: {} };
    cache.set(file, generatedModule);
    const requireFromFile = (request) => {
      if (!request.startsWith('.')) {
        return require(request);
      }
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), request));
      if (resolved.endsWith('.css')) {
        if (!files[resolved]) {
          throw new Error(`Missing stylesheet ${resolved}`);
        }
        return {};
      }
      if (resolved.startsWith(COMPONENTS_PREFIX)) {
        return findLibraryComponent(resolved.slice(COMPONENTS_PREFIX.length));
      }
      if (!files[`${resolved}.js`]) {
        throw new Error(`Missing generated file ${resolved}.js`);
      }
      return load(`${resolved}.js`);
    };
    new Function('require', 'module', 'exports', compileGeneratedFile(files[file], file))(
      requireFromFile,
      generatedModule,
      generatedModule.exports
    );
    return generatedModule.exports;
  };
  return load;
};
