import { getLayoutItem, getLayoutItems } from '../project/pageModel';

const hasSameGeometry = (first, second) =>
  first.col === second.col && first.row === second.row && first.width === second.width && first.height === second.height;

export const findChangedComponents = (currentPage, nextPage, breakpointId) =>
  getLayoutItems(nextPage, breakpointId)
    .filter((nextItem) => {
      const currentItem = getLayoutItem(currentPage, breakpointId, nextItem.id);
      return !currentItem || !hasSameGeometry(currentItem, nextItem);
    })
    .map((item) => item.id);
