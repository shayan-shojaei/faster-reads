import { describe, expect, it } from 'vitest';
import { emphasisLength, segmentText, splitWord } from '../utils/bionic';

describe('bionic segmentation', () => {
  it('uses the configured intensity and never emphasizes a whole word', () => {
    expect(splitWord('reading', 'light')).toEqual(['rea', 'ding']);
    expect(splitWord('reading', 'medium')).toEqual(['read', 'ing']);
    expect(splitWord('reading', 'strong')).toEqual(['readi', 'ng']);
    expect(emphasisLength('a', 'strong')).toBe(0);
    expect(splitWord('to', 'strong')).toEqual(['t', 'o']);
  });

  it('preserves punctuation and whitespace', () => {
    const parts = segmentText('Hello, world!', 'medium');
    expect(parts.map((part) => part.text).join('')).toBe('Hello, world!');
    expect(parts.filter((part) => part.emphasized).map((part) => part.text)).toEqual([
      'Hel',
      'wor',
    ]);
  });

  it('handles RTL and combining graphemes without corrupting text', () => {
    for (const value of ['مطالعه سریع', 'خواندن بهتر', 'e\u0301lan']) {
      expect(
        segmentText(value, 'medium')
          .map((part) => part.text)
          .join(''),
      ).toBe(value);
    }
  });
});
