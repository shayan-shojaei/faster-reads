import { DEFAULT_SETTINGS, type PathRule, type Settings, type UpdateState } from './types';
import { browser } from 'wxt/browser';

const SETTINGS_KEY = 'settings';
const RULE_PREFIX = 'rule:';
const UPDATE_STATE_KEY = 'updateState';
type StoredSettings = Partial<Omit<Settings, 'schemaVersion'>> & { schemaVersion?: number };

export function normalizeSettings(value: StoredSettings | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    schemaVersion: 2,
  };
}

export async function getSettings(): Promise<Settings> {
  const result = await browser.storage.sync.get(SETTINGS_KEY);
  const value = result[SETTINGS_KEY] as StoredSettings | undefined;
  return normalizeSettings(value);
}

export async function getUpdateState(): Promise<UpdateState> {
  const result = await browser.storage.local.get(UPDATE_STATE_KEY);
  return (result[UPDATE_STATE_KEY] as UpdateState | undefined) ?? {};
}

export async function saveUpdateState(state: UpdateState): Promise<void> {
  await browser.storage.local.set({ [UPDATE_STATE_KEY]: state });
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function getRules(): Promise<PathRule[]> {
  const result = await browser.storage.sync.get(null);
  return Object.entries(result)
    .filter(([key]) => key.startsWith(RULE_PREFIX))
    .map(([, value]) => value as PathRule)
    .filter((rule) => rule?.origin && Array.isArray(rule.targets));
}

export async function saveRule(rule: PathRule): Promise<void> {
  await browser.storage.sync.set({ [`${RULE_PREFIX}${rule.id}`]: rule });
}

export async function deleteRule(id: string): Promise<void> {
  await browser.storage.sync.remove(`${RULE_PREFIX}${id}`);
}

export function isRuleStorageKey(key: string): boolean {
  return key === SETTINGS_KEY || key.startsWith(RULE_PREFIX);
}
