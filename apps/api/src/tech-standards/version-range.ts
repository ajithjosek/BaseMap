/**
 * Sprint 38 — version range matching for technology standards.
 * Supports ranges like ">=18", ">17.2", "<=16.0", "<15", "=18.1", "17.0-18.5",
 * "*" or undefined (any version).
 */

function segs(v: string | undefined | null): number[] {
  return String(v || '')
    .trim()
    .replace(/[vVrR]/, '')
    .split('.')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n));
}

function cmp(a: string | undefined | null, b: string): number {
  const sa = segs(a);
  const sb = segs(b);
  const len = Math.max(sa.length, sb.length, 1);
  for (let i = 0; i < len; i++) {
    const x = sa[i] ?? 0;
    const y = sb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export function versionAllowed(
  version: string | undefined | null,
  range: string | undefined | null,
): boolean {
  if (!range || range.trim() === '*' || range.trim() === '') return true;
  const r = range.trim();

  const m = r.match(
    /^([<>]?=?).*?\s*([0-9]+(?:\.[0-9]+){0,3})(?:\s*-\s*([0-9]+(?:\.[0-9]+){0,3}))?$/,
  );
  if (!m) return true; // unknown range format -> don't block

  const low = m[2];
  const high = m[3];
  const op = (m[1] || '').trim();

  if (high) {
    // X - Y envelope
    return cmp(version, low) >= 0 && cmp(version, high) <= 0;
  }
  switch (op) {
    case '>':
      return cmp(version, low) > 0;
    case '>=':
      return cmp(version, low) >= 0;
    case '<':
      return cmp(version, low) < 0;
    case '<=':
      return cmp(version, low) <= 0;
    case '=':
    case '':
      return cmp(version, low) === 0;
    default:
      return true;
  }
}

/** Whether a bare version string equals the constraint's minimum (for eq). */
export function normalizedVersion(version?: string | null): string {
  return String(version || '')
    .trim()
    .replace(/^[vVrR]/, '');
}
