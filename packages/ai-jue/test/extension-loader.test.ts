import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadExtensionAdapterGuarded,
  loadExtensionGuarded,
  resolveExtensionPackage,
} from '../src/extension-loader';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-extension-loader-'));
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
        hooks: 'supported',
        mcp: 'unsupported',
      },
      read: async () => ({}),
      write: async () => [],
      confirm: async () => ({ target: 'neutral-agent', status: 'unconfirmed' }),
    },
  ],
};
`;

function writeExtensionPackage(
  root: string,
  options: { entryContent: string; peerDependencies?: Record<string, string> },
): void {
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'jue-extension-neutral',
        version: '1.0.0',
        main: 'index.js',
        peerDependencies: options.peerDependencies ?? { 'ai-jue-core': '^1.0.0' },
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(root, 'index.js'), options.entryContent);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('resolveExtensionPackage', () => {
  it('reports no issues for a well-formed package', () => {
    const root = tempDir();
    writeExtensionPackage(root, { entryContent: NEUTRAL_DEFINITION });

    const resolved = resolveExtensionPackage(root, root);

    expect(resolved.issues).toEqual([]);
    expect(fs.realpathSync(resolved.entryPath)).toBe(fs.realpathSync(path.join(root, 'index.js')));
  });

  it('reports a missing peerDependencies["ai-jue-core"]', () => {
    const root = tempDir();
    writeExtensionPackage(root, { entryContent: NEUTRAL_DEFINITION, peerDependencies: {} });

    const resolved = resolveExtensionPackage(root, root);

    expect(resolved.issues).toEqual([
      expect.objectContaining({ code: 'missing-peer-dependency' }),
    ]);
  });

  it('reports a missing exports/main entry', () => {
    const root = tempDir();
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'jue-extension-neutral',
        version: '1.0.0',
        peerDependencies: { 'ai-jue-core': '^1.0.0' },
      }),
    );

    const resolved = resolveExtensionPackage(root, root);

    expect(resolved.issues).toEqual([
      expect.objectContaining({ code: 'missing-entry' }),
    ]);
  });

  it('reports a main entry that does not exist on disk', () => {
    const root = tempDir();
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'jue-extension-neutral',
        version: '1.0.0',
        main: 'missing.js',
        peerDependencies: { 'ai-jue-core': '^1.0.0' },
      }),
    );

    const resolved = resolveExtensionPackage(root, root);

    expect(resolved.issues).toEqual([
      expect.objectContaining({ code: 'missing-entry' }),
    ]);
  });
});

describe('loadExtensionGuarded', () => {
  it('loads a well-formed Extension definition', () => {
    const root = tempDir();
    writeExtensionPackage(root, { entryContent: NEUTRAL_DEFINITION });

    const definition = loadExtensionGuarded(path.join(root, 'index.js'));

    expect(definition.adapters).toHaveLength(1);
    expect(definition.adapters[0].id).toBe('neutral-agent');
  });

  it('blocks a filesystem write attempted during import and never creates the file', () => {
    const root = tempDir();
    const sideEffectPath = path.join(root, 'side-effect.txt');
    writeExtensionPackage(root, {
      entryContent: `
const fs = require('fs');
fs.writeFileSync(${JSON.stringify(sideEffectPath)}, 'should not exist');
${NEUTRAL_DEFINITION}
`,
    });

    expect(() => loadExtensionGuarded(path.join(root, 'index.js'))).toThrow(
      'disallowed side effect during import: writeFileSync',
    );
    expect(fs.existsSync(sideEffectPath)).toBe(false);
  });

  it('blocks a child process spawn attempted during import', () => {
    const root = tempDir();
    const markerPath = path.join(root, 'ran.txt');
    writeExtensionPackage(root, {
      entryContent: `
const { execSync } = require('child_process');
execSync('touch ' + ${JSON.stringify(markerPath)});
${NEUTRAL_DEFINITION}
`,
    });

    expect(() => loadExtensionGuarded(path.join(root, 'index.js'))).toThrow(
      'disallowed side effect during import: execSync',
    );
    expect(fs.existsSync(markerPath)).toBe(false);
  });

  it('rejects a malformed default export with a clear error', () => {
    const root = tempDir();
    writeExtensionPackage(root, { entryContent: 'module.exports.default = { adapters: [] };' });

    expect(() => loadExtensionGuarded(path.join(root, 'index.js'))).toThrow('non-empty array');
  });

  it('restores fs.writeFileSync after a guarded load, whether it threw or not', () => {
    const root = tempDir();
    writeExtensionPackage(root, { entryContent: NEUTRAL_DEFINITION });
    loadExtensionGuarded(path.join(root, 'index.js'));

    const proofPath = path.join(root, 'proof.txt');
    expect(() => fs.writeFileSync(proofPath, 'ok')).not.toThrow();
    expect(fs.readFileSync(proofPath, 'utf8')).toBe('ok');
  });
});

describe('loadExtensionAdapterGuarded', () => {
  it('returns the Adapter from the Extension default export', () => {
    const root = tempDir();
    writeExtensionPackage(root, { entryContent: NEUTRAL_DEFINITION });

    const adapter = loadExtensionAdapterGuarded(path.join(root, 'index.js'));

    expect(adapter.id).toBe('neutral-agent');
  });

  it('rejects a historical module-level write API without an Extension default export', () => {
    const root = tempDir();
    writeExtensionPackage(root, {
      entryContent: 'module.exports.write = async () => [];',
    });

    expect(() => loadExtensionAdapterGuarded(path.join(root, 'index.js'))).toThrow(
      'Extension default export',
    );
  });

  it('rejects an ambiguous multi-Adapter Extension for one apply target', () => {
    const root = tempDir();
    writeExtensionPackage(root, {
      entryContent: NEUTRAL_DEFINITION.replace(
        "id: 'neutral-agent',",
        "id: 'neutral-agent',",
      ).replace(
        '  ],\n};',
        `    {
      id: 'second-agent',
      capabilities: {
        rules: 'unsupported', commands: 'unsupported', skills: 'unsupported',
        agents: 'unsupported', hooks: 'unsupported', mcp: 'unsupported',
      },
      read: async () => ({}), write: async () => [],
      confirm: async () => ({ target: 'second-agent', status: 'unconfirmed' }),
    },
  ],
};`,
      ),
    });

    expect(() => loadExtensionAdapterGuarded(path.join(root, 'index.js'))).toThrow(
      'exactly one Adapter',
    );
  });

  it('reads scope capability only from the Adapter definition', () => {
    const root = tempDir();
    writeExtensionPackage(root, {
      entryContent: `${NEUTRAL_DEFINITION}\nmodule.exports.supportedScopes = ['project', 'user'];`,
    });

    const adapter = loadExtensionAdapterGuarded(path.join(root, 'index.js'));

    expect(adapter.supportedScopes).toBeUndefined();
  });
});
