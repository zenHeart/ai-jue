import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadCapabilityRefs } from '../src/capability-source';
import { loadPreset } from '../src/preset';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-installed-npm-'));
  tempDirs.push(dir);
  return dir;
}

function writeSkill(root: string, body = 'Use the installed npm skill.'): Buffer {
  fs.mkdirSync(path.join(root, 'references', 'nested'), { recursive: true });
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'SKILL.md'),
    '---\nname: shared-skill\ndescription: Neutral installed skill\n---\n' + body,
  );
  fs.writeFileSync(path.join(root, 'references', 'nested', '说明.md'), 'Neutral reference');
  const binary = Buffer.from([0, 255, 128, 10]);
  fs.writeFileSync(path.join(root, 'assets', 'sample.bin'), binary);
  return binary;
}

function writeCapabilityPackage(packageDir: string, version = '1.0.0'): Buffer {
  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({
      name: 'jue-capability-neutral-root',
      version,
    }),
  );
  return writeSkill(path.join(packageDir, 'skills', 'shared-skill'));
}

function capabilityRef() {
  return {
    'shared-skill': {
      source: 'npm:jue-capability-neutral-root@1.0.0',
      path: 'skills/shared-skill',
      type: 'skill' as const,
    },
  };
}

function writeDeclaringPreset(presetDir: string, dependencySpec = '1.0.0'): void {
  fs.mkdirSync(presetDir, { recursive: true });
  fs.writeFileSync(
    path.join(presetDir, 'package.json'),
    JSON.stringify({
      name: 'jue-preset-declaring',
      version: '1.0.0',
      dependencies: {
        'jue-capability-neutral-root': dependencySpec,
      },
      ai: {
        capabilities: capabilityRef(),
      },
    }),
  );
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('installed npm Capability resolution from the declaring Preset', () => {
  it('reuses a nested installed direct dependency without npm pack', async () => {
    const root = tempDir();
    const presetDir = path.join(root, 'preset');
    writeDeclaringPreset(presetDir);
    const binary = writeCapabilityPackage(
      path.join(presetDir, 'node_modules', 'jue-capability-neutral-root'),
    );

    const result = await loadCapabilityRefs(capabilityRef(), presetDir, undefined, {
      cacheDir: path.join(root, 'cache'),
      readOnly: true,
    });

    expect(result.config.skills?.['shared-skill']?.description).toBe('Neutral installed skill');
    expect(result.config.skills?.['shared-skill']?.references?.['nested/说明.md']).toBe(
      'Neutral reference',
    );
    expect(result.config.skills?.['shared-skill']?.assets?.['sample.bin']).toEqual({
      content: binary.toString('base64'),
      encoding: 'base64',
    });
    expect(fs.existsSync(path.join(root, 'cache'))).toBe(false);
  });

  it('reuses a hoisted installed direct dependency', async () => {
    const root = tempDir();
    const consumer = path.join(root, 'consumer');
    const presetDir = path.join(consumer, 'node_modules', 'jue-preset-declaring');
    writeDeclaringPreset(presetDir);
    writeCapabilityPackage(path.join(consumer, 'node_modules', 'jue-capability-neutral-root'));

    const result = await loadCapabilityRefs(capabilityRef(), presetDir, undefined, {
      cacheDir: path.join(root, 'cache'),
      readOnly: true,
    });

    expect(result.config.skills?.['shared-skill']?.content).toContain('Use the installed npm skill.');
  });

  it('reuses a source-workspace file: dependency via Node resolution', async () => {
    const root = tempDir();
    const capabilityDir = path.join(root, 'packages', 'capability');
    const presetDir = path.join(root, 'packages', 'preset');
    writeCapabilityPackage(capabilityDir);
    writeDeclaringPreset(presetDir, 'file:../capability');
    fs.mkdirSync(path.join(presetDir, 'node_modules'), { recursive: true });
    fs.symlinkSync(
      capabilityDir,
      path.join(presetDir, 'node_modules', 'jue-capability-neutral-root'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    const result = await loadCapabilityRefs(capabilityRef(), presetDir, undefined, {
      cacheDir: path.join(root, 'cache'),
      readOnly: true,
    });

    expect(result.config.skills?.['shared-skill']?.description).toBe('Neutral installed skill');
  });

  it('reuses a bundled offline dependency already present in the Preset tree', async () => {
    const root = tempDir();
    const presetDir = path.join(root, 'preset');
    fs.mkdirSync(presetDir, { recursive: true });
    fs.writeFileSync(
      path.join(presetDir, 'package.json'),
      JSON.stringify({
        name: 'jue-preset-declaring',
        version: '1.0.0',
        dependencies: {
          'jue-capability-neutral-root': '1.0.0',
        },
        bundleDependencies: ['jue-capability-neutral-root'],
        ai: { capabilities: capabilityRef() },
      }),
    );
    writeCapabilityPackage(path.join(presetDir, 'node_modules', 'jue-capability-neutral-root'));

    const result = await loadCapabilityRefs(capabilityRef(), presetDir, undefined, {
      cacheDir: path.join(root, 'cache'),
      readOnly: true,
    });

    expect(result.config.skills?.['shared-skill']).toBeDefined();
  });

  it('rejects an installed package whose version does not match the source', async () => {
    const root = tempDir();
    const presetDir = path.join(root, 'preset');
    writeDeclaringPreset(presetDir);
    writeCapabilityPackage(
      path.join(presetDir, 'node_modules', 'jue-capability-neutral-root'),
      '9.9.9',
    );

    await expect(
      loadCapabilityRefs(capabilityRef(), presetDir, undefined, {
        cacheDir: path.join(root, 'cache'),
      }),
    ).rejects.toThrow(/does not match/);
  });

  it('rejects a path that escapes the installed package', async () => {
    const root = tempDir();
    const presetDir = path.join(root, 'preset');
    writeDeclaringPreset(presetDir);
    writeCapabilityPackage(path.join(presetDir, 'node_modules', 'jue-capability-neutral-root'));

    await expect(
      loadCapabilityRefs(
        {
          'shared-skill': {
            source: 'npm:jue-capability-neutral-root@1.0.0',
            path: '../outside',
            type: 'skill',
          },
        },
        presetDir,
        undefined,
        { cacheDir: path.join(root, 'cache') },
      ),
    ).rejects.toThrow('must stay inside');
  });

  it('rejects a selected path that is a symlink leaving the package', async () => {
    const root = tempDir();
    const presetDir = path.join(root, 'preset');
    writeDeclaringPreset(presetDir);
    const packageDir = path.join(presetDir, 'node_modules', 'jue-capability-neutral-root');
    writeCapabilityPackage(packageDir);
    const escape = path.join(root, 'outside', 'escaped-skill');
    writeSkill(escape, 'Escaped body');
    fs.symlinkSync(
      escape,
      path.join(packageDir, 'skills', 'escaped'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    await expect(
      loadCapabilityRefs(
        {
          'shared-skill': {
            source: 'npm:jue-capability-neutral-root@1.0.0',
            path: 'skills/escaped',
            type: 'skill',
          },
        },
        presetDir,
        undefined,
        { cacheDir: path.join(root, 'cache') },
      ),
    ).rejects.toThrow('must stay inside');
  });

  it('resolves a nested Preset from the parent Preset, not only process cwd', async () => {
    const consumer = tempDir();
    const parentDir = path.join(consumer, 'node_modules', 'jue-preset-parent');
    const childDir = path.join(parentDir, 'node_modules', 'jue-preset-child');
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(
      path.join(parentDir, 'package.json'),
      JSON.stringify({
        name: 'jue-preset-parent',
        version: '1.0.0',
        ai: { presets: ['child'] },
      }),
    );
    writeDeclaringPreset(childDir);
    fs.writeFileSync(
      path.join(childDir, 'package.json'),
      JSON.stringify({
        name: 'jue-preset-child',
        version: '1.0.0',
        dependencies: {
          'jue-capability-neutral-root': '1.0.0',
        },
        ai: { capabilities: capabilityRef() },
      }),
    );
    writeCapabilityPackage(path.join(childDir, 'node_modules', 'jue-capability-neutral-root'));

    const originalCwd = process.cwd();
    process.chdir(consumer);
    try {
      const config = await loadPreset('parent', undefined, {
        cacheDir: path.join(consumer, 'cache'),
        readOnly: true,
      });
      expect(config.skills?.['shared-skill']?.description).toBe('Neutral installed skill');
    } finally {
      process.chdir(originalCwd);
    }
  });
});
