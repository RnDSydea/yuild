export const groupIntoBands = (items) => {
  const sortedItems = [...items].sort((first, second) => first.row - second.row || first.col - second.col);
  const bands = [];
  sortedItems.forEach((item) => {
    const currentBand = bands[bands.length - 1];
    if (currentBand && item.row < currentBand.bottom) {
      currentBand.items.push(item);
      currentBand.bottom = Math.max(currentBand.bottom, item.row + item.height);
      return;
    }
    bands.push({ top: item.row, bottom: item.row + item.height, items: [item] });
  });
  return bands;
};

export const sortBandInReadingOrder = (bandItems) =>
  [...bandItems].sort((first, second) => first.col - second.col || first.row - second.row);

export const getReadingOrder = (items) =>
  groupIntoBands(items).flatMap((band) => sortBandInReadingOrder(band.items).map((item) => item.id));

const isFullyAbove = (upper, lower) => upper.row + upper.height <= lower.row;

const sharesRows = (first, second) =>
  first.row < second.row + second.height && second.row < first.row + first.height;

const isFullyLeft = (left, right) => left.col + left.width <= right.col;

export const comesBefore = (first, second) =>
  isFullyAbove(first, second) || (sharesRows(first, second) && isFullyLeft(first, second));

export const findReadingOrderInversions = (sourceItems, targetItems) => {
  const targetById = new Map(targetItems.map((item) => [item.id, item]));
  const sourceOrder = getReadingOrder(sourceItems);
  const inversions = [];
  sourceOrder.forEach((earlierId, earlierIndex) => {
    sourceOrder.slice(earlierIndex + 1).forEach((laterId) => {
      const earlier = targetById.get(earlierId);
      const later = targetById.get(laterId);
      if (earlier && later && comesBefore(later, earlier)) {
        inversions.push({ earlierId, laterId });
      }
    });
  });
  return inversions;
};
