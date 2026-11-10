import { BREAKPOINTS } from '../grid/breakpoints';

export const MINIMUM_WIDTHS = {
  default: { desktop: 2, tablet: 2, mobile: 2 },
  Section: { desktop: 6, tablet: 6, mobile: 6 },
  Card: { desktop: 4, tablet: 4, mobile: 6 },
  Button: { desktop: 2, tablet: 2, mobile: 2 },
  Checkbox: { desktop: 2, tablet: 2, mobile: 2 },
  RadioButton: { desktop: 2, tablet: 2, mobile: 2 },
  Input: { desktop: 4, tablet: 4, mobile: 6 },
  Select: { desktop: 4, tablet: 4, mobile: 6 },
  TextArea: { desktop: 4, tablet: 4, mobile: 6 },
  Avatar: { desktop: 1, tablet: 1, mobile: 1 },
  Chip: { desktop: 1, tablet: 1, mobile: 2 },
  Divider: { desktop: 2, tablet: 2, mobile: 2 },
  Table: { desktop: 8, tablet: 8, mobile: 6 },
  Alert: { desktop: 3, tablet: 3, mobile: 3 },
  Dialog: { desktop: 3, tablet: 3, mobile: 3 },
  Toast: { desktop: 3, tablet: 4, mobile: 6 },
  Accordion: { desktop: 4, tablet: 6, mobile: 6 },
  Drawer: { desktop: 3, tablet: 3, mobile: 3 },
  Breadcrumbs: { desktop: 4, tablet: 6, mobile: 6 },
  Link: { desktop: 1, tablet: 2, mobile: 2 },
  Menu: { desktop: 4, tablet: 6, mobile: 6 },
  Tabs: { desktop: 6, tablet: 8, mobile: 6 },
};

export const getMinimumWidth = (componentType, breakpointId) => {
  const widths = MINIMUM_WIDTHS[componentType] ?? MINIMUM_WIDTHS.default;
  return Math.min(widths[breakpointId], BREAKPOINTS[breakpointId].columns);
};
