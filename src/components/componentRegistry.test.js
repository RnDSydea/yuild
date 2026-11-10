import catalog from '../assets/data/components.json';
import { BREAKPOINT_ORDER } from '../utils/grid/breakpoints';
import { COMPONENT_MODULES } from '../utils/codeGeneration/componentImports';
import { isContainerType } from '../utils/project/componentTypes';
import { MINIMUM_WIDTHS } from '../utils/responsive/minimumWidths';
import { LIBRARY_COMPONENTS } from './componentRegistry';

const catalogComponents = catalog.flatMap((section) => Object.values(section).flatMap((category) => category.components));

describe.each(catalogComponents.map((component) => [component.nome, component]))('%s', (type, component) => {
  test('has an implementation in the editor and in the generated code unless it is a section', () => {
    if (type === 'Section') {
      expect(isContainerType(type)).toBe(true);
      return;
    }
    expect(LIBRARY_COMPONENTS[type]).toBeDefined();
    expect(COMPONENT_MODULES[type]).toBeDefined();
  });

  test('has its own minimum width for every breakpoint', () => {
    BREAKPOINT_ORDER.forEach((breakpointId) => {
      expect(MINIMUM_WIDTHS[type][breakpointId]).toBeGreaterThan(0);
    });
  });

  test('has default props and a default size inside the desktop grid', () => {
    expect(component.props).toBeDefined();
    expect(component.lunghezza).toBeGreaterThan(0);
    expect(component.lunghezza).toBeLessThanOrEqual(24);
    expect(component.altezza).toBeGreaterThan(0);
  });
});
