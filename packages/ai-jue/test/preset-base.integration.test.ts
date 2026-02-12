import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveFinalConfig } from '../src/resolver';
import { generate as generateClaude } from '../../ai-jue-adapter-claude/src/index';
import { generate as generateCursor } from '../../ai-jue-adapter-cursor/src/index';
import { generate as generateGemini } from '../../ai-jue-adapter-gemini/src/index';
import { generate as generateCopilot } from '../../ai-jue-adapter-copilot/src/index';

const REQUIRED_COMMANDS = [
  'explain',
  'refactor',
  'optimize',
  'test',
  'doc',
  'review',
  'security',
];

describe('jue-preset-base integration', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-base-integration-'));

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

  it('loads AGENTS and required command assets from base preset', async () => {
    const config = await resolveFinalConfig({ preset: 'base', language: 'en' } as any);

    expect(config.context?.global).toBeTruthy();
    for (const command of REQUIRED_COMMANDS) {
      expect(config.commands?.[command]).toBeDefined();
      expect(config.commands?.[command]?.prompt).toBeTruthy();
    }
  });

  it('base preset assets are consumable by all adapters', async () => {
    const config = await resolveFinalConfig({ preset: 'base', language: 'en' } as any);

    await Promise.all([
      generateClaude(config, outDir),
      generateCursor(config, outDir),
      generateGemini(config, outDir),
      generateCopilot(config, outDir),
    ]);

    expect(fs.existsSync(path.join(outDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.cursor', 'rules', 'ai-jue.mdc'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'GEMINI.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.github', 'copilot-instructions.md'))).toBe(
      true,
    );
  });

  it('checks bilingual completeness of AGENTS and commands in base preset', () => {
    const baseDir = path.join(process.cwd(), 'packages', 'jue-preset-base');
    const promptsDir = path.join(baseDir, 'prompts');
    expect(fs.existsSync(path.join(promptsDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(promptsDir, 'AGENTS.en.md'))).toBe(true);

    const commandsDir = path.join(baseDir, 'commands');
    const commandNames = fs
      .readdirSync(commandsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const name of commandNames) {
      const commandDir = path.join(commandsDir, name);
      expect(fs.existsSync(path.join(commandDir, 'prompt.md'))).toBe(true);
      expect(fs.existsSync(path.join(commandDir, 'prompt.en.md'))).toBe(true);
      expect(fs.existsSync(path.join(commandDir, 'index.json'))).toBe(true);
    }
  });
});
