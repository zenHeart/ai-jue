import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  directoryPerItem,
  flatMarkdownDirectory,
  managedMarkdownFile,
  mergedJsonFile,
  readCapabilities,
  writeCapabilities,
} from '../src/capability-mapping';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-capability-mapping-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('flatMarkdownDirectory', () => {
  const mapping = flatMarkdownDirectory({
    dirPath: (root) => path.join(root, 'rules'),
    fieldRenames: { globs: 'paths' },
  });

  it('returns undefined for a directory that does not exist', () => {
    expect(mapping.read(tempDir())).toBeUndefined();
  });

  it('reads a flat .md file, applying the field rename', () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, 'rules'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'rules', 'style.md'),
      '---\ndescription: Neutral rule\npaths:\n  - "src/**/*.ts"\n---\nUse two spaces.',
    );

    expect(mapping.read(root)).toEqual({
      style: {
        description: 'Neutral rule',
        globs: ['src/**/*.ts'],
        content: 'Use two spaces.',
        prompt: 'Use two spaces.',
      },
    });
  });

  it('writes an ArtifactChange per entry with the rename inverted', () => {
    const root = tempDir();
    const changes = mapping.write(
      root,
      { style: { description: 'Neutral rule', globs: ['src/**/*.ts'], content: 'Use two spaces.' } },
      'neutral-agent',
    );

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      target: 'neutral-agent',
      kind: 'create',
      ownership: 'full',
      path: 'rules/style.md',
    });
    expect(changes[0].content).toContain('paths:');
    expect(changes[0].content).toContain('- src/**/*.ts');
    expect(changes[0].content).not.toContain('globs:');
  });

  it('round-trips: write then read produces the original value', () => {
    const root = tempDir();
    const original = { style: { description: 'Neutral rule', globs: ['src/**/*.ts'], content: 'Use two spaces.' } };
    const changes = mapping.write(root, original, 'neutral-agent');
    fs.mkdirSync(path.join(root, 'rules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'rules', 'style.md'), changes[0].content as string);

    expect(mapping.read(root)).toEqual({
      style: { ...original.style, prompt: 'Use two spaces.' },
    });
  });

  it('is idempotent: writing unchanged content produces no changes', () => {
    const root = tempDir();
    const value = { style: { description: 'Neutral rule', content: 'Use two spaces.' } };
    const first = mapping.write(root, value, 'neutral-agent');
    fs.mkdirSync(path.join(root, 'rules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'rules', 'style.md'), first[0].content as string);

    expect(mapping.write(root, value, 'neutral-agent')).toEqual([]);
  });
});

describe('directoryPerItem', () => {
  const mapping = directoryPerItem({
    dirPath: (root) => path.join(root, 'skills'),
    mainFileName: 'SKILL.md',
    bundleKeys: ['references'],
  });

  it('reads one directory per item', () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, 'skills', 'demo'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'skills', 'demo', 'SKILL.md'),
      '---\nname: demo\n---\nDo the thing.',
    );

    expect(mapping.read(root)).toEqual({
      demo: { name: 'demo', content: 'Do the thing.', prompt: 'Do the thing.' },
    });
  });

  it('rejects a bundle file path that escapes its item directory via traversal', () => {
    const root = tempDir();
    expect(() =>
      mapping.write(
        root,
        { demo: { content: 'Do the thing.', references: { '../../secret.md': 'nope' } } },
        'neutral-agent',
      ),
    ).toThrow('must stay inside');
  });

  it('writes the main file and bundle files as separate changes', () => {
    const root = tempDir();
    const changes = mapping.write(
      root,
      {
        demo: {
          name: 'demo',
          content: 'Do the thing.',
          references: { 'notes.md': 'Neutral reference.' },
        },
      },
      'neutral-agent',
    );

    const paths = changes.map((c) => c.path).sort();
    expect(paths).toEqual(['skills/demo/SKILL.md', 'skills/demo/references/notes.md']);
    expect(changes.find((c) => c.path === 'skills/demo/SKILL.md')?.content).not.toContain('references:');
  });

  it('round-trips including bundle files', () => {
    const root = tempDir();
    const original = {
      demo: { name: 'demo', content: 'Do the thing.', references: { 'notes.md': 'Neutral reference.' } },
    };
    const changes = mapping.write(root, original, 'neutral-agent');
    for (const change of changes) {
      const absolute = path.join(root, ...change.path.split('/'));
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      const content = change.content as string | { content: string; encoding: 'utf8' | 'base64' };
      fs.writeFileSync(absolute, typeof content === 'string' ? content : Buffer.from(content.content, content.encoding));
    }

    expect(mapping.read(root)).toEqual({
      demo: { name: 'demo', content: 'Do the thing.', prompt: 'Do the thing.' },
    });
  });
});

