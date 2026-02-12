import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generate as generateClaude } from '../../ai-jue-adapter-claude/src/index';
import { generate as generateCursor } from '../../ai-jue-adapter-cursor/src/index';
import { generate as generateGemini } from '../../ai-jue-adapter-gemini/src/index';
import { generate as generateCopilot } from '../../ai-jue-adapter-copilot/src/index';

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
      prompts: {
        common: { content: 'Common prompt block' },
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
      agents: {
        reviewer: { prompt: 'Review as agent', skills: ['review'] },
      },
    };

    await Promise.all([
      generateClaude(config, outDir),
      generateCursor(config, outDir),
      generateGemini(config, outDir),
      generateCopilot(config, outDir),
    ]);

    const snapshotPayload = {
      claude: fs.readFileSync(path.join(outDir, 'CLAUDE.md'), 'utf8'),
      cursor: fs.readFileSync(path.join(outDir, '.cursor', 'rules', 'ai-jue.mdc'), 'utf8'),
      gemini: JSON.parse(fs.readFileSync(path.join(outDir, '.gemini', 'settings.json'), 'utf8')),
      copilot: fs.readFileSync(path.join(outDir, '.github', 'copilot-instructions.md'), 'utf8'),
    };

    expect(snapshotPayload).toMatchSnapshot();
  });
});
