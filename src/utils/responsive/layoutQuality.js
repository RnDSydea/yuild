import { CONTAINER_TYPES } from '../project/componentTypes';
import { findLayoutProblems, getChildItems, getLayoutItems } from '../project/pageModel';
import { findReadingOrderInversions } from './layoutStructure';
import { getMinimumWidth } from './minimumWidths';

export const QUALITY_ISSUES = {
  belowMinimumWidth: 'below-minimum-width',
  readingOrder: 'reading-order',
};

const getParentIds = (page) => [
  null,
  ...Object.values(page.components)
    .filter((component) => CONTAINER_TYPES.includes(component.type))
    .map((component) => component.id),
];

export const findMinimumWidthViolations = (page, breakpointId) =>
  getLayoutItems(page, breakpointId)
    .filter((item) => item.width < getMinimumWidth(page.components[item.id].type, breakpointId))
    .map((item) => ({ componentId: item.id, problem: QUALITY_ISSUES.belowMinimumWidth }));

export const findReadingOrderViolations = (page, sourceBreakpointId, targetBreakpointId) =>
  getParentIds(page).flatMap((parentId) =>
    findReadingOrderInversions(
      getChildItems(page, sourceBreakpointId, parentId),
      getChildItems(page, targetBreakpointId, parentId)
    ).map(({ earlierId, laterId }) => ({
      componentId: laterId,
      precedingComponentId: earlierId,
      problem: QUALITY_ISSUES.readingOrder,
    }))
  );

export const validateGeneratedLayout = (page, sourceBreakpointId, targetBreakpointId) => [
  ...findLayoutProblems(page, targetBreakpointId),
  ...findMinimumWidthViolations(page, targetBreakpointId),
  ...findReadingOrderViolations(page, sourceBreakpointId, targetBreakpointId),
];
