export const COMPONENT_MODULES = {
  Accordion: { importName: 'Accordion', path: 'accordion/accordion' },
  Alert: { importName: 'AlertTrigger', path: 'alertTrigger/alertTrigger' },
  Avatar: { importName: 'Avatar', path: 'avatar/avatar' },
  Breadcrumbs: { importName: 'Breadcrumbs', path: 'breadcrumbs/breadcrumbs' },
  Button: { importName: 'Button', path: 'button/button' },
  Card: { importName: 'Card', path: 'card/card' },
  Checkbox: { importName: 'Checkbox', path: 'checkbox/checkbox' },
  Chip: { importName: 'Chip', path: 'chip/chip' },
  Dialog: { importName: 'DialogTrigger', path: 'dialogTrigger/dialogTrigger' },
  Divider: { importName: 'Divider', path: 'divider/divider' },
  Drawer: { importName: 'DrawerTrigger', path: 'drawerTrigger/drawerTrigger' },
  Input: { importName: 'Input', path: 'input/input' },
  Link: { importName: 'Link', path: 'link/link' },
  Menu: { importName: 'Menu', path: 'menu/menu' },
  RadioButton: { importName: 'RadioButton', path: 'radio/radio' },
  Select: { importName: 'Select', path: 'select/select' },
  Table: { importName: 'Table', path: 'table/table' },
  Tabs: { importName: 'Tabs', path: 'tabs/tabs' },
  TextArea: { importName: 'TextArea', path: 'textArea/textArea' },
  Toast: { importName: 'Toast', path: 'toast/toast' },
};

export const hasComponentImplementation = (componentType) => Boolean(COMPONENT_MODULES[componentType]);

export const getComponentImportName = (componentType) => COMPONENT_MODULES[componentType].importName;

export const getComponentImportPath = (componentType, componentsDirectory) =>
  `${componentsDirectory}/${COMPONENT_MODULES[componentType].path}`;
