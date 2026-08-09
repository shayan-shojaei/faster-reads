import { originPattern, validatePathGlob } from '../../utils/path';
import {
  deleteRule,
  getRules,
  getSettings,
  getUpdateState,
  saveRule,
  saveSettings,
} from '../../utils/storage';
import type { Intensity, PathRule } from '../../utils/types';
import { browser } from 'wxt/browser';

const intensityRoot = document.querySelector<HTMLDivElement>('#intensity')!;
const rulesRoot = document.querySelector<HTMLDivElement>('#rules')!;
const statusRoot = document.querySelector<HTMLDivElement>('#status')!;
const shortcutsButton = document.querySelector<HTMLButtonElement>('#shortcuts')!;
const onboardingButton = document.querySelector<HTMLButtonElement>('#onboarding')!;
const updatesInput = document.querySelector<HTMLInputElement>('#updates')!;
const updateBanner = document.querySelector<HTMLDivElement>('#update-banner')!;
const UPDATE_ORIGIN_PATTERN = 'https://shayan-shojaei.github.io/*';

let rules: PathRule[] = [];

function setStatus(message = ''): void {
  statusRoot.textContent = message;
}

function button(
  label: string,
  className: string,
  handler: () => void | Promise<void>,
): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  element.addEventListener('click', () => void handler());
  return element;
}

async function renderIntensity(): Promise<void> {
  const settings = await getSettings();
  intensityRoot.replaceChildren();
  for (const value of ['light', 'medium', 'strong'] as Intensity[]) {
    const option = button(value[0]!.toUpperCase() + value.slice(1), '', async () => {
      await saveSettings({ ...settings, intensity: value });
      await renderIntensity();
    });
    option.setAttribute('role', 'radio');
    option.setAttribute('aria-checked', String(settings.intensity === value));
    intensityRoot.append(option);
  }
}

async function renderUpdates(): Promise<void> {
  const [settings, state] = await Promise.all([getSettings(), getUpdateState()]);
  updatesInput.checked = settings.updateChecksEnabled;
  updateBanner.replaceChildren();
  updateBanner.hidden = !state.availableVersion;
  if (state.availableVersion) {
    const text = document.createElement('span');
    text.textContent = `Faster Reads ${state.availableVersion} is available.`;
    const link = document.createElement('a');
    link.href = `https://shayan-shojaei.github.io/faster-reads/#install`;
    link.target = '_blank';
    link.textContent = 'View update';
    updateBanner.append(text, link);
  }
}

async function hasOriginPermission(origin: string): Promise<boolean> {
  return browser.permissions.contains({ origins: [originPattern(origin)] });
}

async function removeRule(rule: PathRule): Promise<void> {
  await deleteRule(rule.id);
  rules = rules.filter((item) => item.id !== rule.id);
  if (!rules.some((item) => item.origin === rule.origin)) {
    await browser.permissions.remove({ origins: [originPattern(rule.origin)] });
  }
  await renderRules();
}

