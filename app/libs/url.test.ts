import { canonicalUrl } from './url';

describe('canonicalUrl', () => {
  it('returns empty string for null/undefined', () => {
    expect(canonicalUrl(null)).toBe('');
    expect(canonicalUrl(undefined)).toBe('');
  });

  it('strips hash from URL', () => {
    expect(canonicalUrl('https://example.com/article#section')).toBe(
      'https://example.com/article',
    );
  });

  it('normalizes trailing slash on pathname', () => {
    expect(canonicalUrl('https://example.com/article/')).toBe(
      'https://example.com/article',
    );
    expect(canonicalUrl('https://example.com/')).toBe('https://example.com/');
  });

  it('strips hash and trailing slash together', () => {
    expect(canonicalUrl('https://qdrant.tech/articles/rag/#intro')).toBe(
      'https://qdrant.tech/articles/rag',
    );
  });

  it('returns input with trailing slash stripped on parse error', () => {
    expect(canonicalUrl('not-a-url')).toBe('not-a-url');
    expect(canonicalUrl('still-not-a-url///')).toBe('still-not-a-url');
  });
});
