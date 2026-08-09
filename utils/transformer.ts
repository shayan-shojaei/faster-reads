import { segmentText } from './bionic';
import { resolveTarget } from './selector';
import type { Intensity, PathRule } from './types';

const WRAPPER_ATTRIBUTE = 'data-faster-reads-wrapper';
const TARGET_ATTRIBUTE = 'data-faster-reads-target';
const EMPHASIS_ATTRIBUTE = 'data-faster-reads-emphasis';
const STYLE_ID = 'faster-reads-page-style';

const EXCLUDED_SELECTOR = [
  'script',
  'style',
  'noscript',
  'textarea',
  'input',
  'select',
  'option',
  'button',
  'code',
  'pre',
  'kbd',
  'samp',
  'svg',
  'math',
  '[contenteditable]:not([contenteditable="false"])',
  '[aria-hidden="true"]',
  `[${WRAPPER_ATTRIBUTE}]`,
  '[data-faster-reads-ui]',
].join(',');

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `[${EMPHASIS_ATTRIBUTE}] { font-weight: 700 !important; }`;
  (document.head || document.documentElement).append(style);
}

function eligibleTextNode(node: Text, root: Element): boolean {
  if (!node.data.trim() || !node.parentElement || !root.contains(node)) return false;
  return !node.parentElement.closest(EXCLUDED_SELECTOR);
}

function transformTextNode(node: Text, targetId: string, intensity: Intensity): void {
  const parts = segmentText(node.data, intensity);
  if (!parts.some((part) => part.emphasized)) return;

  const wrapper = document.createElement('span');
  wrapper.setAttribute(WRAPPER_ATTRIBUTE, '');
  wrapper.setAttribute(TARGET_ATTRIBUTE, targetId);
  for (const part of parts) {
    if (!part.text) continue;
    if (!part.emphasized) {
      wrapper.append(document.createTextNode(part.text));
      continue;
    }
    const emphasis = document.createElement('span');
    emphasis.setAttribute(EMPHASIS_ATTRIBUTE, '');
    emphasis.textContent = part.text;
    wrapper.append(emphasis);
  }
  node.replaceWith(wrapper);
}

export function transformElement(root: Element, targetId: string, intensity: Intensity): void {
  ensureStyle();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (eligibleTextNode(current as Text, root)) nodes.push(current as Text);
  }
  for (const node of nodes) transformTextNode(node, targetId, intensity);
}

export function restoreTarget(targetId: string): void {
  const selector = `[${WRAPPER_ATTRIBUTE}][${TARGET_ATTRIBUTE}="${CSS.escape(targetId)}"]`;
  document.querySelectorAll<HTMLElement>(selector).forEach((wrapper) => {
    wrapper.replaceWith(document.createTextNode(wrapper.textContent ?? ''));
  });
}

export function restoreAll(): void {
  document.querySelectorAll<HTMLElement>(`[${WRAPPER_ATTRIBUTE}]`).forEach((wrapper) => {
    wrapper.replaceWith(document.createTextNode(wrapper.textContent ?? ''));
  });
}

export function applyRules(rules: PathRule[], intensity: Intensity): Set<string> {
  const applied = new Set<string>();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    for (const target of rule.targets) {
      const element = resolveTarget(target);
      if (!element) continue;
      transformElement(element, target.id, intensity);
      applied.add(target.id);
    }
  }
  return applied;
}

export function transformedTargetIds(): Set<string> {
  return new Set(
    Array.from(document.querySelectorAll<HTMLElement>(`[${TARGET_ATTRIBUTE}]`))
      .map((element) => element.getAttribute(TARGET_ATTRIBUTE))
      .filter((value): value is string => Boolean(value)),
  );
}
