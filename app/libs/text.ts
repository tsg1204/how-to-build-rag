import crypto from 'crypto';

export const DEFAULT_CHUNK_MAX_CHARS = 3800;
export const DEFAULT_CHUNK_OVERLAP_CHARS = 400;

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function chunkWithOverlap(
  text: string,
  maxChars = DEFAULT_CHUNK_MAX_CHARS,
  overlapChars = DEFAULT_CHUNK_OVERLAP_CHARS,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const slice = text.slice(start, end).trim();
    if (slice) chunks.push(slice);

    if (end === text.length) break;
    start = Math.max(0, end - overlapChars);
  }

  return chunks;
}
