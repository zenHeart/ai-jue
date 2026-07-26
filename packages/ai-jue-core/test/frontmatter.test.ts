import { describe, expect, it } from 'vitest';
import { splitFrontmatter } from '../src/frontmatter';

describe('splitFrontmatter', () => {
  it('splits YAML frontmatter from the body', () => {
    const result = splitFrontmatter('---\nname: demo\n---\nBody text.\n');
    expect(result).toEqual({ frontmatterText: 'name: demo', body: 'Body text.\n' });
  });

  it('returns no frontmatter for content without a leading fence', () => {
    expect(splitFrontmatter('Just body text.')).toEqual({
      frontmatterText: null,
      body: 'Just body text.',
    });
  });

  it('returns no frontmatter when the closing fence is missing', () => {
    const raw = '---\nname: demo\nBody text without a closing fence.';
    expect(splitFrontmatter(raw)).toEqual({ frontmatterText: null, body: raw });
  });
});
