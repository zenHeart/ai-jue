
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { generate } from '../src/index';

const TEST_DIR = path.join(__dirname, 'temp_output');

describe('ai-jue-adapter-claude', () => {
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

  it('should generate CLAUDE.md with skills converted to slash commands', async () => {
    const config = {
      context: {
        global: 'Claude Context'
      },
      skills: {
        review: { 
            description: 'Review code',
            content: 'Review instruction'
        }
      },
      commands: {
        deploy: {
            description: 'Deploy app',
            prompt: 'Deploy instruction'
        }
      }
    };

    await generate(config, TEST_DIR);

    const filePath = path.join(TEST_DIR, 'CLAUDE.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('@AGENTS.md');
    expect(content).toContain('/skill-review: Review code');
    expect(content).toContain('Prompt: Review instruction');
    expect(content).toContain('/deploy: Deploy app');
    expect(content).toContain('Prompt: Deploy instruction');
    expect(content).toContain('<!-- AI-JUE:START -->');

    const agentsPath = path.join(TEST_DIR, 'AGENTS.md');
    expect(fs.existsSync(agentsPath)).toBe(true);
    expect(fs.readFileSync(agentsPath, 'utf8')).toContain('Claude Context');
  });

  it('should include hooks as documentation', async () => {
    const config = {
      hooks: {
        'pre-push': 'npm run lint'
      }
    };

    await generate(config, TEST_DIR);
    
    const content = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('Workflow Hooks');
    expect(content).toContain('pre-push');
    expect(content).toContain('npm run lint');
  });

  it('should degrade canonical rules into CLAUDE.md', async () => {
    const config = {
      rules: {
        security: {
          content: 'Never log secrets',
        },
      },
    };

    await generate(config, TEST_DIR);

    const content = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('Rules');
    expect(content).toContain('security');
    expect(content).toContain('Never log secrets');
  });

  it('should render agents section with mapped skills', async () => {
    const config = {
      skills: {
        review: { description: 'Review skill', content: 'Review guidance' },
      },
      agents: {
        reviewer: { prompt: 'Review changes', skills: ['review'] },
      },
    };

    await generate(config, TEST_DIR);

    const content = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('Agents');
    expect(content).toContain('reviewer');
    expect(content).toContain('Review skill');
  });

  it('should map tools.claude to .claude/settings.json', async () => {
    await generate(
      {
        tools: {
          claude: {
            permissions: {
              allow: ['Read'],
            },
          },
        },
      },
      TEST_DIR,
    );

    const settingsPath = path.join(TEST_DIR, '.claude', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(content.permissions.allow).toEqual(['Read']);
  });
});
