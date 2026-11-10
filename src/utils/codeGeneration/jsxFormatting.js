export const INDENT = '  ';

const SAFE_ATTRIBUTE_TEXT = /^[^"\\{}<>\n\r]*$/;

export const toComponentName = (text, fallback = 'YuildApp') => {
  const words = String(text ?? '').match(/[A-Za-z0-9]+/g) ?? [];
  const name = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  if (!name) {
    return fallback;
  }
  return /^[0-9]/.test(name) ? `Page${name}` : name;
};

export const toKebabCase = (componentName) =>
  componentName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

export const formatJsxAttribute = (name, value) => {
  if (value === true) {
    return `${name}={true}`;
  }
  if (typeof value === 'string' && SAFE_ATTRIBUTE_TEXT.test(value)) {
    return `${name}="${value}"`;
  }
  return `${name}={${JSON.stringify(value)}}`;
};

export const formatStyleAttribute = (style) => (style ? ` style={${JSON.stringify(style)}}` : '');
