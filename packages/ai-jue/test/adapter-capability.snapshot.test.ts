import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import claudeExtension from '../../ai-jue-adapter-claude/src/index';
import cursorExtension from '../../ai-jue-adapter-cursor/src/index';
import { applyExtension } from './helpers/apply-extension';

describe('adapter capability snapshot', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-capability-snapshot-'));

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

  it('matches canonical capability output snapshot', async () => {
    const config = {
      context: { global: 'Global context for snapshot' },
      rules: {
        style: {
          description: 'Style rule',
          content: 'Common prompt block',
        },
      },
      skills: {
        review: { content: 'Review skill content', description: 'Review skill' },
      },
      commands: {
        review: { prompt: 'Run review flow', description: 'Review command', triggers: ['/review'] },
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
      },
      agents: {
        reviewer: { prompt: 'Review as agent', skills: ['review'] },
      },
    };

    await Promise.all([
      applyExtension(claudeExtension, config, outDir),
      applyExtension(cursorExtension, config, outDir),
    ]);

    const snapshotPayload = {
      agents: fs.readFileSync(path.join(outDir, 'AGENTS.md'), 'utf8'),
      claude: fs.readFileSync(path.join(outDir, 'CLAUDE.md'), 'utf8'),
      cursorProjectRuleStyle: fs.readFileSync(path.join(outDir, '.cursor', 'rules', 'style.mdc'), 'utf8'),
      cursorCommand: fs.readFileSync(path.join(outDir, '.cursor', 'commands', 'review.md'), 'utf8'),
      cursorSettings: JSON.parse(
        fs.readFileSync(path.join(outDir, '.cursor', 'settings.json'), 'utf8'),
      ),
      claudeSettings: JSON.parse(
        fs.readFileSync(path.join(outDir, '.claude', 'settings.json'), 'utf8'),
      ),
      claudeMcp: JSON.parse(
        fs.readFileSync(path.join(outDir, '.mcp.json'), 'utf8'),
      ),
    };

    expect(snapshotPayload).toMatchSnapshot();
  });
});
