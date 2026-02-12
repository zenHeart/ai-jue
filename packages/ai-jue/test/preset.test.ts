import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadAssetsFromDir } from '../src/preset';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-preset-test-'));
}

describe('loadAssetsFromDir', () => {
  it('loads AGENTS.md into context.global', async () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Global Context');

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.context?.global).toContain('Global Context');
  });

  it('loads commands from commands/*/{index.json,prompt.md}', async () => {
    const dir = makeTempDir();
    const commandDir = path.join(dir, 'commands', 'review');
    fs.mkdirSync(commandDir, { recursive: true });
    fs.writeFileSync(
      path.join(commandDir, 'index.json'),
      JSON.stringify({ description: 'Review code' }),
    );
    fs.writeFileSync(path.join(commandDir, 'prompt.md'), 'Review prompt');

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.commands?.review?.description).toBe('Review code');
    expect(config.commands?.review?.prompt).toBe('Review prompt');
  });
});
