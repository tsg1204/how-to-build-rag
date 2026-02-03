/**
 * Shared URL helpers. Used by answer (citation dedupe) and ingest (URL normalization).
 */

/**
 * Normalize URL for dedupe/comparison: strip hash, normalize trailing slash.
 * Returns '' for null/undefined; on parse error returns input with trailing slashes stripped.
 */
export function canonicalUrl(u?: string | null): string {
  if (!u) return '';
  try {
    const url = new URL(u);
    url.hash = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return u.replace(/\/+$/, '');
  }
}
