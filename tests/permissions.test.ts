import { describe, expect, it } from 'vitest';
import { desiredRuleOriginPatterns, senderMatchesOrigin } from '../utils/permissions';
import type { PathRule } from '../utils/types';

const rule: PathRule = {
  id: 'rule-1',
  origin: 'https://example.com',
  pathGlob: '/articles/*',
  enabled: true,
  targets: [],
  createdAt: 1,
  updatedAt: 1,
};

describe('permission boundaries', () => {
  it('accepts only the sender tab exact origin', () => {
    expect(senderMatchesOrigin('https://example.com/article', 'https://example.com')).toBe(true);
    expect(senderMatchesOrigin('https://example.com/article', 'https://other.example')).toBe(false);
    expect(senderMatchesOrigin('chrome://settings', 'chrome://settings')).toBe(false);
    expect(senderMatchesOrigin('https://example.com/article', 'https://example.com/path')).toBe(
      false,
    );
  });

  it('registers scripts only for granted saved-rule origins', () => {
    const patterns = desiredRuleOriginPatterns(
      [rule],
      ['https://example.com/*', 'https://shayan-shojaei.github.io/*'],
    );
    expect([...patterns]).toEqual(['https://example.com/*']);
  });
});
