import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureDir, writeSupportFiles, writeTextFile } from '../src/file-io';
import fs from 'fs';

vi.mock('fs');

describe('file-io', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (fs.existsSync as any).mockReturnValue(false);
    (fs.mkdirSync as any).mockImplementation(() => {});
    (fs.writeFileSync as any).mockImplementation(() => {});
    (fs.readFileSync as any).mockImplementation(() => '');
  });

  it('exposes ensureDir as a standalone helper', () => {
    ensureDir('/test/path');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/path', { recursive: true });
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

  it('writes nested binary support files', () => {
    writeSupportFiles('/test/output/assets', {
      'fixtures/sample.bin': {
        content: Buffer.from([0, 255, 10, 128]).toString('base64'),
        encoding: 'base64',
      },
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output/assets/fixtures', {
      recursive: true,
    });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/assets/fixtures/sample.bin',
      Buffer.from([0, 255, 10, 128]),
    );
  });

  it('rejects support file paths outside the capability directory', () => {
    expect(() =>
      writeSupportFiles('/test/output/assets', { '../secret': 'nope' }),
    ).toThrow('Support file path must stay inside its asset directory');
  });
});
