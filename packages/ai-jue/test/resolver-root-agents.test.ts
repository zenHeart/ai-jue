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

  it('layers AGENTS context in stable priority order', async () => {
    const originalCwd = process.cwd();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-layered-agents-'));
    fs.mkdirSync(path.join(tempDir, '.ai'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.ai', 'AGENTS.md'), 'Local AI Agents');
    fs.writeFileSync(path.join(tempDir, 'AGENTS.md'), 'Root Agents');

    try {
      process.chdir(tempDir);
      const config = await resolveFinalConfig({
        preset: 'internal',
        language: 'en',
        context: {
          global: 'Config Agents',
        },
      } as any);

      const globalContext = String(config.context?.global || '');
      expect(globalContext).toContain('Agentic SDLC Meta-Rules (English Version)');
      expect(globalContext).toContain('ai-jue Internal Governance');
      expect(globalContext).toContain('Local AI Agents');
      expect(globalContext).toContain('Root Agents');
      expect(globalContext).toContain('Config Agents');

      expect(globalContext.indexOf('Agentic SDLC Meta-Rules (English Version)')).toBeLessThan(
        globalContext.indexOf('ai-jue Internal Governance'),
      );
      expect(globalContext.indexOf('ai-jue Internal Governance')).toBeLessThan(
        globalContext.indexOf('Local AI Agents'),
      );
      expect(globalContext.indexOf('Local AI Agents')).toBeLessThan(
        globalContext.indexOf('Root Agents'),
      );
      expect(globalContext.indexOf('Root Agents')).toBeLessThan(
        globalContext.indexOf('Config Agents'),
      );
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
