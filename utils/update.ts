import type { UpdateMetadata, UpdateState } from './types';

const VERSION_PATTERN = /^\d+(?:\.\d+){0,3}$/;

export function compareVersions(left: string, right: string): number {
  if (!VERSION_PATTERN.test(left) || !VERSION_PATTERN.test(right)) {
    throw new Error('Versions must contain one to four numeric components.');
  }
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 4; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

export function isNewerVersion(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0;
}

export function parseUpdateMetadata(value: unknown): UpdateMetadata {
  if (!value || typeof value !== 'object') throw new Error('Invalid update metadata.');
  const metadata = value as Partial<UpdateMetadata>;
  if (
    typeof metadata.version !== 'string' ||
    !VERSION_PATTERN.test(metadata.version) ||
    (metadata.channel !== 'beta' && metadata.channel !== 'stable') ||
    typeof metadata.releaseUrl !== 'string' ||
    typeof metadata.downloadUrl !== 'string' ||
    typeof metadata.checksumUrl !== 'string'
  ) {
    throw new Error('Invalid update metadata.');
  }
  for (const url of [metadata.releaseUrl, metadata.downloadUrl, metadata.checksumUrl]) {
    if (new URL(url).protocol !== 'https:') throw new Error('Update URLs must use HTTPS.');
  }
  return metadata as UpdateMetadata;
}

export function evaluateUpdate(
  metadata: UpdateMetadata,
  currentVersion: string,
  state: UpdateState,
  checkedAt: number,
): { state: UpdateState; shouldNotify: boolean } {
  if (!isNewerVersion(metadata.version, currentVersion)) {
    return {
      state: { lastCheckedAt: checkedAt, acknowledgedVersion: state.acknowledgedVersion },
      shouldNotify: false,
    };
  }
  return {
    state: { ...state, lastCheckedAt: checkedAt, availableVersion: metadata.version },
    shouldNotify: state.acknowledgedVersion !== metadata.version,
  };
}

export function acknowledgeAvailableUpdate(state: UpdateState): UpdateState {
  if (!state.availableVersion) return state;
  return { ...state, acknowledgedVersion: state.availableVersion };
}
