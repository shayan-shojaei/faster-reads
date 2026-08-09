import { describe, expect, it } from 'vitest';
import { normalizeSettings } from '../utils/storage';

describe('settings migration', () => {
  it('adds update checks as disabled while preserving legacy intensity', () => {
    expect(normalizeSettings({ schemaVersion: 1, intensity: 'strong' })).toEqual({
      schemaVersion: 2,
      intensity: 'strong',
      updateChecksEnabled: false,
    });
  });
});
