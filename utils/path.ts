export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

export function pathMatches(pathname: string, glob: string): boolean {
  const normalizedPath = normalizePath(pathname);
  const normalizedGlob = normalizePath(glob);
  const escaped = normalizedGlob.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const expression = `^${escaped.replace(/\*/g, '.*')}$`;
  return new RegExp(expression).test(normalizedPath);
}

export function validatePathGlob(value: string): string | null {
  if (!value.startsWith('/')) return 'Path patterns must start with /.';
  if (/[?#]/.test(value)) return 'Queries and fragments are not part of path patterns.';
  return null;
}

export function originPattern(origin: string): string {
  return `${origin}/*`;
}
