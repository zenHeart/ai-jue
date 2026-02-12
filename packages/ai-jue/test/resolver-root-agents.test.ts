import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveFinalConfig } from '../src/resolver';

describe('resolveFinalConfig root AGENTS.md auto injection', () => {
  it('injects root AGENTS.md into context.global when present', async () => {
    const originalCwd = process.cwd();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-root-agents-'));
    fs.writeFileSync(path.join(tempDir, 'AGENTS.md'), 'Root Agents Content');

    try {
      process.chdir(tempDir);
      const config = await resolveFinalConfig({} as any);
      expect(config.context?.global).toContain('Root Agents Content');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
