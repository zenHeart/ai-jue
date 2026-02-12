import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generate as generateClaude } from '../../ai-jue-adapter-claude/src/index';
import { generate as generateCursor } from '../../ai-jue-adapter-cursor/src/index';
import { generate as generateGemini } from '../../ai-jue-adapter-gemini/src/index';
import { generate as generateCopilot } from '../../ai-jue-adapter-copilot/src/index';

const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-matrix-'));

describe('adapter contract matrix', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('produces predictable outputs for shared canonical input', async () => {
    const config = {
      context: {
        global: 'Global context',
      },
      rules: {
        style: {
          description: 'Style guide',
          content: 'Use strict typing',
        },
      },
      skills: {
        review: { content: 'Review skill' },
      },
      commands: {
        test: { description: 'Run tests', prompt: 'Run test suite', triggers: ['/test'] },
      },
      hooks: {
        'pre-commit': 'npm test',
      },
      mcp: {
        servers: {
          sqlite: { command: 'uvx', args: ['mcp-server-sqlite'] },
        },
      },
      tools: {
        claude: { permissions: { allow: ['Read'] } },
        cursor: { temperature: 0.3 },
        gemini: { temperature: 0.2 },
        copilot: { codeReview: true },
      },
      agents: {
        reviewer: { prompt: 'Review changes', skills: ['review'] },
      },
    };

    await Promise.all([
      generateClaude(config, TEST_DIR),
      generateCursor(config, TEST_DIR),
      generateGemini(config, TEST_DIR),
      generateCopilot(config, TEST_DIR),
    ]);

    const claude = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8');
    const agentsMd = fs.readFileSync(path.join(TEST_DIR, 'AGENTS.md'), 'utf8');
    const cursorStyleRule = fs.readFileSync(path.join(TEST_DIR, '.cursor', 'rules', 'style.mdc'), 'utf8');
    const cursorSettings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.cursor', 'settings.json'), 'utf8'),
    );
    const claudeSettings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.claude', 'settings.json'), 'utf8'),
    );
    const geminiMd = fs.readFileSync(path.join(TEST_DIR, 'GEMINI.md'), 'utf8');
    const gemini = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.gemini', 'settings.json'), 'utf8'),
    );
    const copilot = fs.readFileSync(
      path.join(TEST_DIR, '.github', 'copilot-instructions.md'),
      'utf8',
    );
    const copilotSettings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.github', 'copilot-settings.json'), 'utf8'),
    );

    expect(claude).toContain('@AGENTS.md');
    expect(claude).toContain('Use strict typing');
    expect(agentsMd).toContain('Global context');
    expect(cursorStyleRule).toContain('Use strict typing');
    expect(cursorSettings.temperature).toBe(0.3);
    expect(claudeSettings.permissions.allow).toEqual(['Read']);
    expect(geminiMd).toContain('Rules (Degraded)');
    expect(geminiMd).toContain('Use strict typing');
    expect(copilot).toContain('Global context');
    expect(copilot).toContain('Rules (Degraded)');
    expect(copilot).toContain('Use strict typing');
    expect(gemini.customCommands.test).toBe('Run test suite');
    expect(gemini.hooks['pre-commit']).toBe('npm test');
    expect(gemini.mcpServers.sqlite.command).toBe('uvx');
    expect(gemini.temperature).toBe(0.2);
    expect(copilotSettings.codeReview).toBe(true);
  });
});
