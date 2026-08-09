import { beforeEach, describe, expect, it } from 'vitest';
import { restoreAll, restoreTarget, transformElement } from '../utils/transformer';

describe('DOM transformation', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '<head></head><body></body>';
  });

  it('preserves text and nested interactive elements', () => {
    document.body.innerHTML = '<article>Hello <a href="#next">reading world</a>.</article>';
    const article = document.querySelector('article')!;
    const link = document.querySelector('a')!;
    transformElement(article, 'target-1', 'medium');

    expect(article.textContent).toBe('Hello reading world.');
    expect(document.querySelector('a')).toBe(link);
    expect(article.querySelectorAll('[data-faster-reads-emphasis]').length).toBeGreaterThan(0);

    restoreTarget('target-1');
    expect(article.textContent).toBe('Hello reading world.');
    expect(article.querySelector('[data-faster-reads-wrapper]')).toBeNull();
  });

  it('skips code, form, editable, and hidden content', () => {
    document.body.innerHTML = `
      <section>
        Read this text
        <code>const untouched = true</code>
        <textarea>untouched field</textarea>
        <span contenteditable="true">editable words</span>
        <span aria-hidden="true">hidden words</span>
      </section>`;
    const section = document.querySelector('section')!;
    transformElement(section, 'target-2', 'strong');
    expect(section.querySelectorAll('[data-faster-reads-wrapper]')).toHaveLength(1);
  });

  it('is idempotent and can restore everything', () => {
    document.body.innerHTML = '<p>Repeated transformation remains stable</p>';
    const paragraph = document.querySelector('p')!;
    transformElement(paragraph, 'target-3', 'medium');
    const wrapperCount = paragraph.querySelectorAll('[data-faster-reads-wrapper]').length;
    transformElement(paragraph, 'target-3', 'medium');
    expect(paragraph.querySelectorAll('[data-faster-reads-wrapper]')).toHaveLength(wrapperCount);
    restoreAll();
    expect(paragraph.textContent).toBe('Repeated transformation remains stable');
  });
});
