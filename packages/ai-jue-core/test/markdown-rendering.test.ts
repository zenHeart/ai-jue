import { describe, it, expect } from 'vitest';
import {
  getAssetText,
  getRecordEntries,
  renderBulletSection,
  renderMarkdownWithFrontmatter,
} from '../src/markdown-rendering';

describe('markdown-rendering', () => {
  it('selects canonical asset text from content or prompt', () => {
    expect(getAssetText({ content: 'body' })).toBe('body');
    expect(getAssetText({ prompt: 'fallback' })).toBe('fallback');
    expect(getAssetText('raw text')).toBe('raw text');
  });

  it('returns filtered record entries only for objects', () => {
    expect(getRecordEntries({ a: 1 })).toEqual([['a', 1]]);
    expect(getRecordEntries(null)).toEqual([]);
    expect(getRecordEntries(undefined)).toEqual([]);
  });

  it('renders markdown with frontmatter and reusable bullet sections', () => {
    expect(renderMarkdownWithFrontmatter('name: test', 'Body')).toBe('---\nname: test\n---\n\nBody');
    expect(renderBulletSection('Notes', 'Intro', ['One', 'Two'])).toContain('## Notes');
    expect(renderBulletSection('Notes', 'Intro', ['One', 'Two'])).toContain('- One');
  });
});
