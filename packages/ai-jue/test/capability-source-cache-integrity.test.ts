import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-cache-integrity-'));
  tempDirs.push(dir);
  return dir;
}

function writeGithubArchiveFixture(root: string): { archive: Buffer } {
  const archiveRoot = path.join(root, 'archive', 'neutral-repo-v1', 'skill');
  fs.mkdirSync(path.join(archiveRoot, 'references'), { recursive: true });
  fs.writeFileSync(
    path.join(archiveRoot, 'SKILL.md'),
    '---\nname: neutral-skill\ndescription: fixture\n---\nComplete skill body.',
  );
  fs.writeFileSync(
    path.join(archiveRoot, 'references', 'note.md'),
    'Complete reference body.',
  );
  const archivePath = path.join(root, 'fixture.tgz');
  execFileSync('tar', [
    '-czf',
    archivePath,
    '-C',
    path.join(root, 'archive'),
    'neutral-repo-v1',
  ]);
  return { archive: fs.readFileSync(archivePath) };
}

afterEach(() => {
  vi.doUnmock('child_process');
  vi.resetModules();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Capability Source cache integrity', () => {
  it('never leaves a partially extracted destination when the tar extraction step is interrupted', async () => {
    const root = tempDir();
    const { archive } = writeGithubArchiveFixture(root);
    const cacheDir = path.join(root, 'cache');
    const ref = {
      source: 'github:example/neutral-repo',
      ref: 'v1.0.0',
      path: 'skill',
      type: 'skill' as const,
    };

    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      return {
        ...actual,
        spawnSync: vi.fn((cmd: string, args: string[], opts: unknown) => {
          if (cmd === 'tar' && args.includes('-xzf')) {
            // Simulate a `tar -xzf` process killed mid-extraction (Ctrl-C, CI
            // timeout, OOM): a real interrupted tar typically has already
            // written some, but not all, of the archive's files before dying.
            const targetDir = args[args.indexOf('-C') + 1];
            fs.mkdirSync(path.join(targetDir, 'neutral-repo-v1', 'skill'), { recursive: true });
            fs.writeFileSync(
              path.join(targetDir, 'neutral-repo-v1', 'skill', 'SKILL.md'),
              'TRUNCATED-PARTIAL-WRITE',
            );
            return { status: 1, stdout: '', stderr: 'simulated interrupted extraction', pid: 0, output: [], signal: null };
          }
          return actual.spawnSync(cmd, args, opts as never);
        }),
      };
    });
    vi.resetModules();
    const { loadCapabilityRefs } = await import('../src/capability-source');

    const mockFetch = async () =>
      new Response(archive, { status: 200, headers: { 'content-type': 'application/gzip' } });

    await expect(
      loadCapabilityRefs({ 'neutral-skill': ref }, root, undefined, {
        cacheDir,
        fetch: mockFetch as unknown as typeof fetch,
      }),
    ).rejects.toThrow();

    const destination = path.join(
      cacheDir,
      'github',
      // same content-address formula used internally: sha256(source\0ref\0path)
      require('crypto')
        .createHash('sha256')
        .update(`${ref.source}\0${ref.ref}\0${ref.path}`)
        .digest('hex'),
    );
    const unpackedDir = path.join(destination, 'unpacked');
    expect(fs.existsSync(unpackedDir) && fs.readdirSync(unpackedDir).length > 0).toBe(false);
  }, 60_000);

  it('recovers with a fresh fetch after a previous run was interrupted mid-extraction', async () => {
    const root = tempDir();
    const { archive } = writeGithubArchiveFixture(root);
    const cacheDir = path.join(root, 'cache');
    const ref = {
      source: 'github:example/neutral-repo',
      ref: 'v1.0.0',
      path: 'skill',
      type: 'skill' as const,
    };
    const mockFetch = vi.fn(async () =>
      new Response(archive, { status: 200, headers: { 'content-type': 'application/gzip' } }),
    );

    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      let interruptNextExtraction = true;
      return {
        ...actual,
        spawnSync: vi.fn((cmd: string, args: string[], opts: unknown) => {
          if (cmd === 'tar' && args.includes('-xzf') && interruptNextExtraction) {
            interruptNextExtraction = false;
            const targetDir = args[args.indexOf('-C') + 1];
            fs.mkdirSync(path.join(targetDir, 'neutral-repo-v1', 'skill'), { recursive: true });
            fs.writeFileSync(
              path.join(targetDir, 'neutral-repo-v1', 'skill', 'SKILL.md'),
              'TRUNCATED-PARTIAL-WRITE',
            );
            return { status: 1, stdout: '', stderr: 'simulated interrupted extraction', pid: 0, output: [], signal: null };
          }
          return actual.spawnSync(cmd, args, opts as never);
        }),
      };
    });
    vi.resetModules();
    const { loadCapabilityRefs } = await import('../src/capability-source');

    await expect(
      loadCapabilityRefs({ 'neutral-skill': ref }, root, undefined, {
        cacheDir,
        fetch: mockFetch as unknown as typeof fetch,
      }),
    ).rejects.toThrow();

    // A second, later run (this is the realistic "user just retries") must not
    // trust the debris from the interrupted attempt; it must fetch again and
    // succeed with complete content.
    const result = await loadCapabilityRefs({ 'neutral-skill': ref }, root, undefined, {
      cacheDir,
      fetch: mockFetch as unknown as typeof fetch,
    });

    expect(result.config.skills?.['neutral-skill']?.content).toContain('Complete skill body');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  }, 60_000);
});
