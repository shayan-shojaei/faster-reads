import { beforeEach, describe, expect, it } from 'vitest';
import { createSelector, createTarget, resolveTarget, structuralLabel } from '../utils/selector';

describe('element selectors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main id="content">
        <article class="story readable"><p>First</p><p>Second</p></article>
      </main>`;
  });

  it('prefers stable unique identifiers', () => {
    const main = document.querySelector('main')!;
    expect(createSelector(main)).toBe('#content');
    expect(structuralLabel(main)).toBe('main#content');
  });

  it('creates and resolves a unique structural target', () => {
    const paragraph = document.querySelectorAll('p')[1]!;
    const target = createTarget(paragraph);
    expect(resolveTarget(target)).toBe(paragraph);
    expect(target.primarySelector).toContain('nth-of-type(2)');
  });
});
