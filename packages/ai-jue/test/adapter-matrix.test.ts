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
      prompts: {
        style: { content: 'Style guide' },
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
    const cursor = fs.readFileSync(path.join(TEST_DIR, '.cursor', 'rules', 'ai-jue.mdc'), 'utf8');
    const gemini = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.gemini', 'settings.json'), 'utf8'),
    );
    const copilot = fs.readFileSync(
      path.join(TEST_DIR, '.github', 'copilot-instructions.md'),
      'utf8',
    );

    expect(claude).toContain('Global context');
    expect(cursor).toContain('Global context');
    expect(copilot).toContain('Global context');
    expect(gemini.customCommands.test).toBe('Run test suite');
    expect(gemini.hooks['pre-commit']).toBe('npm test');
    expect(gemini.mcpServers.sqlite.command).toBe('uvx');
  });
});