describe('managedMarkdownFile', () => {
  const mapping = managedMarkdownFile({ filePath: (root) => path.join(root, 'CLAUDE.md') });

  it('returns undefined when the file does not exist', () => {
    expect(mapping.read(tempDir())).toBeUndefined();
  });

  it('writes a fresh managed block when there is no existing file', () => {
    const root = tempDir();
    const changes = mapping.write(root, 'Neutral context.', 'neutral-agent');
    expect(changes).toHaveLength(1);
    expect(changes[0].kind).toBe('create');
    expect(changes[0].content).toBe('<!-- AI-JUE:START -->\nNeutral context.\n<!-- AI-JUE:END -->');
  });

  it('preserves existing user content outside the managed block', () => {
    const root = tempDir();
    fs.writeFileSync(
      path.join(root, 'CLAUDE.md'),
      'User notes.\n\n<!-- AI-JUE:START -->\nOld.\n<!-- AI-JUE:END -->',
    );

    const changes = mapping.write(root, 'New.', 'neutral-agent');
    expect(changes[0].content).toBe('User notes.\n\n<!-- AI-JUE:START -->\nNew.\n<!-- AI-JUE:END -->');
  });
});

describe('mergedJsonFile', () => {
  it('reads and writes a keyed value, preserving unrelated keys', () => {
    const mapping = mergedJsonFile<Record<string, unknown>>({
      filePath: (root) => path.join(root, 'settings.json'),
      key: 'hooks',
    });
    const root = tempDir();
    fs.writeFileSync(
      path.join(root, 'settings.json'),
      JSON.stringify({ hooks: { PreToolUse: 'existing' }, unrelated: true }, null, 2),
    );

    expect(mapping.read(root)).toEqual({ PreToolUse: 'existing' });

    const changes = mapping.write(root, { PostToolUse: 'new' }, 'neutral-agent');
    expect(changes).toHaveLength(1);
    expect(changes[0].ownership).toBe('merged-keys');
    const written = JSON.parse(changes[0].content as string);
    expect(written).toEqual({
      hooks: { PreToolUse: 'existing', PostToolUse: 'new' },
      unrelated: true,
    });
  });

  it('applies toCanonical/toNative transforms', () => {
    const mapping = mergedJsonFile<string>({
      filePath: (root) => path.join(root, 'mcp.json'),
      toCanonical: (native) => `canonical:${native.raw}`,
      toNative: (canonical) => ({ raw: canonical.replace('canonical:', '') }),
    });
    const root = tempDir();

    const changes = mapping.write(root, 'canonical:value', 'neutral-agent');
    fs.writeFileSync(path.join(root, 'mcp.json'), changes[0].content as string);

    expect(mapping.read(root)).toBe('canonical:value');
  });

  it('is a no-op when the merged result is unchanged', () => {
    const mapping = mergedJsonFile({ filePath: (root) => path.join(root, 'settings.json'), key: 'hooks' });
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'settings.json'), JSON.stringify({ hooks: { a: 1 } }, null, 2));

    expect(mapping.write(root, { a: 1 }, 'neutral-agent')).toEqual([]);
  });
});

describe('readCapabilities / writeCapabilities', () => {
  it('composes multiple mappings into one object / one change list', () => {
    const mappings = {
      rules: flatMarkdownDirectory({ dirPath: (root) => path.join(root, 'rules') }),
      context: managedMarkdownFile({ filePath: (root) => path.join(root, 'CLAUDE.md') }),
    };
    const root = tempDir();
    fs.mkdirSync(path.join(root, 'rules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'rules', 'style.md'), 'Neutral rule body.');
    fs.writeFileSync(path.join(root, 'CLAUDE.md'), '<!-- AI-JUE:START -->\nNeutral context.\n<!-- AI-JUE:END -->');

    const canonical = readCapabilities(mappings, root);
    expect(Object.keys(canonical).sort()).toEqual(['context', 'rules']);

    const changes = writeCapabilities(
      mappings,
      { rules: { style: { content: 'Updated body.' } } },
      root,
      'neutral-agent',
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].path).toBe('rules/style.md');
  });
});
