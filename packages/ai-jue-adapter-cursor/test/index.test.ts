
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { generate } from '../src/index';

const TEST_DIR = path.join(__dirname, 'temp_output');

describe('ai-jue-adapter-cursor', () => {
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

  it('should map AGENTS context to .cursor/rules/agents.mdc', async () => {
    const config = {
      context: {
        global: 'Global Agent Context'
      }
    };

    await generate(config, TEST_DIR);

    const rulesPath = path.join(TEST_DIR, '.cursor/rules/agents.mdc');
    expect(fs.existsSync(rulesPath)).toBe(true);
    const content = fs.readFileSync(rulesPath, 'utf8');
    expect(content).toContain('Global Agent Context');
  });

  it('should map canonical rules to .cursor/rules/*.mdc', async () => {
    const config = {
      rules: {
        style: {
          description: 'Style rule',
          alwaysApply: true,
          globs: ['src/**/*.ts'],
          content: 'Use strict types'
        }
      }
    };

    await generate(config, TEST_DIR);

    const rulesPath = path.join(TEST_DIR, '.cursor', 'rules', 'style.mdc');
    expect(fs.existsSync(rulesPath)).toBe(true);
    const content = fs.readFileSync(rulesPath, 'utf8');
    expect(content).toContain('description: Style rule');
    expect(content).toContain('alwaysApply: true');
    expect(content).toContain('globs: ["src/**/*.ts"]');
    expect(content).toContain('Use strict types');
  });

  it('should map commands/skills/hooks to cursor-native locations', async () => {
    const config = {
      commands: {
        test: { triggers: ['/test'], prompt: 'Run tests' }
      },
      skills: {
        debug: { content: 'Debug Skill' }
      },
      hooks: {
        'pre-commit': 'npm test'
      }
    };

    await generate(config, TEST_DIR);
    expect(fs.existsSync(path.join(TEST_DIR, '.cursor', 'commands', 'test.md'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, '.cursor', 'skills', 'debug', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, '.cursor', 'hooks.json'))).toBe(true);
  });

  it('should generate .cursor/mcp.json when mcp config is present', async () => {
    const config = {
      mcp: {
        servers: {
          sqlite: {
            command: 'uvx',
            args: ['mcp-server-sqlite']
          }
        }
      }
    };

    await generate(config, TEST_DIR);

    const mcpPath = path.join(TEST_DIR, '.cursor', 'mcp.json');
    expect(fs.existsSync(mcpPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    
    expect(content.mcpServers.sqlite.command).toBe('uvx');
  });

  it('should map tools.cursor to .cursor/settings.json', async () => {
    await generate(
      {
        tools: {
          cursor: {
            temperature: 0.1,
          },
        },
      },
      TEST_DIR,
    );

    const settingsPath = path.join(TEST_DIR, '.cursor', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(content.temperature).toBe(0.1);
  });

  it('should preserve user content outside of the managed block in .cursor/rules/agents.mdc', async () => {
    const rulesPath = path.join(TEST_DIR, '.cursor/rules/agents.mdc');
    const userContent = 'User Custom Content';
    
    // Initial run
    await generate({ context: { global: 'initial' } }, TEST_DIR);
    
    // Simulate user appending content
    const initialContent = fs.readFileSync(rulesPath, 'utf8');
    fs.writeFileSync(rulesPath, initialContent + '\n' + userContent);

    // Second run
    await generate({ context: { global: 'updated' } }, TEST_DIR);

    const finalContent = fs.readFileSync(rulesPath, 'utf8');
    expect(finalContent).toContain('updated');
    expect(finalContent).toContain(userContent);
    expect(finalContent).toContain('<!-- AI-JUE:START -->');
  });
});
