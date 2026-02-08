
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

  it('should generate .cursorrules with prompts, skills, commands, and hooks', async () => {
    const config = {
      prompts: {
        agents: { content: 'Global Agent Context' },
        style: { content: 'Coding Style' }
      },
      skills: {
        debug: { content: 'Debug Skill' }
      },
      commands: {
        test: { triggers: ['/test'], prompt: 'Run tests' }
      },
      hooks: {
        'pre-commit': 'npm test'
      }
    };

    await generate(config, TEST_DIR);

    const rulesPath = path.join(TEST_DIR, '.cursorrules');
    expect(fs.existsSync(rulesPath)).toBe(true);
    const content = fs.readFileSync(rulesPath, 'utf8');

    expect(content).toContain('Global Agent Context');
    expect(content).toContain('Coding Style');
    expect(content).toContain('Debug Skill');
    expect(content).toContain('Run tests');
    expect(content).toContain('npm test');
    expect(content).toContain('<!-- AI-JUE:START -->');
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

  it('should preserve user content outside of the managed block in .cursorrules', async () => {
    const rulesPath = path.join(TEST_DIR, '.cursorrules');
    const userContent = 'User Custom Content';
    
    // Initial run
    await generate({ prompts: { test: 'initial' } }, TEST_DIR);
    
    // Simulate user appending content
    const initialContent = fs.readFileSync(rulesPath, 'utf8');
    fs.writeFileSync(rulesPath, initialContent + '\n' + userContent);

    // Second run
    await generate({ prompts: { test: 'updated' } }, TEST_DIR);

    const finalContent = fs.readFileSync(rulesPath, 'utf8');
    expect(finalContent).toContain('updated');
    expect(finalContent).toContain(userContent);
    expect(finalContent).toContain('<!-- AI-JUE:START -->');
  });
});
