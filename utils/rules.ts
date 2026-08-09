import { normalizePath, pathMatches } from './path';
import { createTarget, resolveTarget } from './selector';
import { saveRule } from './storage';
import type { ElementTarget, PathRule, RuleSaveResult } from './types';

export function matchingRules(rules: PathRule[], location: Location): PathRule[] {
  return rules.filter(
    (rule) =>
      rule.enabled &&
      rule.origin === location.origin &&
      pathMatches(location.pathname, rule.pathGlob),
  );
}

function targetContains(target: ElementTarget, element: Element): boolean {
  return resolveTarget(target)?.contains(element) ?? false;
}

export async function addElementToRules(
  element: Element,
  rules: PathRule[],
  location: Location,
): Promise<RuleSaveResult | null> {
  const exactPath = normalizePath(location.pathname);
  let rule = rules.find((item) => item.origin === location.origin && item.pathGlob === exactPath);
  const now = Date.now();

  if (!rule) {
    rule = {
      id: crypto.randomUUID(),
      origin: location.origin,
      pathGlob: exactPath,
      enabled: true,
      targets: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  if (rule.targets.some((target) => targetContains(target, element))) return null;

  const retainedTargets = rule.targets.filter((target) => {
    const existing = resolveTarget(target);
    return !existing || !element.contains(existing);
  });
  const target = createTarget(element);
  const updated: PathRule = {
    ...rule,
    targets: [...retainedTargets, target],
    updatedAt: now,
  };
  await saveRule(updated);
  return { rule: updated, target };
}
