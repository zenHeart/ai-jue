
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { generate } from '../src/index';

const TEST_DIR = path.join(__dirname, 'temp_output');

describe('ai-jue-adapter-gemini', () => {
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

  it('should generate GEMINI.md from prompts', async () => {
    const config = {
      prompts: {
        gemini: { content: 'Gemini Prompt' }
      }
    };

    await generate(config, TEST_DIR);

    const filePath = path.join(TEST_DIR, 'GEMINI.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('Gemini Prompt');
    expect(content).toContain('<!-- AI-JUE:START -->');
  });

  it('should generate .gemini/settings.json with MCP, Commands, and Hooks', async () => {
    const config = {
      mcp: {
        servers: {
          testServer: { command: 'node', args: ['test.js'] }
        }
      },
      commands: {
        hello: { prompt: 'Say hello' }
      },
      hooks: {
        'post-build': 'notify'
      }
    };

    await generate(config, TEST_DIR);

    const filePath = path.join(TEST_DIR, '.gemini', 'settings.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    expect(content.mcpServers.testServer.command).toBe('node');
    expect(content.customCommands.hello).toBe('Say hello');
    expect(content.hooks['post-build']).toBe('notify');
  });

  it('should deep merge existing JSON settings', async () => {
    const filePath = path.join(TEST_DIR, '.gemini', 'settings.json');
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ existing: true, nested: { a: 1 } }));

    const config = {
      commands: {
        new: { prompt: 'new' }
      }
    };

    await generate(config, TEST_DIR);

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(content.existing).toBe(true);
    expect(content.nested.a).toBe(1);
    expect(content.customCommands.new).toBe('new');
  });

  it('should generate empty settings.json when no gemini options are configured', async () => {
    await generate({}, TEST_DIR);

    const filePath = path.join(TEST_DIR, '.gemini', 'settings.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(content).toEqual({});
  });

  it('should map legacy agents.tools to agents.skills output', async () => {
    await generate(
      {
        agents: {
          reviewer: {
            prompt: 'Review code',
            tools: ['review-skill'],
          },
        },
      },
      TEST_DIR,
    );

    const content = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.gemini', 'settings.json'), 'utf8'),
    );
    expect(content.agents.reviewer.skills).toEqual(['review-skill']);
  });
});
