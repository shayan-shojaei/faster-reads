import { getSettings, saveSettings } from '../../utils/storage';
import { segmentText } from '../../utils/bionic';
import type { Intensity } from '../../utils/types';
import { browser } from 'wxt/browser';

const UPDATE_ORIGIN_PATTERN = 'https://shayan-shojaei.github.io/*';
const panels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
const dots = Array.from(document.querySelectorAll<HTMLElement>('.steps span'));
const intensityRoot = document.querySelector<HTMLDivElement>('#intensity')!;
const preview = document.querySelector<HTMLDivElement>('#preview')!;
const updates = document.querySelector<HTMLInputElement>('#updates')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
let step = 0;
let intensity: Intensity = 'medium';

function showStep(next: number): void {
  step = Math.max(0, Math.min(panels.length - 1, next));
  panels.forEach((panel, index) => {
    panel.hidden = index !== step;
    panel.classList.toggle('active', index === step);
  });
  dots.forEach((dot, index) => dot.classList.toggle('active', index <= step));
  document.querySelector<HTMLElement>('.panel.active h1')?.focus();
}

function renderPreview(): void {
  preview.replaceChildren();
  const paragraph = document.createElement('p');
  for (const part of segmentText(
    'Find a comfortable rhythm for every article you read.',
    intensity,
  )) {
    const node = part.emphasized
      ? document.createElement('strong')
      : document.createTextNode(part.text);
    if (node instanceof HTMLElement) node.textContent = part.text;
    paragraph.append(node);
  }
  preview.append(paragraph);
  intensityRoot.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-checked', String(button.dataset.value === intensity));
  });
}

function renderIntensity(): void {
  for (const value of ['light', 'medium', 'strong'] as Intensity[]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = value;
    button.setAttribute('role', 'radio');
    button.textContent = value[0]!.toUpperCase() + value.slice(1);
    button.addEventListener('click', async () => {
      intensity = value;
      const settings = await getSettings();
      await saveSettings({ ...settings, intensity });
      renderPreview();
    });
    intensityRoot.append(button);
  }
  renderPreview();
}

document.querySelectorAll<HTMLButtonElement>('.next').forEach((button) => {
  button.addEventListener('click', () => showStep(step + 1));
});
document.querySelectorAll<HTMLButtonElement>('.back').forEach((button) => {
  button.addEventListener('click', () => showStep(step - 1));
});
document
  .querySelector<HTMLButtonElement>('#skip')!
  .addEventListener('click', () => void browser.runtime.openOptionsPage());
document.querySelector<HTMLButtonElement>('#finish')!.addEventListener('click', async () => {
  const settings = await getSettings();
  let updateChecksEnabled = false;
  if (updates.checked) {
    updateChecksEnabled = await browser.permissions.request({ origins: [UPDATE_ORIGIN_PATTERN] });
    if (!updateChecksEnabled) {
      status.textContent =
        'Update access was not granted. You can enable checks later in settings.';
    }
  }
  await saveSettings({ ...settings, intensity, updateChecksEnabled });
  await browser.runtime.openOptionsPage();
  window.close();
});

void getSettings().then((settings) => {
  intensity = settings.intensity;
  updates.checked = settings.updateChecksEnabled;
  renderIntensity();
});
