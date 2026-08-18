import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';

const tempDirs: string[] = [];
const originalPlatform = process.platform;

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-npm-windows-'));
  tempDirs.push(dir);
  return dir;
}

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', {
    value: platform,
    configurable: true,
  });
}

function writeMcpArchive(root: string, archiveName: string): string {
  const packageDir = path.join(root, 'package');
  fs.mkdirSync(packageDir);
  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({
      name: '@scope/mcp-fixture',
      version: '1.2.3',
      bin: { fixture: 'server.js' },
    }),
  );
  fs.writeFileSync(path.join(packageDir, 'server.js'), '');
  const archivePath = path.join(root, archiveName);
  execFileSync('tar', ['-czf', archivePath, '-C', root, 'package']);
  return archivePath;
}

afterEach(() => {
  Object.defineProperty(process, 'platform', {
    value: originalPlatform,
    configurable: true,
  });
  vi.doUnmock('child_process');
  vi.resetModules();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Windows npm Capability Source resolution', () => {
  it('packs scoped exact npm sources through the Windows npm shim', async () => {
    setPlatform('win32');
    const root = tempDir();
    const archiveName = 'scope-mcp-fixture-1.2.3.tgz';
    const archivePath = writeMcpArchive(root, archiveName);
    const spawnCalls: Array<{ command: string; args: string[] }> = [];

    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      return {
        ...actual,
        spawnSync: vi.fn((command: string, args: string[], options: unknown) => {
          spawnCalls.push({ command, args });
          if (command === 'npm.cmd') {
            const packDir = args[args.indexOf('--pack-destination') + 1];
            fs.copyFileSync(archivePath, path.join(packDir, archiveName));
            return {
              status: 0,
              stdout: JSON.stringify([{ filename: archiveName }]),
              stderr: '',
              pid: 0,
              output: [],
              signal: null,
            };
          }
          return actual.spawnSync(command, args, options as never);
        }),
      };
    });
    vi.resetModules();
    const { loadCapabilityRefs } = await import('../src/capability-source');

    const result = await loadCapabilityRefs(
      {
        fixture: {
          source: 'npm:@scope/mcp-fixture@1.2.3',
          type: 'mcp',
        },
      },
      root,
      undefined,
      { cacheDir: path.join(root, 'cache') },
    );

    expect(spawnCalls[0]).toMatchObject({
      command: 'npm.cmd',
      args: expect.arrayContaining([
        'pack',
        '@scope/mcp-fixture@1.2.3',
        '--ignore-scripts',
        '--json',
      ]),
    });
    expect(result.config.mcp?.servers?.fixture).toEqual({
      command: 'npx',
      args: ['-y', '@scope/mcp-fixture'],
    });
  }, 30_000);

  it('falls back when the preferred Windows npm shim cannot be spawned', async () => {
    setPlatform('win32');
    const root = tempDir();
    const archiveName = 'scope-mcp-fixture-1.2.3.tgz';
    const archivePath = writeMcpArchive(root, archiveName);
    const spawnCommands: string[] = [];

    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      return {
        ...actual,
        spawnSync: vi.fn((command: string, args: string[], options: unknown) => {
          spawnCommands.push(command);
          if (command === 'npm.cmd') {
            return {
              status: null,
              error: new Error('spawn npm.cmd EINVAL'),
              stdout: undefined,
              stderr: undefined,
              pid: 0,
              output: [],
              signal: null,
            };
          }
          if (command === 'npm') {
            const packDir = args[args.indexOf('--pack-destination') + 1];
            fs.copyFileSync(archivePath, path.join(packDir, archiveName));
            return {
              status: 0,
              stdout: JSON.stringify([{ filename: archiveName }]),
              stderr: '',
              pid: 0,
              output: [],
              signal: null,
            };
          }
          return actual.spawnSync(command, args, options as never);
        }),
      };
    });
    vi.resetModules();
    const { loadCapabilityRefs } = await import('../src/capability-source');

    const result = await loadCapabilityRefs(
      {
        fixture: {
          source: 'npm:@scope/mcp-fixture@1.2.3',
          type: 'mcp',
        },
      },
      root,
      undefined,
      { cacheDir: path.join(root, 'cache') },
    );

    expect(spawnCommands.slice(0, 2)).toEqual(['npm.cmd', 'npm']);
    expect(result.config.mcp?.servers?.fixture).toEqual({
      command: 'npx',
      args: ['-y', '@scope/mcp-fixture'],
    });
  });

  it('reports npm spawn errors without assuming stderr exists', async () => {
    setPlatform('win32');
    const root = tempDir();

    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      return {
        ...actual,
        spawnSync: vi.fn((command: string, args: string[], options: unknown) => {
          if (command === 'tar') {
            return actual.spawnSync(command, args, options as never);
          }
          return {
            status: null,
            error: new Error('spawn ENOENT'),
            stdout: undefined,
            stderr: undefined,
            pid: 0,
            output: [],
            signal: null,
          };
        }),
      };
    });
    vi.resetModules();
    const { loadCapabilityRefs } = await import('../src/capability-source');

    await expect(
      loadCapabilityRefs(
        {
          fixture: {
            source: 'npm:@scope/mcp-fixture@1.2.3',
            type: 'mcp',
          },
        },
        root,
        undefined,
        { cacheDir: path.join(root, 'cache') },
      ),
    ).rejects.toThrow(
      /Unable to pack npm Capability "@scope\/mcp-fixture@1\.2\.3" without an exit code: spawn ENOENT/,
    );
  });
});
