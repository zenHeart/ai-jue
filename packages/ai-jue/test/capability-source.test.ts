import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCapabilityRefs, capabilityCacheDestination } from '../src/capability-source';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-capability-source-'));
  tempDirs.push(dir);
  return dir;
}

function writeSkill(root: string, body = 'Use the neutral workflow.'): Buffer {
  fs.mkdirSync(path.join(root, 'references', 'nested'), { recursive: true });
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'SKILL.md'),
    '---\nname: neutral-skill\ndescription: Neutral fixture\n---\n' + body,
  );
  fs.writeFileSync(
    path.join(root, 'references', 'nested', '说明.md'),
    'Neutral reference',
  );
  const binary = Buffer.from([0, 255, 128, 10]);
  fs.writeFileSync(path.join(root, 'assets', 'sample.bin'), binary);
  return binary;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Capability Source', () => {
  it('loads a file: Agent Skill with nested UTF-8 and binary resources', async () => {
    const root = tempDir();
    const skillDir = path.join(root, 'capabilities', 'neutral-skill');
    const binary = writeSkill(skillDir);

    const result = await loadCapabilityRefs(
      {
        'neutral-skill': {
          source: 'file:./capabilities/neutral-skill',
          converter: 'agent-skill',
        },
      },
      root,
      'en',
      { cacheDir: path.join(root, 'cache') },
    );

    expect(result.config.skills?.['neutral-skill']?.content).toContain(
      'neutral workflow',
    );
    expect(
      result.config.skills?.['neutral-skill']?.references?.['nested/说明.md'],
    ).toBe('Neutral reference');
    expect(
      result.config.skills?.['neutral-skill']?.assets?.['sample.bin'],
    ).toEqual({
      content: binary.toString('base64'),
      encoding: 'base64',
    });
    expect(JSON.stringify(result.lock)).not.toContain(root);
  });

  it('records only redacted source metadata and hashes in the lock', async () => {
    const root = tempDir();
    const skillDir = path.join(root, 'capabilities', 'neutral-skill');
    writeSkill(skillDir);

    const result = await loadCapabilityRefs(
      {
        'neutral-skill': {
          source: 'file:./capabilities/neutral-skill',
          converter: 'agent-skill',
        },
      },
      root,
      'en',
      { cacheDir: path.join(root, 'cache') },
    );

    expect(result.lock.capabilities['neutral-skill']).toMatchObject({
      converter: 'agent-skill',
      sourceType: 'file',
    });
    expect(result.lock.capabilities['neutral-skill']).not.toHaveProperty('source');
    expect(result.lock.capabilities['neutral-skill']).not.toHaveProperty('path');
    expect(result.lock.capabilities['neutral-skill']).not.toHaveProperty('ref');
    // Must still not leak the resolved absolute filesystem path.
    expect(JSON.stringify(result.lock)).not.toContain(root);
  });

  it('loads npm: from a local tarball without executing package code', async () => {
    const root = tempDir();
    const packageDir = path.join(root, 'package');
    fs.mkdirSync(packageDir);
    fs.writeFileSync(
      path.join(packageDir, 'package.json'),
      JSON.stringify({
        name: 'neutral-mcp-fixture',
        version: '1.0.0',
        bin: { neutral: 'server.js' },
        scripts: { postinstall: 'node should-not-run.js' },
      }),
    );
    fs.writeFileSync(path.join(packageDir, 'server.js'), '');
    const packDir = path.join(root, 'packs');
    fs.mkdirSync(packDir);
    const archiveName = 'neutral-mcp-fixture-1.0.0.tgz';
    execFileSync('tar', [
      '-czf',
      path.join(packDir, archiveName),
      '-C',
      root,
      'package',
    ]);

    const result = await loadCapabilityRefs(
      {
        neutral: {
          source: `npm:file:${path.join(packDir, archiveName)}`,
          converter: 'mcp',
          config: { scope: 'project' },
        },
      },
      root,
      undefined,
      { cacheDir: path.join(root, 'cache') },
    );

    expect(result.config.mcp?.servers?.neutral).toEqual({
      command: 'npx',
      args: ['-y', 'neutral-mcp-fixture'],
      scope: 'project',
    });
  }, 30_000);

  it('resolves github: with a local mock archive and deterministic lock', async () => {
    const root = tempDir();
    const archiveRoot = path.join(root, 'archive', 'neutral-repo-main', 'skill');
    writeSkill(archiveRoot);
    const archivePath = path.join(root, 'fixture.tgz');
    execFileSync('tar', [
      '-czf',
      archivePath,
      '-C',
      path.join(root, 'archive'),
      'neutral-repo-main',
    ]);
    const archive = fs.readFileSync(archivePath);
    const mockFetch = async () =>
      new Response(archive, {
        status: 200,
        headers: { 'content-type': 'application/gzip' },
      });
    const refs = {
      'neutral-skill': {
        source: 'github:example/neutral-repo',
        ref: 'v1.0.0',
        path: 'skill',
        converter: 'agent-skill',
      },
    } as const;

    const first = await loadCapabilityRefs(refs, root, undefined, {
      cacheDir: path.join(root, 'cache-a'),
      fetch: mockFetch as typeof fetch,
      frozen: true,
    });
    const second = await loadCapabilityRefs(refs, root, undefined, {
      cacheDir: path.join(root, 'cache-b'),
      fetch: mockFetch as typeof fetch,
      frozen: true,
    });

    expect(first.lock).toEqual(second.lock);
    expect(first.config.skills?.['neutral-skill']).toBeDefined();
  }, 30_000);

  it.each([
    [
      'pending status',
      { source: 'file:./skill', converter: 'agent-skill', status: 'pending' },
      'not loadable',
    ],
    [
      'unknown converter',
      { source: 'file:./skill', converter: 'unknown' },
      'unknown converter',
    ],
    [
      'unsafe selected path',
      {
        source: 'file:./skill',
        converter: 'agent-skill',
        path: '../outside',
      },
      'must stay inside',
    ],
  ])('rejects %s', async (_label, ref, message) => {
    const root = tempDir();
    writeSkill(path.join(root, 'skill'));
    await expect(
      loadCapabilityRefs({ neutral: ref }, root, undefined, {
        cacheDir: path.join(root, 'cache'),
      }),
    ).rejects.toThrow(message);
  });

  it('warns and continues on floating github refs outside frozen mode', async () => {
    const root = tempDir();
    const archiveRoot = path.join(root, 'archive', 'neutral-repo-main', 'skill');
    writeSkill(archiveRoot);
    const archivePath = path.join(root, 'fixture.tgz');
    execFileSync('tar', [
      '-czf',
      archivePath,
      '-C',
      path.join(root, 'archive'),
      'neutral-repo-main',
    ]);
    const archive = fs.readFileSync(archivePath);
    const mockFetch = async () =>
      new Response(archive, {
        status: 200,
        headers: { 'content-type': 'application/gzip' },
      });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const result = await loadCapabilityRefs(
        {
          'neutral-skill': {
            source: 'github:example/neutral-repo',
            path: 'skill',
            converter: 'agent-skill',
          },
        },
        root,
        undefined,
        { cacheDir: path.join(root, 'cache'), fetch: mockFetch as typeof fetch },
      );

      expect(result.config.skills?.['neutral-skill']).toBeDefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('pinned ref'));
      expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('neutral-repo');
    } finally {
      warnSpy.mockRestore();
    }
  }, 30_000);

  it('reuses the local cache for github: sources instead of re-fetching', async () => {
    const root = tempDir();
    const archiveRoot = path.join(root, 'archive', 'neutral-repo-v1', 'skill');
    writeSkill(archiveRoot);
    const archivePath = path.join(root, 'fixture.tgz');
    execFileSync('tar', [
      '-czf',
      archivePath,
      '-C',
      path.join(root, 'archive'),
      'neutral-repo-v1',
    ]);
    const archive = fs.readFileSync(archivePath);
    const fetchSpy = vi.fn(async () =>
      new Response(archive, {
        status: 200,
        headers: { 'content-type': 'application/gzip' },
      }),
    );
    const ref = {
      source: 'github:example/neutral-repo',
      ref: 'v1.0.0',
      path: 'skill',
      converter: 'agent-skill' as const,
    };
    const cacheDir = path.join(root, 'cache');

    await loadCapabilityRefs({ 'neutral-skill': ref }, root, undefined, {
      cacheDir,
      fetch: fetchSpy as unknown as typeof fetch,
    });
    const second = await loadCapabilityRefs({ 'neutral-skill': ref }, root, undefined, {
      cacheDir,
      fetch: fetchSpy as unknown as typeof fetch,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second.config.skills?.['neutral-skill']?.content).toContain(
      'neutral workflow',
    );
  }, 30_000);

  it('forceRefresh bypasses the github: cache and re-fetches', async () => {
    const root = tempDir();
    const archiveRoot = path.join(root, 'archive', 'neutral-repo-v1', 'skill');
    writeSkill(archiveRoot);
    const archivePath = path.join(root, 'fixture.tgz');
    execFileSync('tar', [
      '-czf',
      archivePath,
      '-C',
      path.join(root, 'archive'),
      'neutral-repo-v1',
    ]);
    const archive = fs.readFileSync(archivePath);
    const fetchSpy = vi.fn(async () =>
      new Response(archive, {
        status: 200,
        headers: { 'content-type': 'application/gzip' },
      }),
    );
    const ref = {
      source: 'github:example/neutral-repo',
      ref: 'v1.0.0',
      path: 'skill',
      converter: 'agent-skill' as const,
    };
    const cacheDir = path.join(root, 'cache');

    await loadCapabilityRefs({ 'neutral-skill': ref }, root, undefined, {
      cacheDir,
      fetch: fetchSpy as unknown as typeof fetch,
    });
    await loadCapabilityRefs({ 'neutral-skill': ref }, root, undefined, {
      cacheDir,
      fetch: fetchSpy as unknown as typeof fetch,
      forceRefresh: true,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  }, 30_000);

  it('forceRefresh as a name set only bypasses the cache for the named Capability', async () => {
    const root = tempDir();
    const archiveRoot = path.join(root, 'archive', 'neutral-repo-v1', 'skill');
    writeSkill(archiveRoot);
    const archivePath = path.join(root, 'fixture.tgz');
    execFileSync('tar', [
      '-czf',
      archivePath,
      '-C',
      path.join(root, 'archive'),
      'neutral-repo-v1',
    ]);
    const archive = fs.readFileSync(archivePath);
    const fetchSpy = vi.fn(async () =>
      new Response(archive, {
        status: 200,
        headers: { 'content-type': 'application/gzip' },
      }),
    );
    const refs = {
      a: {
        source: 'github:example/neutral-repo-a',
        ref: 'v1.0.0',
        path: 'skill',
        converter: 'agent-skill' as const,
      },
      b: {
        source: 'github:example/neutral-repo-b',
        ref: 'v1.0.0',
        path: 'skill',
        converter: 'agent-skill' as const,
      },
    };
    const cacheDir = path.join(root, 'cache');

    await loadCapabilityRefs(refs, root, undefined, {
      cacheDir,
      fetch: fetchSpy as unknown as typeof fetch,
    });
    fetchSpy.mockClear();
    await loadCapabilityRefs(refs, root, undefined, {
      cacheDir,
      fetch: fetchSpy as unknown as typeof fetch,
      forceRefresh: new Set(['a']),
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toContain('neutral-repo-a');
  }, 30_000);

  it('reuses the local cache for npm: sources instead of re-running npm pack', async () => {
    const root = tempDir();
    const cacheDir = path.join(root, 'cache');
    const ref = {
      source: 'npm:@ai-jue-test/does-not-exist@9.9.9',
      converter: 'mcp' as const,
    };
    const destination = capabilityCacheDestination(ref, cacheDir);
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(
      path.join(destination, 'mcp.json'),
      JSON.stringify({ servers: { neutral: { command: 'npx', args: ['-y', 'neutral'] } } }),
    );

    const result = await loadCapabilityRefs({ neutral: ref }, root, undefined, {
      cacheDir,
    });

    expect(result.config.mcp?.servers?.neutral).toEqual({
      command: 'npx',
      args: ['-y', 'neutral'],
    });
  });

  it('rejects floating github refs in frozen mode', async () => {
    const root = tempDir();
    await expect(
      loadCapabilityRefs(
        {
          neutral: {
            source: 'github:example/neutral-repo',
            converter: 'agent-skill',
          },
        },
        root,
        undefined,
        { frozen: true, fetch: (async () => new Response()) as typeof fetch },
      ),
    ).rejects.toThrow('requires github');
  });

  it('rejects literal MCP credentials from a converted source', async () => {
    const root = tempDir();
    const sourceDir = path.join(root, 'mcp-source');
    fs.mkdirSync(sourceDir);
    fs.writeFileSync(
      path.join(sourceDir, 'mcp.json'),
      JSON.stringify({
        servers: {
          neutral: {
            command: 'node',
            env: { API_TOKEN: 'literal-value' },
          },
        },
      }),
    );

    await expect(
      loadCapabilityRefs(
        {
          neutral: {
            source: 'file:./mcp-source',
            converter: 'mcp',
          },
        },
        root,
      ),
    ).rejects.toThrow('runtime environment variable');
  });

  it('rejects archive symbolic links before extraction', async () => {
    const root = tempDir();
    const archiveRoot = path.join(root, 'archive', 'neutral-repository');
    fs.mkdirSync(archiveRoot, { recursive: true });
    fs.symlinkSync('/tmp', path.join(archiveRoot, 'unsafe-link'));
    const archivePath = path.join(root, 'unsafe.tgz');
    execFileSync('tar', [
      '-czf',
      archivePath,
      '-C',
      path.join(root, 'archive'),
      'neutral-repository',
    ]);
    const archive = fs.readFileSync(archivePath);

    await expect(
      loadCapabilityRefs(
        {
          neutral: {
            source: 'github:example/neutral-repo',
            ref: 'v1.0.0',
            converter: 'jue-native',
          },
        },
        root,
        undefined,
        {
          cacheDir: path.join(root, 'cache'),
          fetch: (async () => new Response(archive)) as typeof fetch,
        },
      ),
    ).rejects.toThrow('symbolic or hard links');
  }, 60_000);
});