async function renderRule(rule: PathRule): Promise<HTMLElement> {
  const card = document.createElement('article');
  card.className = 'rule-card';

  const header = document.createElement('div');
  header.className = 'rule-header';
  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = rule.origin;
  const permissionState = document.createElement('div');
  permissionState.className = 'permission-state';
  const allowed = await hasOriginPermission(rule.origin);
  const dot = document.createElement('span');
  dot.className = `dot${allowed ? ' allowed' : ''}`;
  permissionState.append(
    dot,
    document.createTextNode(allowed ? 'Site access allowed' : 'Site access required'),
  );
  titleBlock.append(title, permissionState);

  const controls = document.createElement('div');
  const enabledLabel = document.createElement('label');
  enabledLabel.className = 'switch-label';
  const enabled = document.createElement('input');
  enabled.type = 'checkbox';
  enabled.checked = rule.enabled;
  enabled.addEventListener('change', async () => {
    await saveRule({ ...rule, enabled: enabled.checked, updatedAt: Date.now() });
    await load();
  });
  enabledLabel.append(enabled, document.createTextNode('Enabled'));
  controls.append(enabledLabel);
  controls.append(
    button(
      allowed ? 'Revoke access' : 'Allow access',
      `permission${allowed ? ' allowed' : ''}`,
      async () => {
        if (allowed) await browser.permissions.remove({ origins: [originPattern(rule.origin)] });
        else await browser.permissions.request({ origins: [originPattern(rule.origin)] });
        await renderRules();
      },
    ),
  );
  controls.append(button('Delete rule', 'danger', () => removeRule(rule)));
  controls.style.display = 'flex';
  controls.style.alignItems = 'center';
  controls.style.gap = '8px';
  header.append(titleBlock, controls);

  const body = document.createElement('div');
  body.className = 'rule-body';
  const pathRow = document.createElement('div');
  pathRow.className = 'path-row';
  const path = document.createElement('input');
  path.type = 'text';
  path.value = rule.pathGlob;
  path.setAttribute('aria-label', `Path pattern for ${rule.origin}`);
  const savePath = button('Save path', 'save', async () => {
    const error = validatePathGlob(path.value);
    path.classList.toggle('invalid', Boolean(error));
    if (error) {
      setStatus(error);
      return;
    }
    const normalized = path.value.length > 1 ? path.value.replace(/\/+$/, '') : '/';
    await saveRule({ ...rule, pathGlob: normalized, updatedAt: Date.now() });
    setStatus('Path saved.');
    await load();
  });
  pathRow.append(path, savePath);

  const targets = document.createElement('div');
  targets.className = 'target-list';
  for (const target of rule.targets) {
    const row = document.createElement('div');
    row.className = 'target-row';
    const label = document.createElement('code');
    label.textContent = target.label;
    label.title = target.primarySelector;
    row.append(
      label,
      button('Remove', 'danger', async () => {
        const remaining = rule.targets.filter((item) => item.id !== target.id);
        if (!remaining.length) await removeRule(rule);
        else {
          await saveRule({ ...rule, targets: remaining, updatedAt: Date.now() });
          await load();
        }
      }),
    );
    targets.append(row);
  }
  body.append(pathRow, targets);
  card.append(header, body);
  return card;
}

async function renderRules(): Promise<void> {
  rulesRoot.replaceChildren();
  if (!rules.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No saved sections yet. Click the extension icon on a webpage to add one.';
    rulesRoot.append(empty);
    return;
  }
  const cards = await Promise.all(
    [...rules]
      .sort((a, b) => a.origin.localeCompare(b.origin) || a.pathGlob.localeCompare(b.pathGlob))
      .map(renderRule),
  );
  rulesRoot.append(...cards);
}

async function load(): Promise<void> {
  rules = await getRules();
  await Promise.all([renderIntensity(), renderRules(), renderUpdates()]);
}

updatesInput.addEventListener('change', async () => {
  const settings = await getSettings();
  if (updatesInput.checked) {
    const granted = await browser.permissions.request({ origins: [UPDATE_ORIGIN_PATTERN] });
    await saveSettings({ ...settings, updateChecksEnabled: granted });
    if (!granted) setStatus('Update access was not granted.');
  } else {
    await saveSettings({ ...settings, updateChecksEnabled: false });
    await browser.permissions.remove({ origins: [UPDATE_ORIGIN_PATTERN] });
  }
  await renderUpdates();
});

shortcutsButton.addEventListener('click', () => {
  void browser.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

onboardingButton.addEventListener('click', () => {
  void browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') });
});

browser.storage.onChanged.addListener((_changes, area) => {
  if (area === 'sync') void load();
  if (area === 'local') void renderUpdates();
});

void load().catch((error: unknown) =>
  setStatus(error instanceof Error ? error.message : String(error)),
);
