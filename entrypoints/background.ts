import { originPattern } from '../utils/path';
import { desiredRuleOriginPatterns, senderMatchesOrigin } from '../utils/permissions';
import {
  getRules,
  getSettings,
  getUpdateState,
  saveSettings,
  saveUpdateState,
} from '../utils/storage';
import type { ExtensionMessage } from '../utils/types';
import { acknowledgeAvailableUpdate, evaluateUpdate, parseUpdateMetadata } from '../utils/update';
import { browser, type Browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

const CONTENT_SCRIPT_FILE = '/content-scripts/reader.js';
const UPDATE_ALARM = 'faster-reads-update-check';
const UPDATE_ORIGIN_PATTERN = 'https://shayan-shojaei.github.io/*';
const UPDATE_METADATA_URL = 'https://shayan-shojaei.github.io/faster-reads/version.json';
const UPDATE_PAGE_URL = 'https://shayan-shojaei.github.io/faster-reads/#install';

function registrationId(pattern: string): string {
  let hash = 2166136261;
  for (const character of pattern) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `faster-reads-${(hash >>> 0).toString(36)}`;
}

async function reconcileRegisteredScripts(): Promise<void> {
  const [rules, { origins = [] }, registered] = await Promise.all([
    getRules(),
    browser.permissions.getAll(),
    browser.scripting.getRegisteredContentScripts(),
  ]);
  const desiredPatterns = desiredRuleOriginPatterns(rules, origins);
  const desired = new Map(
    Array.from(desiredPatterns, (pattern) => [registrationId(pattern), pattern]),
  );
  const managed = registered.filter((script) => script.id.startsWith('faster-reads-'));
  const staleIds = managed.filter((script) => !desired.has(script.id)).map((script) => script.id);
  if (staleIds.length) await browser.scripting.unregisterContentScripts({ ids: staleIds });

  const registeredIds = new Set(managed.map((script) => script.id));
  const missing = Array.from(desired, ([id, pattern]) => ({ id, pattern })).filter(
    ({ id }) => !registeredIds.has(id),
  );
  if (missing.length) {
    await browser.scripting.registerContentScripts(
      missing.map(({ id, pattern }) => ({
        id,
        js: [CONTENT_SCRIPT_FILE],
        matches: [pattern],
        runAt: 'document_idle' as const,
        persistAcrossSessions: true,
      })),
    );
  }
}

function isSupportedUrl(url?: string): boolean {
  return Boolean(url?.startsWith('http://') || url?.startsWith('https://'));
}

async function showActionError(tabId: number, message: string): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ tabId, color: '#b42318' });
  await browser.action.setBadgeText({ tabId, text: '!' });
  await browser.action.setTitle({ tabId, title: message });
}

async function clearActionError(tabId: number): Promise<void> {
  await browser.action.setBadgeText({ tabId, text: '' });
  await browser.action.setTitle({ tabId, title: 'Select a section for Faster Reads' });
}

async function showUpdateBadge(version: string): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ color: '#7c3aed' });
  await browser.action.setBadgeText({ text: 'UP' });
  await browser.action.setTitle({ title: `Faster Reads ${version} is available` });
}

async function clearUpdateBadge(): Promise<void> {
  await browser.action.setBadgeText({ text: '' });
  await browser.action.setTitle({ title: 'Select a section for Faster Reads' });
}

