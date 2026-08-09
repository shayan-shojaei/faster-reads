export type Intensity = 'light' | 'medium' | 'strong';

export interface Settings {
  schemaVersion: 2;
  intensity: Intensity;
  updateChecksEnabled: boolean;
}

export interface UpdateMetadata {
  version: string;
  channel: 'beta' | 'stable';
  releaseUrl: string;
  downloadUrl: string;
  checksumUrl: string;
}

export interface UpdateState {
  lastCheckedAt?: number;
  availableVersion?: string;
  acknowledgedVersion?: string;
}

export interface ElementTarget {
  id: string;
  label: string;
  primarySelector: string;
  fallbackSelector?: string;
  tagName: string;
}

export interface PathRule {
  id: string;
  origin: string;
  pathGlob: string;
  enabled: boolean;
  targets: ElementTarget[];
  createdAt: number;
  updatedAt: number;
}

export interface RuleSaveResult {
  rule: PathRule;
  target: ElementTarget;
}

export type ExtensionMessage =
  | { type: 'START_PICKER' }
  | { type: 'REQUEST_HOST_ACCESS'; origin: string }
  | { type: 'CLEAR_ACTION_ERROR' };

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 2,
  intensity: 'medium',
  updateChecksEnabled: false,
};
