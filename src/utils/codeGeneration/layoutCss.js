import { BREAKPOINTS, BREAKPOINT_ORDER, ROW_HEIGHT } from '../grid/breakpoints';
import { isContainerType } from '../project/componentTypes';
import { getLayoutItem } from '../project/pageModel';

export const GRID_STYLESHEET_NAME = 'yuild-grid.css';

export const getMobileFirstBreakpoints = () =>
  [...BREAKPOINT_ORDER].sort(
    (first, second) => BREAKPOINTS[first].minViewportWidth - BREAKPOINTS[second].minViewportWidth
  );

const columnsTemplate = (columns) => `repeat(${columns}, minmax(0, 1fr))`;

const ruleBlock = (selector, declarations, indentation) => {
  const lines = Object.entries(declarations).map(([property, value]) => `${indentation}  ${property}: ${value};`);
  return [`${indentation}${selector} {`, ...lines, `${indentation}}`].join('\n');
};

const buildBreakpointRules = (page, breakpointId, pageClassName, classNames, indentation) => {
  const rules = [
    ruleBlock(`.${pageClassName}`, { 'grid-template-columns': columnsTemplate(BREAKPOINTS[breakpointId].columns) }, indentation),
  ];
  classNames.forEach((className, componentId) => {
    const item = getLayoutItem(page, breakpointId, componentId);
    rules.push(
      ruleBlock(
        `.${className}`,
        {
          'grid-column': `${item.col + 1} / span ${item.width}`,
          'grid-row': `${item.row + 1} / span ${item.height}`,
        },
        indentation
      )
    );
    if (isContainerType(page.components[componentId].type)) {
      rules.push(ruleBlock(`.${className}-grid`, { 'grid-template-columns': columnsTemplate(item.width) }, indentation));
    }
  });
  return rules.join('\n');
};

export const GRID_BASE_CSS = `.yuild-grid {
  display: grid;
  grid-auto-rows: ${ROW_HEIGHT}px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.yuild-page {
  min-height: 100vh;
}
.yuild-item {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.yuild-item > .sap-card,
.yuild-item > .material-card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.yuild-section {
  display: block;
}
`;

export const buildPageCss = (page, pageClassName, classNames) => {
  const blocks = getMobileFirstBreakpoints().map((breakpointId) => {
    const minWidth = BREAKPOINTS[breakpointId].minViewportWidth;
    if (minWidth === 0) {
      return buildBreakpointRules(page, breakpointId, pageClassName, classNames, '');
    }
    return [
      `@media (min-width: ${minWidth}px) {`,
      buildBreakpointRules(page, breakpointId, pageClassName, classNames, '  '),
      '}',
    ].join('\n');
  });
  return `${blocks.join('\n\n')}\n`;
};
