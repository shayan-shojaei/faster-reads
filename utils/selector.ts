import type { ElementTarget } from './types';

const HASHY = /(?:^|[-_])[a-f\d]{7,}(?:$|[-_])/i;

function cssEscape(value: string): string {
  if (typeof globalThis.CSS?.escape === 'function') return CSS.escape(value);
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

function unique(selector: string, root: ParentNode = document): boolean {
  try {
    return root.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function stableClasses(element: Element): string[] {
  return Array.from(element.classList)
    .filter((name) => name.length < 64 && !HASHY.test(name))
    .slice(0, 3);
}

function segmentFor(element: Element): string {
  const tag = element.tagName.toLowerCase();
  if (element.id && !HASHY.test(element.id)) return `${tag}#${cssEscape(element.id)}`;

  const classes = stableClasses(element);
  const classSelector = classes.map((name) => `.${cssEscape(name)}`).join('');
  const base = `${tag}${classSelector}`;
  if (element.parentElement) {
    const siblings = Array.from(element.parentElement.children).filter(
      (child) => child.tagName === element.tagName,
    );
    if (siblings.length > 1) return `${base}:nth-of-type(${siblings.indexOf(element) + 1})`;
  }
  return base;
}

export function createSelector(element: Element): string {
  if (element.id && !HASHY.test(element.id)) {
    const selector = `#${cssEscape(element.id)}`;
    if (unique(selector)) return selector;
  }

  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== document.documentElement) {
    parts.unshift(segmentFor(current));
    const candidate = parts.join(' > ');
    if (unique(candidate)) return candidate;
    current = current.parentElement;
  }
  return ['html', ...parts].join(' > ');
}

export function createFallbackSelector(element: Element): string | undefined {
  const tag = element.tagName.toLowerCase();
  const classes = stableClasses(element);
  if (!classes.length) return undefined;
  const candidate = `${tag}${classes.map((name) => `.${cssEscape(name)}`).join('')}`;
  return unique(candidate) ? candidate : undefined;
}

export function structuralLabel(element: Element): string {
  const tag = element.tagName.toLowerCase();
  if (element.id && !HASHY.test(element.id)) return `${tag}#${element.id}`;
  const classes = stableClasses(element);
  return `${tag}${classes.length ? `.${classes.join('.')}` : ''}`;
}

export function createTarget(element: Element): ElementTarget {
  return {
    id: crypto.randomUUID(),
    label: structuralLabel(element),
    primarySelector: createSelector(element),
    fallbackSelector: createFallbackSelector(element),
    tagName: element.tagName.toLowerCase(),
  };
}

export function resolveTarget(target: ElementTarget, root: ParentNode = document): Element | null {
  for (const selector of [target.primarySelector, target.fallbackSelector]) {
    if (!selector) continue;
    try {
      const matches = root.querySelectorAll(selector);
      if (matches.length === 1 && matches[0]?.tagName.toLowerCase() === target.tagName)
        return matches[0];
    } catch {
      // An edited or stale selector is treated as unmatched.
    }
  }
  return null;
}