async function checkForUpdate(): Promise<void> {
  const settings = await getSettings();
  if (!settings.updateChecksEnabled) return;
  const allowed = await browser.permissions.contains({ origins: [UPDATE_ORIGIN_PATTERN] });
  if (!allowed) return;

  const response = await fetch(UPDATE_METADATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Update check failed with status ${response.status}.`);
  const metadata = parseUpdateMetadata(await response.json());
  const state = await getUpdateState();
  const result = evaluateUpdate(metadata, browser.runtime.getManifest().version, state, Date.now());
  await saveUpdateState(result.state);
  if (result.shouldNotify) await showUpdateBadge(metadata.version);
  else await clearUpdateBadge();
}

async function configureUpdateChecks(): Promise<void> {
  const settings = await getSettings();
  const allowed = await browser.permissions.contains({ origins: [UPDATE_ORIGIN_PATTERN] });
  if (!settings.updateChecksEnabled || !allowed) {
    await browser.alarms.clear(UPDATE_ALARM);
    const state = await getUpdateState();
    if (state.availableVersion) {
      const cleared = { ...state };
      delete cleared.availableVersion;
      await saveUpdateState(cleared);
    }
    await clearUpdateBadge();
    return;
  }
  await browser.alarms.create(UPDATE_ALARM, { periodInMinutes: 24 * 60 });
  void checkForUpdate().catch(() => undefined);
}

async function acknowledgeAndOpenUpdate(): Promise<boolean> {
  const state = await getUpdateState();
  if (!state.availableVersion || state.acknowledgedVersion === state.availableVersion) return false;
  await saveUpdateState(acknowledgeAvailableUpdate(state));
  await clearUpdateBadge();
  await browser.tabs.create({ url: UPDATE_PAGE_URL });
  return true;
}

async function startPicker(tab: Browser.tabs.Tab): Promise<void> {
  if (typeof tab.id !== 'number' || !isSupportedUrl(tab.url)) {
    if (typeof tab.id === 'number')
      await showActionError(tab.id, 'Faster Reads cannot run on this page');
    return;
  }

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: [CONTENT_SCRIPT_FILE],
    });
    await browser.tabs.sendMessage(tab.id, { type: 'START_PICKER' } satisfies ExtensionMessage);
    await clearActionError(tab.id);
  } catch {
    await showActionError(tab.id, 'Faster Reads cannot access this page');
  }
}

export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    void acknowledgeAndOpenUpdate().then((opened) => {
      if (!opened) void startPicker(tab);
    });
  });
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install')
      void browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') });
    void reconcileRegisteredScripts();
    void configureUpdateChecks();
  });
  browser.runtime.onStartup.addListener(() => {
    void reconcileRegisteredScripts();
    void configureUpdateChecks();
  });
  browser.permissions.onAdded.addListener(() => {
    void reconcileRegisteredScripts();
    void configureUpdateChecks();
  });
  browser.permissions.onRemoved.addListener((permissions) => {
    void reconcileRegisteredScripts();
    if (permissions.origins?.includes(UPDATE_ORIGIN_PATTERN)) {
      void getSettings().then((settings) =>
        saveSettings({ ...settings, updateChecksEnabled: false }),
      );
    }
    void configureUpdateChecks();
  });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === UPDATE_ALARM) void checkForUpdate().catch(() => undefined);
  });
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && Object.keys(changes).some((key) => key.startsWith('rule:'))) {
      void reconcileRegisteredScripts();
    }
    if (area === 'sync' && changes.settings) void configureUpdateChecks();
  });

  void reconcileRegisteredScripts();
  void configureUpdateChecks();

  browser.runtime.onMessage.addListener((message: ExtensionMessage, sender) => {
    if (
      message.type === 'REQUEST_HOST_ACCESS' &&
      typeof sender.tab?.id === 'number' &&
      senderMatchesOrigin(sender.tab.url, message.origin)
    ) {
      const permissions = browser.permissions as typeof browser.permissions & {
        addHostAccessRequest(options: { tabId: number; pattern: string }): Promise<void>;
      };
      return permissions
        .addHostAccessRequest({ tabId: sender.tab.id, pattern: originPattern(message.origin) })
        .then(() => ({ ok: true }))
        .catch((error: unknown) => ({ ok: false, error: String(error) }));
    }
    if (message.type === 'CLEAR_ACTION_ERROR' && typeof sender.tab?.id === 'number') {
      return clearActionError(sender.tab.id).then(() => ({ ok: true }));
    }
    return undefined;
  });
});
