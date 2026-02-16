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

  it('should generate .github/copilot-instructions.md with all capabilities', async () => {
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
    expect(content).toContain('Rules');
    expect(content).toContain('Never commit secrets');
    expect(content).toContain('Refactor Skill');
    expect(content).toContain('Commands');
    expect(content).toContain('Fix bugs');
    expect(content).toContain('Workflow Hooks');
    expect(content).toContain('Capability Notes');
    expect(content).toContain('pre-commit');
    expect(content).toContain('npm test');
    expect(content).toContain('<!-- AI-JUE:START -->');

    const settings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.github', 'copilot-settings.json'), 'utf8'),
    );
    expect(settings.codeReview).toBe(true);
  });

  describe('Path-specific Instructions', () => {
    it('should generate .github/instructions/*.instructions.md for rules with globs', async () => {
      const config = {
        rules: {
          typescript: {
            globs: ['src/**/*.ts', 'src/**/*.tsx'],
            description: 'TypeScript rules',
            content: 'Use strict types'
          },
          python: {
            globs: ['**/*.py'],
            description: 'Python rules',
            content: 'Follow PEP 8'
          }
        }
      };

      await generate(config, TEST_DIR);

      const tsPath = path.join(TEST_DIR, '.github', 'instructions', 'typescript.instructions.md');
      const pyPath = path.join(TEST_DIR, '.github', 'instructions', 'python.instructions.md');

      expect(fs.existsSync(tsPath)).toBe(true);
      expect(fs.existsSync(pyPath)).toBe(true);

      const tsContent = fs.readFileSync(tsPath, 'utf8');
      expect(tsContent).toContain('applyTo: "src/**/*.ts,src/**/*.tsx"');
      expect(tsContent).toContain('# typescript');
      expect(tsContent).toContain('TypeScript rules');
      expect(tsContent).toContain('Use strict types');

      const pyContent = fs.readFileSync(pyPath, 'utf8');
      expect(pyContent).toContain('applyTo: "**/*.py"');
    });

    it('should handle rules without globs in main instructions only', async () => {
      const config = {
        rules: {
          general: {
            content: 'General rule without globs'
          }
        }
      };

      await generate(config, TEST_DIR);

      const mainPath = path.join(TEST_DIR, '.github', 'copilot-instructions.md');
      const instructionsDir = path.join(TEST_DIR, '.github', 'instructions');

      const mainContent = fs.readFileSync(mainPath, 'utf8');
      expect(mainContent).toContain('General rule without globs');

      // Should not create path-specific file
      expect(fs.existsSync(instructionsDir)).toBe(false);
    });
  });

  describe('Prompt Files', () => {
    it('should generate .github/prompts/*.prompt.md for commands with triggers', async () => {
      const config = {
        commands: {
          explain: {
            description: 'Explain code',
            prompt: 'Explain this code',
            triggers: ['/explain', '/exp']
          }
        }
      };

      await generate(config, TEST_DIR);

      const promptPath = path.join(TEST_DIR, '.github', 'prompts', 'explain.prompt.md');
      expect(fs.existsSync(promptPath)).toBe(true);

      const content = fs.readFileSync(promptPath, 'utf8');
      expect(content).toContain('applyTo: "**/*"');
      expect(content).toContain('# explain');
      expect(content).toContain('Explain code');
      expect(content).toContain('Explain this code');
      expect(content).toContain('/explain, /exp');
    });

    it('should handle commands without triggers in main instructions', async () => {
      const config = {
        commands: {
          fix: {
            description: 'Fix code',
            prompt: 'Fix this code'
          }
        }
      };

      await generate(config, TEST_DIR);

      const mainPath = path.join(TEST_DIR, '.github', 'copilot-instructions.md');
      const promptsDir = path.join(TEST_DIR, '.github', 'prompts');

      const mainContent = fs.readFileSync(mainPath, 'utf8');
      expect(mainContent).toContain('Fix code');

      // Should not create prompt file
      expect(fs.existsSync(promptsDir)).toBe(false);
    });
  });

  describe('Agents', () => {
    it('should generate .github/instructions/*.instructions.md for agents', async () => {
      const config = {
        agents: {
          reviewer: {
            name: 'Code Reviewer',
            description: 'Reviews code for quality',
            prompt: 'Review this code for best practices'
          }
        }
      };

      await generate(config, TEST_DIR);

      const agentPath = path.join(TEST_DIR, '.github', 'instructions', 'reviewer.instructions.md');
      expect(fs.existsSync(agentPath)).toBe(true);

      const content = fs.readFileSync(agentPath, 'utf8');
      expect(content).toContain('applyTo: "**/*"');
      expect(content).toContain('# Code Reviewer');
      expect(content).toContain('Reviews code for quality');
      expect(content).toContain('Review this code for best practices');
    });
  });

  describe('Empty Configurations', () => {
    it('should not generate files for empty config', async () => {
      await generate({}, TEST_DIR);

      expect(fs.existsSync(path.join(TEST_DIR, '.github'))).toBe(false);
    });

    it('should not generate instructions file for only MCP/agents config', async () => {
      const config = {
        mcp: {
          servers: {
            test: { command: 'echo' }
          }
        }
      };

      await generate(config, TEST_DIR);

      const mainPath = path.join(TEST_DIR, '.github', 'copilot-instructions.md');
      expect(fs.existsSync(mainPath)).toBe(false);
    });
  });
});
