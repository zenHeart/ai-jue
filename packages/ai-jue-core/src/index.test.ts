import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deepMerge, generateMarkdownFile, generateJsonFile } from './index';
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
      'Before\n<!-- AI-JUE:START -->\nNew\n<!-- AI-JUE:END -->\nAfter'
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
