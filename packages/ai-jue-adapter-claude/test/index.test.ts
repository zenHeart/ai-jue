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

  it('should generate AGENTS.md and light CLAUDE.md for context', async () => {
    const config = {
      context: {
        global: 'Claude Context'
      }
    };

    await generate(config, TEST_DIR);

    const agentsPath = path.join(TEST_DIR, 'AGENTS.md');
    expect(fs.existsSync(agentsPath)).toBe(true);
    expect(fs.readFileSync(agentsPath, 'utf8')).toContain('Claude Context');

    const claudeMdPath = path.join(TEST_DIR, 'CLAUDE.md');
    expect(fs.existsSync(claudeMdPath)).toBe(true);
    expect(fs.readFileSync(claudeMdPath, 'utf8')).toContain('@AGENTS.md');
  });

  it('should generate native rules in .claude/rules/', async () => {
    const config = {
      rules: {
        security: {
          description: 'Security rules',
          globs: ['*.ts'],
          content: 'Never log secrets',
        },
      },
    };

    await generate(config, TEST_DIR);

    const rulePath = path.join(TEST_DIR, '.claude', 'rules', 'security.md');
    expect(fs.existsSync(rulePath)).toBe(true);
    const content = fs.readFileSync(rulePath, 'utf8');
    expect(content).toContain('paths:');
    expect(content).toContain('*.ts');
    expect(content).toContain('Never log secrets');
  });

  it('should generate native skills in .claude/skills/', async () => {
    const config = {
      skills: {
        review: { 
            name: 'review-skill',
            description: 'Review code',
            content: 'Review instruction'
        }
      }
    };

    await generate(config, TEST_DIR);

    const skillMdPath = path.join(TEST_DIR, '.claude', 'skills', 'review', 'SKILL.md');
    expect(fs.existsSync(skillMdPath)).toBe(true);
    const content = fs.readFileSync(skillMdPath, 'utf8');
    expect(content).toContain('name: review-skill');
    expect(content).toContain('description: Review code');
    expect(content).toContain('Review instruction');
  });

  it('should generate .mcp.json with MCP servers', async () => {
    const config = {
      mcp: {
        servers: {
          sqlite: { command: 'uvx', args: ['mcp-server-sqlite'] }
        }
      },
      hooks: {
        'pre-commit': 'npm test'
      }
    };

    await generate(config, TEST_DIR);

    // MCP servers go to .mcp.json (project scope)
    const mcpPath = path.join(TEST_DIR, '.mcp.json');
    expect(fs.existsSync(mcpPath)).toBe(true);
    const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    expect(mcpConfig.mcpServers.sqlite.command).toBe('uvx');

    // Hooks go to .claude/settings.json
    const settingsPath = path.join(TEST_DIR, '.claude', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks['pre-commit']).toBeDefined();
  });

  it('should map commands to skills with correct frontmatter', async () => {
    const config = {
      commands: {
        deploy: {
            description: 'Deploy app',
            prompt: 'Deploy instruction'
        }
      }
    };

    await generate(config, TEST_DIR);

    const skillPath = path.join(TEST_DIR, '.claude', 'skills', 'deploy', 'SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);
    const content = fs.readFileSync(skillPath, 'utf8');
    expect(content).toContain('Deploy instruction');
    expect(content).toContain('disable-model-invocation: true');  // Commands default to not auto-invoked
  });

  it('should extract claude namespace from command frontmatter', async () => {
    const config = {
      commands: {
        fix: {
          description: 'Fix issues',
          prompt: 'Fix code issues',
          claude: {
            'argument-hint': '[file]',
            'model': 'sonnet',
            'allowed-tools': ['Read', 'Edit']
          }
        }
      }
    };

    await generate(config, TEST_DIR);

    const skillPath = path.join(TEST_DIR, '.claude', 'skills', 'fix', 'SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);
    const content = fs.readFileSync(skillPath, 'utf8');
    expect(content).toContain("argument-hint: '[file]'");
    expect(content).toContain('model: sonnet');
    expect(content).toContain('allowed-tools:');
  });

  it('should map alwaysApply to auto-apply in rules', async () => {
    const config = {
      rules: {
        security: {
          description: 'Security rules',
          globs: ['*.ts'],
          alwaysApply: true,
          content: 'Never log secrets'
        }
      }
    };

    await generate(config, TEST_DIR);

    const rulePath = path.join(TEST_DIR, '.claude', 'rules', 'security.md');
    expect(fs.existsSync(rulePath)).toBe(true);
    const content = fs.readFileSync(rulePath, 'utf8');
    expect(content).toContain('auto-apply: true');
  });

  it('should generate agents in .claude/agents/', async () => {
    const config = {
      agents: {
        'code-reviewer': {
          description: 'Reviews code for quality',
          prompt: 'You are a code reviewer.',
          tools: ['Read', 'Grep'],
          model: 'sonnet'
        }
      }
    };

    await generate(config, TEST_DIR);

    const agentPath = path.join(TEST_DIR, '.claude', 'agents', 'code-reviewer.md');
    expect(fs.existsSync(agentPath)).toBe(true);
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('name: code-reviewer');
    expect(content).toContain('description: Reviews code for quality');
    expect(content).toContain('You are a code reviewer.');
    expect(content).toContain('tools:');
  });

  it('should process hooks with enhanced structure', async () => {
    const config = {
      hooks: {
        'PostToolUse': {
          script: './scripts/lint.sh',
          matcher: 'Write|Edit',
          async: true
        }
      }
    };

    await generate(config, TEST_DIR);

    const settingsPath = path.join(TEST_DIR, '.claude', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks.PostToolUse).toBeDefined();
    expect(settings.hooks.PostToolUse[0].matcher).toBe('Write|Edit');
    expect(settings.hooks.PostToolUse[0].hooks[0].async).toBe(true);
  });
});
