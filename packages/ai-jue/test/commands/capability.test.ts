import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { runCapabilityUpdate } from '../../src/commands/capability';
import { initI18n } from '../../src/i18n';

const tempDirs: string[] = [];
const originalCwd = process.cwd();

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-capability-update-'));
  tempDirs.push(dir);
  return dir;
}

function writeProject(root: string): void {
  fs.mkdirSync(path.join(root, 'capabilities', 'local-skill'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'capabilities', 'local-skill', 'SKILL.md'),
    '---\nname: local-skill\ndescription: Neutral fixture\n---\nLocal skill body.',
  );
  fs.writeFileSync(
    path.join(root, 'ai.config.json'),
    JSON.stringify({
      presets: ['base'],
      capabilities: {
        local: { source: 'file:./capabilities/local-skill', type: 'skill' },
        remote: {
          source: 'github:example/neutral-repo',
          ref: 'v1.0.0',
          path: 'skill',
          type: 'skill',
        },
      },
    }),
  );
}

function githubArchiveFetch(root: string) {
  const archiveRoot = path.join(root, 'archive', 'neutral-repo-v1', 'skill');
  fs.mkdirSync(archiveRoot, { recursive: true });
  fs.writeFileSync(
    path.join(archiveRoot, 'SKILL.md'),
    '---\nname: remote-skill\ndescription: Neutral fixture\n---\nRemote skill body.',
  );
  const archivePath = path.join(root, 'fixture.tgz');
  const { execFileSync } = require('child_process');
  execFileSync('tar', [
    '-czf',
    archivePath,
    '-C',
    path.join(root, 'archive'),
    'neutral-repo-v1',
  ]);
  const archive = fs.readFileSync(archivePath);
  return vi.fn(async () =>
    new Response(archive, { status: 200, headers: { 'content-type': 'application/gzip' } }),
  );
}

beforeAll(async () => {
  await initI18n('en');
});

afterEach(() => {
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('capability update command', () => {
  it('updates all ai.capabilities references and writes ai-jue.lock', async () => {
    const root = tempDir();
    writeProject(root);
    const fetchSpy = githubArchiveFetch(root);
    process.chdir(root);

    const result = await runCapabilityUpdate(undefined, {
      cacheDir: path.join(root, 'cache'),
      fetch: fetchSpy as unknown as typeof fetch,
    });

    expect(result.updated.sort()).toEqual(['local', 'remote']);
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'ai-jue.lock'), 'utf8'));
    expect(Object.keys(lock.capabilities).sort()).toEqual(['local', 'remote']);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  }, 30_000);

  it('scopes forced re-resolution to a single named Capability', async () => {
    const root = tempDir();
    writeProject(root);
    const fetchSpy = githubArchiveFetch(root);
    process.chdir(root);
    const cacheDir = path.join(root, 'cache');

    await runCapabilityUpdate(undefined, { cacheDir, fetch: fetchSpy as unknown as typeof fetch });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const result = await runCapabilityUpdate('remote', {
      cacheDir,
      fetch: fetchSpy as unknown as typeof fetch,
    });

    expect(result.updated).toEqual(['remote']);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'ai-jue.lock'), 'utf8'));
    expect(Object.keys(lock.capabilities).sort()).toEqual(['local', 'remote']);
  }, 30_000);

  it('rejects an unknown Capability name', async () => {
    const root = tempDir();
    writeProject(root);
    const fetchSpy = githubArchiveFetch(root);
    process.chdir(root);

    await expect(
      runCapabilityUpdate('does-not-exist', {
        cacheDir: path.join(root, 'cache'),
        fetch: fetchSpy as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/Unknown Capability/);
  }, 30_000);

  it('is a graceful no-op when no ai.capabilities are declared', async () => {
    const root = tempDir();
    fs.writeFileSync(
      path.join(root, 'ai.config.json'),
      JSON.stringify({ presets: ['base'] }),
    );
    process.chdir(root);

    const result = await runCapabilityUpdate(undefined, {
      cacheDir: path.join(root, 'cache'),
    });

    expect(result.updated).toEqual([]);
    expect(fs.existsSync(path.join(root, 'ai-jue.lock'))).toBe(false);
  }, 30_000);
});
