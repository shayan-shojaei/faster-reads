import { describe, expect, it } from 'vitest';
import { normalizePath, pathMatches, validatePathGlob } from '../utils/path';

describe('path rules', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizePath('/articles/')).toBe('/articles');
    expect(normalizePath('/')).toBe('/');
  });

  it('matches exact paths and explicit wildcards', () => {
    expect(pathMatches('/articles/one', '/articles/one')).toBe(true);
    expect(pathMatches('/articles/one/', '/articles/one')).toBe(true);
    expect(pathMatches('/articles/one', '/articles/*')).toBe(true);
    expect(pathMatches('/articles/one/comments', '/articles/*')).toBe(true);
    expect(pathMatches('/elsewhere', '/articles/*')).toBe(false);
  });

  it('validates the supported pathname-only syntax', () => {
    expect(validatePathGlob('articles/*')).toBeTruthy();
    expect(validatePathGlob('/articles/*?draft=1')).toBeTruthy();
    expect(validatePathGlob('/articles/*')).toBeNull();
  });
});
