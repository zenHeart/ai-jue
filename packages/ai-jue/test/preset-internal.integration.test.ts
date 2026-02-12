import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveFinalConfig } from '../src/resolver';
import { generate as generateClaude } from '../../ai-jue-adapter-claude/src/index';
import { generate as generateCursor } from '../../ai-jue-adapter-cursor/src/index';
import { generate as generateGemini } from '../../ai-jue-adapter-gemini/src/index';
import { generate as generateCopilot } from '../../ai-jue-adapter-copilot/src/index';

describe('jue-preset-internal bootstrap integration', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-internal-integration-'));

  beforeEach(() => {
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('loads internal AGENTS, internal commands, and nested base commands', async () => {
    const config = await resolveFinalConfig({ preset: 'internal', language: 'zh-CN' } as any);

    expect(config.context?.global).toBeTruthy();
    expect(config.commands?.['repo-governance']?.prompt).toBeTruthy();
    expect(config.commands?.impl?.prompt).toBeTruthy();
  });

  it('consumes internal preset across all adapters for self-bootstrap outputs', async () => {
    const config = await resolveFinalConfig({ preset: 'internal', language: 'zh-CN' } as any);

    await Promise.all([
      generateClaude(config, outDir),
      generateCursor(config, outDir),
      generateGemini(config, outDir),
      generateCopilot(config, outDir),
    ]);

    expect(fs.existsSync(path.join(outDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.gemini', 'settings.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.github', 'copilot-instructions.md'))).toBe(true);
  });

  it('keeps documentation claims consistent with shipped internal assets', () => {
    const internalDir = path.join(process.cwd(), 'packages', 'jue-preset-internal');
    const agentsPath = path.join(internalDir, 'AGENTS.md');
    const commandPath = path.join(
      internalDir,
      'commands',
      'repo-governance',
      'prompt.md',
    );

    expect(fs.existsSync(agentsPath)).toBe(true);
    expect(fs.existsSync(commandPath)).toBe(true);
  });
});
