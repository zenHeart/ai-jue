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

  it('should generate .claude/settings.json with MCP and hooks', async () => {
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

    const settingsPath = path.join(TEST_DIR, '.claude', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.mcp.servers.sqlite.command).toBe('uvx');
    expect(settings.hooks['pre-commit']).toBe('npm test');
  });

  it('should map commands to skills', async () => {
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
    expect(fs.readFileSync(skillPath, 'utf8')).toContain('Deploy instruction');
  });
});
