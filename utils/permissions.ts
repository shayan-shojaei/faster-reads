import { originPattern } from './path';
import type { PathRule } from './types';

export function senderMatchesOrigin(senderUrl: string | undefined, origin: string): boolean {
  try {
    const sender = new URL(senderUrl ?? '');
    const requested = new URL(origin);
    const supported = sender.protocol === 'http:' || sender.protocol === 'https:';
    return supported && sender.origin === requested.origin && requested.origin === origin;
  } catch {
    return false;
  }
}

export function desiredRuleOriginPatterns(
  rules: PathRule[],
  grantedOrigins: string[],
): Set<string> {
  const granted = new Set(grantedOrigins);
  return new Set(
    rules.map((rule) => originPattern(rule.origin)).filter((pattern) => granted.has(pattern)),
  );
}
