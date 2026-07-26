import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeManagedMarkdown,
  computeMergedJson,
  deepMerge,
  extractManagedContent,
  generateMarkdownFile,
  generateJsonFile,
} from '../src/merge-strategies';
import fs from 'fs';

vi.mock('fs');

describe('deepMerge', () => {
  it('should merge two objects deeply', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  it('should overwrite non-object values', () => {
    const target = { a: 1 };
    const source = { a: 2 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 2 });
  });

  it('should handle arrays by replacing them (as per current implementation)', () => {
    const target = { a: [1, 2] };
    const source = { a: [3, 4] };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: [3, 4] });
  });
});

describe('computeManagedMarkdown', () => {
  it('produces a fresh managed block when there is no existing content', () => {
    expect(computeManagedMarkdown(undefined, 'content')).toBe(
      '<!-- AI-JUE:START -->\ncontent\n<!-- AI-JUE:END -->',
    );
  });

  it('preserves user content and replaces only the managed block', () => {
    expect(
      computeManagedMarkdown(
        'Before\n<!-- AI-JUE:START -->\nOld\n<!-- AI-JUE:END -->\nAfter',
        'New',
      ),
    ).toBe('Before\nAfter\n\n<!-- AI-JUE:START -->\nNew\n<!-- AI-JUE:END -->');
  });

  it('matches what generateMarkdownFile actually writes to disk', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('User Notes' as any);
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    generateMarkdownFile('/test/file.md', 'New');

    const computed = computeManagedMarkdown('User Notes', 'New');
    expect(writeSpy).toHaveBeenCalledWith('/test/file.md', computed);
    vi.restoreAllMocks();
  });
});

describe('extractManagedContent', () => {
  it('returns the content between AI-JUE:START/END when a managed block exists', () => {
    expect(
      extractManagedContent('User notes.\n\n<!-- AI-JUE:START -->\nManaged text.\n<!-- AI-JUE:END -->'),
    ).toBe('Managed text.');
  });

  it('returns the whole trimmed content when there is no managed block yet', () => {
    expect(extractManagedContent('  Plain native content.  ')).toBe('Plain native content.');
  });

  it('round-trips with computeManagedMarkdown: extract(compute(undefined, x)) === x', () => {
    const written = computeManagedMarkdown(undefined, 'Some value.');
    expect(extractManagedContent(written)).toBe('Some value.');
  });
});

describe('computeMergedJson', () => {
  it('returns content unchanged when there is no existing content', () => {
    expect(computeMergedJson(undefined, { a: 1 })).toEqual({ a: 1 });
  });

  it('deep merges into existing content without mutating the input', () => {
    const existing = { a: 1, nested: { b: 2 } };
    const result = computeMergedJson(existing, { nested: { c: 3 } });
    expect(result).toEqual({ a: 1, nested: { b: 2, c: 3 } });
    expect(existing).toEqual({ a: 1, nested: { b: 2 } });
  });

  it('matches what generateJsonFile actually writes to disk', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ b: 2 }) as any);
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    generateJsonFile('/test/file.json', { a: 1 });

    const computed = computeMergedJson({ b: 2 }, { a: 1 });
    expect(writeSpy).toHaveBeenCalledWith('/test/file.json', JSON.stringify(computed, null, 2));
    vi.restoreAllMocks();
  });
});

describe('generateMarkdownFile', () => {
  const filePath = '/test/file.md';

  beforeEach(() => {
    vi.resetAllMocks();
    (fs.existsSync as any).mockReturnValue(false);
    (fs.mkdirSync as any).mockImplementation(() => {});
    (fs.writeFileSync as any).mockImplementation(() => {});
  });

  it('should create new file with tags if not exists', () => {
    generateMarkdownFile(filePath, 'content');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      '<!-- AI-JUE:START -->\ncontent\n<!-- AI-JUE:END -->'
    );
  });

  it('should replace content between tags if file exists', () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(
      'Before\n<!-- AI-JUE:START -->\nOld\n<!-- AI-JUE:END -->\nAfter'
    );

    generateMarkdownFile(filePath, 'New');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      'Before\nAfter\n\n<!-- AI-JUE:START -->\nNew\n<!-- AI-JUE:END -->'
    );
  });

  it('should collapse duplicated managed blocks into one block', () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(
      '<!-- AI-JUE:START -->\nA\n<!-- AI-JUE:END -->\n\nUser Notes\n\n<!-- AI-JUE:START -->\nB\n<!-- AI-JUE:END -->'
    );

    generateMarkdownFile(filePath, 'New');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      'User Notes\n\n<!-- AI-JUE:START -->\nNew\n<!-- AI-JUE:END -->'
    );
  });

  it('should remove orphan tags and keep a single managed block', () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(
      'User Header\n\n<!-- AI-JUE:END -->\n\n<!-- AI-JUE:START -->\nOld\n<!-- AI-JUE:END -->\n'
    );

    generateMarkdownFile(filePath, 'New');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      'User Header\n\n<!-- AI-JUE:START -->\nNew\n<!-- AI-JUE:END -->'
    );
  });
});

describe('generateJsonFile', () => {
  const filePath = '/test/file.json';

  beforeEach(() => {
    vi.resetAllMocks();
    (fs.existsSync as any).mockReturnValue(false);
    (fs.mkdirSync as any).mockImplementation(() => {});
    (fs.writeFileSync as any).mockImplementation(() => {});
  });

  it('should create new json file if not exists', () => {
    generateJsonFile(filePath, { a: 1 });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      JSON.stringify({ a: 1 }, null, 2)
    );
  });

  it('should merge with existing json file', () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({ b: 2 }));

    generateJsonFile(filePath, { a: 1 });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      JSON.stringify({ b: 2, a: 1 }, null, 2)
    );
  });

  it('should overwrite if existing json is invalid (with warning)', () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue('invalid json');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    generateJsonFile(filePath, { a: 1 });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      JSON.stringify({ a: 1 }, null, 2)
    );
    expect(consoleSpy).toHaveBeenCalled();
  });
});
