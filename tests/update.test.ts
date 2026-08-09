import { describe, expect, it } from 'vitest';
import {
  acknowledgeAvailableUpdate,
  compareVersions,
  evaluateUpdate,
  isNewerVersion,
  parseUpdateMetadata,
} from '../utils/update';

describe('update metadata', () => {
  it('compares Chrome numeric versions', () => {
    expect(compareVersions('0.9.0', '0.9')).toBe(0);
    expect(compareVersions('0.10.0', '0.9.9')).toBe(1);
    expect(isNewerVersion('1.0.0', '0.9.0')).toBe(true);
    expect(isNewerVersion('0.9.0', '0.9.0')).toBe(false);
  });

  it('rejects prerelease labels and unsafe metadata URLs', () => {
    expect(() => compareVersions('0.9.0-beta', '0.9.0')).toThrow();
    expect(() =>
      parseUpdateMetadata({
        version: '1.0.0',
        channel: 'stable',
        releaseUrl: 'http://example.com/release',
        downloadUrl: 'https://example.com/download',
        checksumUrl: 'https://example.com/checksum',
      }),
    ).toThrow();
  });

  it('parses valid release metadata', () => {
    expect(
      parseUpdateMetadata({
        version: '0.9.1',
        channel: 'beta',
        releaseUrl: 'https://example.com/release',
        downloadUrl: 'https://example.com/download',
        checksumUrl: 'https://example.com/checksum',
      }).version,
    ).toBe('0.9.1');
  });

  it('notifies once per available version and records acknowledgement', () => {
    const metadata = parseUpdateMetadata({
      version: '0.9.1',
      channel: 'beta',
      releaseUrl: 'https://example.com/release',
      downloadUrl: 'https://example.com/download',
      checksumUrl: 'https://example.com/checksum',
    });
    const first = evaluateUpdate(metadata, '0.9.0', {}, 100);
    expect(first.shouldNotify).toBe(true);
    const acknowledged = acknowledgeAvailableUpdate(first.state);
    const second = evaluateUpdate(metadata, '0.9.0', acknowledged, 200);
    expect(second.shouldNotify).toBe(false);
    expect(second.state).toMatchObject({
      lastCheckedAt: 200,
      availableVersion: '0.9.1',
      acknowledgedVersion: '0.9.1',
    });
  });
});
