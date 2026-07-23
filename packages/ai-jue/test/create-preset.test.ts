import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

import { handler } from '../src/commands/create-preset';

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

describe('create-preset', () => {
  it('scaffolds the canonical preset package contract without a runtime entrypoint', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-create-preset-'));
    process.chdir(tempDir);

    await handler({ name: 'example', _: [], $0: 'jue' } as any);

    const presetDir = path.join(tempDir, 'jue-preset-example');
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(presetDir, 'package.json'), 'utf8'),
    );

    expect(packageJson.main).toBeUndefined();
    expect(packageJson.ai).toEqual({ presets: [] });
    expect(packageJson.files).toEqual(
      expect.arrayContaining([
        'AGENTS.md',
        'commands',
        'rules',
        'skills',
        'agents',
        'hooks',
        'mcp.json',
        'tools',
      ]),
    );
    expect(
      fs.readFileSync(
        path.join(presetDir, 'commands', 'example', 'prompt.md'),
        'utf8',
      ),
    ).toContain('Run the example command workflow.');
  });
});
