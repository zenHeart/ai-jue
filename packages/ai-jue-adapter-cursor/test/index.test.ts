
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

  it('should map AGENTS context to root AGENTS.md', async () => {
    const config = {
      context: {
        global: 'Global Agent Context'
      }
    };

    await generate(config, TEST_DIR);

    const agentsPath = path.join(TEST_DIR, 'AGENTS.md');
    expect(fs.existsSync(agentsPath)).toBe(true);
    const content = fs.readFileSync(agentsPath, 'utf8');
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

  it('should preserve structured hook fields from canonical input', async () => {
    await generate(
      {
        hooks: {
          PostToolUse: {
            script: 'npm test',
            matcher: 'Edit|Write',
            async: true,
            timeout: 30,
          },
        },
      },
      TEST_DIR,
    );

    const hooksPath = path.join(TEST_DIR, '.cursor', 'hooks.json');
    const content = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

    expect(content.PostToolUse.matcher).toBe('Edit|Write');
    expect(content.PostToolUse.async).toBe(true);
    expect(content.PostToolUse.timeout).toBe(30);
  });

  it('should not generate hooks.json when hooks are empty', async () => {
    await generate(
      {
        hooks: {},
      },
      TEST_DIR,
    );

    expect(fs.existsSync(path.join(TEST_DIR, '.cursor', 'hooks.json'))).toBe(false);
  });

  it('should generate .cursor/mcp.json with full MCP server configuration', async () => {
    const config = {
      mcp: {
        servers: {
          sqlite: {
            command: 'uvx',
            args: ['mcp-server-sqlite'],
            env: { DATABASE_URL: 'sqlite://test.db' },
            disabled: false,
            autoApprove: ['read', 'query']
          }
        }
      }
    };

    await generate(config, TEST_DIR);

    const mcpPath = path.join(TEST_DIR, '.cursor', 'mcp.json');
    expect(fs.existsSync(mcpPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));

    expect(content.mcpServers.sqlite.command).toBe('uvx');
    expect(content.mcpServers.sqlite.args).toEqual(['mcp-server-sqlite']);
    expect(content.mcpServers.sqlite.env.DATABASE_URL).toBe('sqlite://test.db');
    expect(content.mcpServers.sqlite.disabled).toBe(false);
    expect(content.mcpServers.sqlite.autoApprove).toEqual(['read', 'query']);
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

  it('should preserve user content outside of the managed block in AGENTS.md', async () => {
    const rulesPath = path.join(TEST_DIR, 'AGENTS.md');
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

  describe('Ignore Files', () => {
    it('should generate .cursorignore from tools.cursor.ignore', async () => {
      await generate(
        {
          tools: {
            cursor: {
              ignore: ['dist/', '*.log', 'node_modules/']
            }
          }
        },
        TEST_DIR
      );

      const ignorePath = path.join(TEST_DIR, '.cursorignore');
      expect(fs.existsSync(ignorePath)).toBe(true);
      const content = fs.readFileSync(ignorePath, 'utf8');
      expect(content).toContain('dist/');
      expect(content).toContain('*.log');
      expect(content).toContain('node_modules/');
    });

    it('should generate .cursorindexingignore from tools.cursor.indexingIgnore', async () => {
      await generate(
        {
          tools: {
            cursor: {
              indexingIgnore: ['*.min.js', 'build/', 'coverage/']
            }
          }
        },
        TEST_DIR
      );

      const indexingIgnorePath = path.join(TEST_DIR, '.cursorindexingignore');
      expect(fs.existsSync(indexingIgnorePath)).toBe(true);
      const content = fs.readFileSync(indexingIgnorePath, 'utf8');
      expect(content).toContain('*.min.js');
      expect(content).toContain('build/');
      expect(content).toContain('coverage/');
    });

    it('should not generate ignore files when not configured', async () => {
      await generate(
        {
          tools: {
            cursor: {
              temperature: 0.5
            }
          }
        },
        TEST_DIR
      );

      expect(fs.existsSync(path.join(TEST_DIR, '.cursorignore'))).toBe(false);
      expect(fs.existsSync(path.join(TEST_DIR, '.cursorindexingignore'))).toBe(false);
    });
  });

  describe('Advanced Hooks', () => {
    it('should support complex hook format with matcher, async, timeout', async () => {
      await generate(
        {
          hooks: {
            sessionStart: './scripts/init.sh',
            preToolUse: {
              matcher: 'Bash',
              script: './scripts/validate.sh',
              async: true,
              timeout: 120
            },
            postTool: {
              matcher: 'Write',
              script: './scripts/format.sh'
            }
          }
        },
        TEST_DIR
      );

      const hooksPath = path.join(TEST_DIR, '.cursor', 'hooks.json');
      expect(fs.existsSync(hooksPath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

      // Simple string format
      expect(content.sessionStart).toBe('./scripts/init.sh');

      // Complex object format
      expect(content.preToolUse.matcher).toBe('Bash');
      expect(content.preToolUse.script).toBe('./scripts/validate.sh');
      expect(content.preToolUse.async).toBe(true);
      expect(content.preToolUse.timeout).toBe(120);

      // Partial object format (no async/timeout)
      expect(content.postTool.matcher).toBe('Write');
      expect(content.postTool.script).toBe('./scripts/format.sh');
      expect(content.postTool.async).toBeUndefined();
    });

    it('should skip hooks with empty script in complex format', async () => {
      await generate(
        {
          hooks: {
            validHook: './valid.sh',
            invalidHook: {
              matcher: 'Bash',
              script: ''  // Empty script should be skipped
            }
          }
        },
        TEST_DIR
      );

      const hooksPath = path.join(TEST_DIR, '.cursor', 'hooks.json');
      const content = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

      expect(content.validHook).toBe('./valid.sh');
      expect(content.invalidHook).toBeUndefined();
    });
  });

  describe('Agents', () => {
    it('should generate agents with skills references', async () => {
      await generate(
        {
          agents: {
            reviewer: {
              description: 'Code Reviewer Agent',
              prompt: 'Review code for quality and best practices',
              skills: ['security-check', 'performance-review']
            }
          }
        },
        TEST_DIR
      );

      const agentPath = path.join(TEST_DIR, '.cursor', 'agents', 'reviewer.md');
      expect(fs.existsSync(agentPath)).toBe(true);
      const content = fs.readFileSync(agentPath, 'utf8');

      expect(content).toContain('# reviewer');
      expect(content).toContain('Code Reviewer Agent');
      expect(content).toContain('Review code for quality and best practices');
      expect(content).toContain('## Skills');
      expect(content).toContain('- security-check');
      expect(content).toContain('- performance-review');
    });

    it('should generate agents without skills', async () => {
      await generate(
        {
          agents: {
            helper: {
              prompt: 'Help with general tasks'
            }
          }
        },
        TEST_DIR
      );

      const agentPath = path.join(TEST_DIR, '.cursor', 'agents', 'helper.md');
      expect(fs.existsSync(agentPath)).toBe(true);
      const content = fs.readFileSync(agentPath, 'utf8');

      expect(content).toContain('# helper');
      expect(content).toContain('Help with general tasks');
      expect(content).not.toContain('## Skills');
    });
  });

  describe('Settings Exclusion', () => {
    it('should exclude ignore fields from settings.json', async () => {
      await generate(
        {
          tools: {
            cursor: {
              temperature: 0.5,
              ignore: ['dist/'],
              indexingIgnore: ['build/']
            }
          }
        },
        TEST_DIR
      );

      const settingsPath = path.join(TEST_DIR, '.cursor', 'settings.json');
      const content = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

      expect(content.temperature).toBe(0.5);
      expect(content.ignore).toBeUndefined();
      expect(content.indexingIgnore).toBeUndefined();
    });
  });
});
