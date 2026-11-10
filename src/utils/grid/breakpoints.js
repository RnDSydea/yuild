export const ROW_HEIGHT = 16;

export const BREAKPOINTS = {
  desktop: { id: 'desktop', label: 'Desktop', columns: 24, minViewportWidth: 1200, previewWidth: null },
  tablet: { id: 'tablet', label: 'Tablet', columns: 12, minViewportWidth: 768, previewWidth: 768 },
  mobile: { id: 'mobile', label: 'Mobile', columns: 6, minViewportWidth: 0, previewWidth: 375 },
};

export const BREAKPOINT_ORDER = ['desktop', 'tablet', 'mobile'];

export const DEFAULT_BREAKPOINT = 'desktop';

export const getBreakpointColumns = (breakpointId) => BREAKPOINTS[breakpointId].columns;
