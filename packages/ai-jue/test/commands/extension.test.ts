import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { runExtensionValidate } from '../../src/commands/extension';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-extension-command-'));
  tempDirs.push(dir);
  return dir;
}

const NEUTRAL_DEFINITION = `
module.exports.default = {
  adapters: [
    {
      id: 'neutral-agent',
      capabilities: {
        rules: 'supported',
        commands: 'supported',
        skills: 'supported',
        agents: 'supported',
        hooks: 'degraded',
        mcp: 'unsupported',
      },
      read: async () => ({}),
      write: async () => [],
      confirm: async () => ({ target: 'neutral-agent', status: 'unconfirmed' }),
    },
  ],
};
`;

function writeExtensionPackage(root: string, entryContent: string, peerDependencies: Record<string, string> = { 'ai-jue-core': '^1.0.0' }): void {
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'jue-extension-neutral', version: '1.0.0', main: 'index.js', peerDependencies }),
  );
  fs.writeFileSync(path.join(root, 'index.js'), entryContent);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('runExtensionValidate', () => {
  it('validates package metadata without loading the entry by default', () => {
    const root = tempDir();
    const sideEffectPath = path.join(root, 'should-not-exist.txt');
    writeExtensionPackage(
      root,
      `require('fs').writeFileSync(${JSON.stringify(sideEffectPath)}, 'ran'); ${NEUTRAL_DEFINITION}`,
    );

    const result = runExtensionValidate(root, { cwd: root });

    expect(result.issues).toEqual([]);
    expect(result.loaded).toBe(false);
    expect(result.adapterIds).toEqual([]);
    expect(fs.existsSync(sideEffectPath)).toBe(false);
  });

  it('reports missing peerDependencies as an issue and skips loading', () => {
    const root = tempDir();
    writeExtensionPackage(root, NEUTRAL_DEFINITION, {});

    const result = runExtensionValidate(root, { cwd: root, load: true });

    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'missing-peer-dependency' }),
    ]);
    expect(result.loaded).toBe(false);
  });

  it('loads the Extension and returns Adapter ids with --load', () => {
    const root = tempDir();
    writeExtensionPackage(root, NEUTRAL_DEFINITION);

    const result = runExtensionValidate(root, { cwd: root, load: true });

    expect(result.issues).toEqual([]);
    expect(result.loaded).toBe(true);
    expect(result.adapterIds).toEqual(['neutral-agent']);
  });

  it('surfaces a guarded side-effect violation as a thrown error with --load', () => {
    const root = tempDir();
    writeExtensionPackage(
      root,
      `require('child_process').execSync('echo hacked'); ${NEUTRAL_DEFINITION}`,
    );

    expect(() => runExtensionValidate(root, { cwd: root, load: true })).toThrow(
      'disallowed side effect during import: execSync',
    );
  });
});
