
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { generate } from '../src/index';

const TEST_DIR = path.join(__dirname, 'temp_output');

describe('ai-jue-adapter-copilot', () => {
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

  it('should generate .github/copilot-instructions.md with prompts, skills, commands, and hooks', async () => {
    const config = {
      context: {
        global: 'Core Instructions'
      },
      prompts: {
        style: { content: 'Code Style' }
      },
      rules: {
        security: { content: 'Never commit secrets' }
      },
      skills: {
        refactor: { content: 'Refactor Skill' }
      },
      commands: {
        fix: { description: 'Fix bugs', prompt: 'Fix it' }
      },
      hooks: {
        'pre-commit': 'npm test'
      },
      mcp: {
        servers: {
          sqlite: { command: 'uvx' }
        }
      },
      agents: {
        reviewer: {
          prompt: 'Review code'
        }
      },
      tools: {
        copilot: {
          codeReview: true
        }
      }
    };

    await generate(config, TEST_DIR);

    const filePath = path.join(TEST_DIR, '.github', 'copilot-instructions.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('Core Instructions');
    expect(content).toContain('Code Style');
    expect(content).toContain('Rules (Degraded)');
    expect(content).toContain('Never commit secrets');
    expect(content).toContain('Refactor Skill');
    expect(content).toContain('Fix bugs');
    expect(content).toContain('Fix it');
    expect(content).toContain('Workflow Note');
    expect(content).toContain('Capability Notes');
    expect(content).toContain('pre-commit');
    expect(content).toContain('npm test');
    expect(content).toContain('<!-- AI-JUE:START -->');

    const settings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.github', 'copilot-settings.json'), 'utf8'),
    );
    expect(settings.codeReview).toBe(true);
  });
});
