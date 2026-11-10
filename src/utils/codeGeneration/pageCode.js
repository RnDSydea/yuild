import { isContainerType } from '../project/componentTypes';
import { getChildItems } from '../project/pageModel';
import { getReadingOrder } from '../responsive/layoutStructure';
import { getComponentImportName, getComponentImportPath, hasComponentImplementation } from './componentImports';
import { INDENT, formatJsxAttribute, formatStyleAttribute } from './jsxFormatting';
import { buildPageCss } from './layoutCss';

const DESIGN_BREAKPOINT = 'desktop';

const LAYOUT_PROP = 'layout';

const DESIGN_TIME_PROPS = [LAYOUT_PROP, 'value'];

const VALID_PROP_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const ALIGN_ITEMS_VALUES = { center: 'center', start: 'flex-start', end: 'flex-end', stretch: 'stretch' };

const JUSTIFY_CONTENT_VALUES = { center: 'center', start: 'flex-start', end: 'flex-end', 'space-between': 'space-between' };

const orderDirectChildren = (page, parentId) => getReadingOrder(getChildItems(page, DESIGN_BREAKPOINT, parentId));

const orderComponentIds = (page, parentId) =>
  orderDirectChildren(page, parentId).flatMap((componentId) => [componentId, ...orderComponentIds(page, componentId)]);

export const assignClassNames = (page, classPrefix) =>
  new Map(orderComponentIds(page, null).map((componentId, index) => [componentId, `${classPrefix}-c${index + 1}`]));

const formatProps = (props) =>
  Object.entries(props ?? {})
    .filter(([name, value]) => !DESIGN_TIME_PROPS.includes(name) && VALID_PROP_NAME.test(name) && value !== undefined && value !== null)
    .map(([name, value]) => formatJsxAttribute(name, value));

export const getLayoutStyle = (layout) => {
  if (!layout || !layout.display) {
    return null;
  }
  const style = { width: '100%', height: '100%', display: layout.display };
  if (layout.display === 'flex') {
    if (layout.direction) {
      style.flexDirection = layout.direction;
    }
    if (ALIGN_ITEMS_VALUES[layout['vertical-align']]) {
      style.alignItems = ALIGN_ITEMS_VALUES[layout['vertical-align']];
    }
    if (JUSTIFY_CONTENT_VALUES[layout['horizontal-align']]) {
      style.justifyContent = JUSTIFY_CONTENT_VALUES[layout['horizontal-align']];
    }
  }
  return style;
};

const formatElement = (tagName, attributes, indentation) =>
  attributes.length > 0 ? `${indentation}<${tagName} ${attributes.join(' ')} />` : `${indentation}<${tagName} />`;

const renderLeaf = (component, className, indentation) => {
  const wrapperStyle = formatStyleAttribute(getLayoutStyle(component.props?.[LAYOUT_PROP]));
  const inner = formatElement(getComponentImportName(component.type), formatProps(component.props), indentation + INDENT);
  return [`${indentation}<div className="yuild-item ${className}"${wrapperStyle}>`, inner, `${indentation}</div>`].join('\n');
};

const renderGrid = (page, parentId, classNames, gridClassName, indentation) => {
  const children = orderDirectChildren(page, parentId).map((componentId) =>
    renderComponent(page, componentId, classNames, indentation + INDENT)
  );
  if (children.length === 0) {
    return `${indentation}<div className="yuild-grid ${gridClassName}" />`;
  }
  return [`${indentation}<div className="yuild-grid ${gridClassName}">`, ...children, `${indentation}</div>`].join('\n');
};

const renderContainer = (page, component, classNames, indentation) => {
  const className = classNames.get(component.id);
  const grid = (gridIndentation) => renderGrid(page, component.id, classNames, `${className}-grid`, gridIndentation);
  if (component.type === 'Card') {
    const theme = component.props?.theme ?? 'sap';
    return [
      `${indentation}<div className="yuild-item ${className}">`,
      `${indentation + INDENT}<Card ${formatJsxAttribute('theme', theme)}>`,
      grid(indentation + INDENT + INDENT),
      `${indentation + INDENT}</Card>`,
      `${indentation}</div>`,
    ].join('\n');
  }
  return [
    `${indentation}<section className="yuild-item yuild-section ${className}">`,
    grid(indentation + INDENT),
    `${indentation}</section>`,
  ].join('\n');
};

const renderComponent = (page, componentId, classNames, indentation) => {
  const component = page.components[componentId];
  if (isContainerType(component.type)) {
    return renderContainer(page, component, classNames, indentation);
  }
  return renderLeaf(component, classNames.get(componentId), indentation);
};

export const findMissingImplementations = (page) =>
  [...new Set(Object.values(page.components).map((component) => component.type))].filter(
    (type) => !hasComponentImplementation(type) && !isContainerType(type)
  );

const buildImports = (page, componentsDirectory, stylesheetFileName) => {
  const types = [...new Set(Object.values(page.components).map((component) => component.type))]
    .filter(hasComponentImplementation)
    .sort();
  const lines = ["import React from 'react';"];
  types.forEach((type) => {
    lines.push(`import ${getComponentImportName(type)} from '${getComponentImportPath(type, componentsDirectory)}';`);
  });
  if (stylesheetFileName) {
    lines.push(`import './${stylesheetFileName}';`);
  }
  return lines.join('\n');
};

export const generatePageCode = (page, options) => {
  const { componentName, classPrefix, backgroundColor, componentsDirectory, stylesheetFileName } = options;
  const classNames = assignClassNames(page, classPrefix);
  const css = buildPageCss(page, classPrefix, classNames);
  const pageStyle = formatStyleAttribute({ backgroundColor });
  const children = orderDirectChildren(page, null).map((componentId) =>
    renderComponent(page, componentId, classNames, INDENT.repeat(3))
  );
  const inlineStylesheet = stylesheetFileName ? [] : [`${INDENT.repeat(3)}<style>{${JSON.stringify(css)}}</style>`];
  const content = [...inlineStylesheet, ...children];
  const mainClassName = `yuild-page yuild-grid ${classPrefix}`;
  const main =
    content.length > 0
      ? [`${INDENT.repeat(2)}<main className="${mainClassName}"${pageStyle}>`, ...content, `${INDENT.repeat(2)}</main>`].join('\n')
      : `${INDENT.repeat(2)}<main className="${mainClassName}"${pageStyle} />`;
  const code = [
    buildImports(page, componentsDirectory, stylesheetFileName),
    '',
    `const ${componentName} = () => {`,
    `${INDENT}return (`,
    main,
    `${INDENT});`,
    '};',
    '',
    `export default ${componentName};`,
    '',
  ].join('\n');
  return { code, css, classNames };
};
