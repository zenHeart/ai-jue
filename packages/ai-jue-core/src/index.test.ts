import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  deepMerge,
  ensureDir,
  generateMarkdownFile,
  generateJsonFile,
  getAssetText,
  getRecordEntries,
  renderBulletSection,
  renderMarkdownWithFrontmatter,
  writeSupportFiles,
  writeTextFile,
} from './index';
import fs from 'fs';
import path from 'path';

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

vi.mock('fs');

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

describe('adapter helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (fs.existsSync as any).mockReturnValue(false);
    (fs.mkdirSync as any).mockImplementation(() => {});
    (fs.writeFileSync as any).mockImplementation(() => {});
    (fs.readFileSync as any).mockImplementation(() => '');
  });

  it('ensures directories and writes plain text files', () => {
    writeTextFile('/test/output/file.md', 'hello');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output', { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith('/test/output/file.md', 'hello', 'utf8');
  });

  it('writes support files into a subdirectory', () => {
    writeSupportFiles('/test/output/references', { 'README.md': 'ref' });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output/references', { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith('/test/output/references/README.md', 'ref', 'utf8');
  });

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

  it('exposes ensureDir as a standalone helper', () => {
    ensureDir('/test/path');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/path', { recursive: true });
  });
});
