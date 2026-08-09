import type { Intensity } from './types';

const RATIOS: Record<Intensity, number> = {
  light: 0.35,
  medium: 0.5,
  strong: 0.65,
};

export interface WordPart {
  text: string;
  emphasized: boolean;
}

function segmentGraphemes(value: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(
      new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
      (item) => item.segment,
    );
  }
  return Array.from(value);
}

export function emphasisLength(word: string, intensity: Intensity): number {
  const graphemes = segmentGraphemes(word);
  if (graphemes.length <= 1) return 0;
  return Math.min(
    graphemes.length - 1,
    Math.max(1, Math.ceil(graphemes.length * RATIOS[intensity])),
  );
}

export function splitWord(word: string, intensity: Intensity): [string, string] {
  const graphemes = segmentGraphemes(word);
  const length = emphasisLength(word, intensity);
  return [graphemes.slice(0, length).join(''), graphemes.slice(length).join('')];
}

export function segmentText(value: string, intensity: Intensity): WordPart[] {
  if (typeof Intl.Segmenter !== 'function') {
    return value.split(/([\p{L}\p{N}\p{M}]+)/gu).flatMap((part) => {
      if (!/[\p{L}\p{N}]/u.test(part)) return [{ text: part, emphasized: false }];
      const [head, tail] = splitWord(part, intensity);
      return [
        ...(head ? [{ text: head, emphasized: true }] : []),
        ...(tail ? [{ text: tail, emphasized: false }] : []),
      ];
    });
  }

  const words = new Intl.Segmenter(undefined, { granularity: 'word' }).segment(value);
  const result: WordPart[] = [];
  for (const item of words) {
    if (!item.isWordLike) {
      result.push({ text: item.segment, emphasized: false });
      continue;
    }
    const [head, tail] = splitWord(item.segment, intensity);
    if (head) result.push({ text: head, emphasized: true });
    if (tail) result.push({ text: tail, emphasized: false });
  }
  return result;
}
