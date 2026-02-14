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

  it('should keep prompt priority over context.global', async () => {
    const config = {
      context: {
        global: 'Global Context',
      },
      prompts: {
        gemini: { content: 'Prompt Wins' },
      },
    };

    await generate(config, TEST_DIR);

    const content = fs.readFileSync(path.join(TEST_DIR, 'GEMINI.md'), 'utf8');
    expect(content).toContain('Prompt Wins');
    expect(content).toContain('@AGENTS.md');
  });

  it('should reference AGENTS.md when gemini prompt is not provided', async () => {
    const config = {
      context: {
        global: 'Global Context',
      },
    };

    await generate(config, TEST_DIR);

    const content = fs.readFileSync(path.join(TEST_DIR, 'GEMINI.md'), 'utf8');
    expect(content).toContain('@AGENTS.md');
    const agents = fs.readFileSync(path.join(TEST_DIR, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('Global Context');
  });

  it('should degrade canonical rules into GEMINI.md', async () => {
    const config = {
      rules: {
        style: {
          content: 'Keep modules small',
        },
      },
    };

    await generate(config, TEST_DIR);
    const content = fs.readFileSync(path.join(TEST_DIR, 'GEMINI.md'), 'utf8');
    expect(content).toContain('Rules (Degraded)');
    expect(content).toContain('style');
    expect(content).toContain('Keep modules small');
  });

  it('should generate .gemini/settings.json with MCP and hooks', async () => {
    const config = {
      tools: {
        gemini: {
          temperature: 0.2,
        },
      },
      mcp: {
        servers: {
          testServer: { command: 'node', args: ['test.js'] }
        }
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
    expect(content.hooks['post-build']).toBe('notify');
    expect(content.temperature).toBe(0.2);
  });

  it('should generate Gemini custom command TOML files with YAML metadata mapping', async () => {
    await generate(
      {
        commands: {
          explain: {
            description: 'Explain code with context',
            prompt: 'Analyze this module and explain tradeoffs.',
          },
          'git:commit': {
            description: 'Create commit message',
            prompt: 'Generate a conventional commit message.',
          },
        },
      },
      TEST_DIR,
    );

    const explainPath = path.join(TEST_DIR, '.gemini', 'commands', 'explain.toml');
    expect(fs.existsSync(explainPath)).toBe(true);
    const explainContent = fs.readFileSync(explainPath, 'utf8');
    expect(explainContent).toContain('description = "Explain code with context"');
    expect(explainContent).toContain('prompt = """');
    expect(explainContent).toContain('Analyze this module and explain tradeoffs.');

    const nestedPath = path.join(TEST_DIR, '.gemini', 'commands', 'git', 'commit.toml');
    expect(fs.existsSync(nestedPath)).toBe(true);
    const nestedContent = fs.readFileSync(nestedPath, 'utf8');
    expect(nestedContent).toContain('description = "Create commit message"');
    expect(nestedContent).toContain('Generate a conventional commit message.');
  });

  it('should deep merge existing JSON settings', async () => {
    const filePath = path.join(TEST_DIR, '.gemini', 'settings.json');
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ existing: true, nested: { a: 1 } }));

    const config = {
      tools: {
        gemini: {
          newField: true,
        },
      },
    };

    await generate(config, TEST_DIR);

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(content.existing).toBe(true);
    expect(content.nested.a).toBe(1);
    expect(content.newField).toBe(true);
  });

  it('should generate empty settings.json when no gemini options are configured', async () => {
    await generate({}, TEST_DIR);

    const filePath = path.join(TEST_DIR, '.gemini', 'settings.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(content).toEqual({});
  });

  it('should write agents.skills to settings.json', async () => {
    await generate(
      {
        agents: {
          reviewer: {
            prompt: 'Review code',
            skills: ['review-skill'],
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

  it('should generate Agent Skills directories with SKILL.md and assets', async () => {
    const config = {
      skills: {
        'test-skill': {
          name: 'test-skill',
          description: 'A test skill',
          content: 'Skill instructions',
          metadata: { version: '1.0.0' },
          references: {
            'REF.md': 'Reference content'
          },
          assets: {
            'image.png': 'Fake image data'
          }
        }
      }
    };

    await generate(config, TEST_DIR);

    const skillDir = path.join(TEST_DIR, '.gemini', 'skills', 'test-skill');
    expect(fs.existsSync(skillDir)).toBe(true);

    const skillMdPath = path.join(skillDir, 'SKILL.md');
    expect(fs.existsSync(skillMdPath)).toBe(true);
    const skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
    expect(skillMdContent).toContain('name: test-skill');
    expect(skillMdContent).toContain('description: A test skill');
    expect(skillMdContent).toContain('version: 1.0.0');
    expect(skillMdContent).toContain('Skill instructions');

    const refPath = path.join(skillDir, 'references', 'REF.md');
    expect(fs.existsSync(refPath)).toBe(true);
    expect(fs.readFileSync(refPath, 'utf8')).toBe('Reference content');

    const assetPath = path.join(skillDir, 'assets', 'image.png');
    expect(fs.existsSync(assetPath)).toBe(true);
    expect(fs.readFileSync(assetPath, 'utf8')).toBe('Fake image data');
  });
});
