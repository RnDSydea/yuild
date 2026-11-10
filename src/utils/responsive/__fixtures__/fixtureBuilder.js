import { addComponent, createEmptyPage } from '../../project/pageModel';

export const buildDesktopPage = (definitions) =>
  definitions.reduce((page, definition) => {
    const result = addComponent(
      page,
      'desktop',
      { id: definition.id, type: definition.type, width: definition.width, height: definition.height, props: definition.props ?? {} },
      { parentId: definition.parentId ?? null, col: definition.col, row: definition.row }
    );
    if (result.error) {
      throw new Error(`Fixture component ${definition.id}: ${result.error} ${result.breakpointId ?? ''}`.trim());
    }
    return result.page;
  }, createEmptyPage());
