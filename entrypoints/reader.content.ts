import { addElementToRules, matchingRules } from '../utils/rules';
import { getRules, getSettings, isRuleStorageKey, saveRule, deleteRule } from '../utils/storage';
import { applyRules, restoreAll, restoreTarget, transformElement } from '../utils/transformer';
import type { ExtensionMessage, PathRule } from '../utils/types';
import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';

declare global {
  interface Window {
    __fasterReadsInstalled?: boolean;
  }
}

const BLOCK_SELECTOR = 'p, li, blockquote, article, section, main, aside, div, td, th, dd, dt';
const MIN_TEXT_LENGTH = 2;

function readableBlock(start: Element | null): HTMLElement | null {
  let current = start instanceof HTMLElement ? start : null;
  while (current && current !== document.body && current !== document.documentElement) {
    if (current.closest('[data-faster-reads-ui]')) return null;
    const style = getComputedStyle(current);
    const isBlock = style.display !== 'inline' && style.display !== 'contents';
    if (
      isBlock &&
      current.matches(BLOCK_SELECTOR) &&
      (current.innerText || '').trim().length >= MIN_TEXT_LENGTH
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.dataset.fasterReadsUi = '';
  Object.assign(overlay.style, {
    position: 'fixed',
    zIndex: '2147483646',
    pointerEvents: 'none',
    border: '2px solid #7c3aed',
    borderRadius: '5px',
    background: 'rgba(124, 58, 237, 0.08)',
    boxSizing: 'border-box',
    transition: 'all 60ms ease-out',
    display: 'none',
  });
  document.documentElement.append(overlay);
  return overlay;
}

function positionOverlay(overlay: HTMLElement, target: Element | null): void {
  if (!target) {
    overlay.style.display = 'none';
    return;
  }
  const rect = target.getBoundingClientRect();
  Object.assign(overlay.style, {
    display: 'block',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
}

function showToast(message: string, action?: { label: string; run: () => void }): void {
  document.querySelector('[data-faster-reads-toast]')?.remove();
  const toast = document.createElement('div');
  toast.dataset.fasterReadsUi = '';
  toast.dataset.fasterReadsToast = '';
  toast.setAttribute('role', 'status');
  Object.assign(toast.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    zIndex: '2147483647',
    padding: '11px 14px',
    borderRadius: '9px',
    background: '#171717',
    color: '#fff',
    font: '13px/1.4 system-ui, sans-serif',
    boxShadow: '0 6px 24px rgba(0,0,0,.25)',
  });
  toast.append(document.createTextNode(message));
  if (action) {
    const button = document.createElement('button');
    button.textContent = action.label;
    Object.assign(button.style, {
      marginInlineStart: '12px',
      border: '0',
      padding: '0',
      background: 'transparent',
      color: '#c4b5fd',
      font: 'inherit',
      fontWeight: '700',
      cursor: 'pointer',
    });
    button.addEventListener('click', () => {
      action.run();
      toast.remove();
    });
    toast.append(button);
  }
  document.documentElement.append(toast);
  window.setTimeout(() => toast.remove(), 8000);
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  registration: 'runtime',
  runAt: 'document_idle',
  main(ctx) {
    if (window.__fasterReadsInstalled) return;
    window.__fasterReadsInstalled = true;

    let rules: PathRule[] = [];
    let intensity: 'light' | 'medium' | 'strong' = 'medium';
    let lastUrl = location.href;
    let refreshTimer: number | undefined;
    let pickerCleanup: (() => void) | undefined;

    const activeRules = () => matchingRules(rules, location);

    async function loadAndRender(fullRestore = true): Promise<void> {
      [rules, { intensity }] = await Promise.all([getRules(), getSettings()]);
      if (fullRestore) restoreAll();
      applyRules(activeRules(), intensity);
    }

    function scheduleIncrementalRender(): void {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => applyRules(activeRules(), intensity), 120);
    }

    async function undoSelection(ruleId: string, targetId: string): Promise<void> {
      const latest = (await getRules()).find((rule) => rule.id === ruleId);
      if (!latest) return;
      const targets = latest.targets.filter((target) => target.id !== targetId);
      if (targets.length) await saveRule({ ...latest, targets, updatedAt: Date.now() });
      else await deleteRule(latest.id);
      restoreTarget(targetId);
      await loadAndRender(true);
    }

    function stopPicker(): void {
      pickerCleanup?.();
      pickerCleanup = undefined;
    }

    function startPicker(): void {
      if (pickerCleanup) {
        stopPicker();
        return;
      }
      const overlay = createOverlay();
      let hovered: HTMLElement | null = null;

      const onPointerMove = (event: PointerEvent) => {
        hovered = readableBlock(event.target instanceof Element ? event.target : null);
        positionOverlay(overlay, hovered);
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') stopPicker();
      };
      const onClick = async (event: MouseEvent) => {
        if (!hovered) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const selected = hovered;
        stopPicker();
        try {
          const result = await addElementToRules(selected, rules, location);
          if (!result) {
            showToast('This section is already covered.');
            return;
          }
          await loadAndRender(true);
          transformElement(selected, result.target.id, intensity);
          void browser.runtime.sendMessage({
            type: 'REQUEST_HOST_ACCESS',
            origin: location.origin,
          } satisfies ExtensionMessage);
          showToast('Section saved. Site access may be required for future visits.', {
            label: 'Undo',
            run: () => void undoSelection(result.rule.id, result.target.id),
          });
        } catch (error) {
          showToast(
            `Could not save section: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      };

      document.addEventListener('pointermove', onPointerMove, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeyDown, true);
      pickerCleanup = () => {
        document.removeEventListener('pointermove', onPointerMove, true);
        document.removeEventListener('click', onClick, true);
        document.removeEventListener('keydown', onKeyDown, true);
        overlay.remove();
      };
    }

    browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
      if (message.type === 'START_PICKER') startPicker();
      return undefined;
    });

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && Object.keys(changes).some(isRuleStorageKey))
        void loadAndRender(true);
    });

    const observer = new MutationObserver((mutations) => {
      if (
        mutations.every(
          (mutation) =>
            mutation.target instanceof Element &&
            mutation.target.closest('[data-faster-reads-wrapper]'),
        )
      )
        return;
      scheduleIncrementalRender();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    ctx.setInterval(() => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      void loadAndRender(true);
    }, 750);

    void loadAndRender(false);
  },
});
