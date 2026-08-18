import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { applyChangesOrThrow, toCanonicalDocument } from 'ai-jue-core';
import extension from '../src/index';
import { resolveAdapterAlias } from '../../ai-jue/src/commands/apply';

const TEST_DIR = path.join(__dirname, 'temp_output');

async function applyProject(config: any, outputDir: string): Promise<void> {
  const adapter = extension.adapters[0];
  const toolsConfig = config?.tools?.claude;
  const changes = await adapter.write(toCanonicalDocument(config), {
    projectRoot: outputDir,
    artifactRoot: outputDir,
    scope: 'project',
    artifactKind: 'project',
    toolsConfig: toolsConfig && Object.keys(toolsConfig).length > 0 ? toolsConfig : undefined,
  } as any);
  applyChangesOrThrow(outputDir, changes);
}

describe('ai-jue-adapter-claude Extension', () => {
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

  it('supports both Claude Code CLI aliases', () => {
    expect(resolveAdapterAlias('claude')).toBe('ai-jue-adapter-claude');
    expect(resolveAdapterAlias('claude-code')).toBe('ai-jue-adapter-claude');
  });

  it('writes context.global directly into CLAUDE.md (Claude Code reads only CLAUDE.md, never AGENTS.md)', async () => {
    await applyProject({ context: { global: 'Claude Context' } }, TEST_DIR);

    expect(fs.existsSync(path.join(TEST_DIR, 'AGENTS.md'))).toBe(false);
    const claudeMd = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('Claude Context');
  });

  it('writes rules to .claude/rules/', async () => {
    await applyProject(
      {
        rules: {
          security: { description: 'Security rules', globs: ['*.ts'], content: 'Never log secrets' },
        },
      },
      TEST_DIR,
    );

    const content = fs.readFileSync(path.join(TEST_DIR, '.claude', 'rules', 'security.md'), 'utf8');
    expect(content).toContain('paths:');
    expect(content).toContain('*.ts');
    expect(content).toContain('Never log secrets');
  });

  it('writes commands to .claude/commands/ as their own directory (not merged into skills)', async () => {
    await applyProject(
      { commands: { deploy: { description: 'Deploy app', content: 'Deploy instruction' } } },
      TEST_DIR,
    );

    expect(fs.existsSync(path.join(TEST_DIR, '.claude', 'commands', 'deploy.md'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, '.claude', 'skills', 'deploy'))).toBe(false);
    const content = fs.readFileSync(path.join(TEST_DIR, '.claude', 'commands', 'deploy.md'), 'utf8');
    expect(content).toContain('Deploy instruction');
  });

  it('writes skills to .claude/skills/, including attachment bundles', async () => {
    await applyProject(
      {
        skills: {
          review: {
            name: 'review-skill',
            description: 'Review code',
            content: 'Review instruction',
            references: { 'notes.md': 'Reference notes' },
          },
        },
      },
      TEST_DIR,
    );

    const skillMd = fs.readFileSync(path.join(TEST_DIR, '.claude', 'skills', 'review', 'SKILL.md'), 'utf8');
    expect(skillMd).toContain('name: review-skill');
    expect(skillMd).toContain('Review instruction');
    expect(
      fs.readFileSync(path.join(TEST_DIR, '.claude', 'skills', 'review', 'references', 'notes.md'), 'utf8'),
    ).toBe('Reference notes');
  });

  it('writes agents to .claude/agents/', async () => {
    await applyProject(
      { agents: { 'code-reviewer': { description: 'Reviews code for quality', content: 'You are a code reviewer.' } } },
      TEST_DIR,
    );

    const content = fs.readFileSync(path.join(TEST_DIR, '.claude', 'agents', 'code-reviewer.md'), 'utf8');
    expect(content).toContain('description: Reviews code for quality');
    expect(content).toContain('You are a code reviewer.');
  });

  it('writes hooks into .claude/settings.json and MCP servers into .mcp.json', async () => {
    await applyProject(
      {
        mcp: { servers: { sqlite: { command: 'uvx', args: ['mcp-server-sqlite'] } } },
        hooks: { PreToolUse: { script: 'npm test', matcher: 'Write' } },
      },
      TEST_DIR,
    );

    const mcpConfig = JSON.parse(fs.readFileSync(path.join(TEST_DIR, '.mcp.json'), 'utf8'));
    expect(mcpConfig.mcpServers.sqlite.command).toBe('uvx');

    const settings = JSON.parse(fs.readFileSync(path.join(TEST_DIR, '.claude', 'settings.json'), 'utf8'));
    expect(settings.hooks.PreToolUse[0].matcher).toBe('Write');
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe('npm test');
  });

  it('merges tools.claude passthrough settings into settings.json alongside hooks', async () => {
    await applyProject(
      {
        hooks: { PreToolUse: 'npm test' },
        tools: { claude: { statusLine: { type: 'command', command: './status.sh' } } },
      },
      TEST_DIR,
    );

    const settings = JSON.parse(fs.readFileSync(path.join(TEST_DIR, '.claude', 'settings.json'), 'utf8'));
    expect(settings.hooks.PreToolUse).toBeDefined();
    expect(settings.statusLine).toEqual({ type: 'command', command: './status.sh' });
  });

  it('preserves nested UTF-8/binary attachments, user content, and is idempotent on a second apply', async () => {
    fs.writeFileSync(path.join(TEST_DIR, 'CLAUDE.md'), '# Claude user notes\n');
    const config = {
      context: { global: 'Managed context' },
      skills: {
        review: {
          content: 'Review',
          references: { 'nested/说明.md': 'UTF-8 reference' },
          assets: {
            'fixtures/sample.bin': {
              content: Buffer.from([0, 255, 128]).toString('base64'),
              encoding: 'base64',
            },
          },
        },
      },
    };

    await applyProject(config, TEST_DIR);
    const first = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8');
    await applyProject(config, TEST_DIR);
    expect(fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8')).toBe(first);

    expect(first).toContain('# Claude user notes');
    expect(first).toContain('Managed context');
    expect(first.match(/<!-- AI-JUE:START -->/g)).toHaveLength(1);
    expect(
      fs.readFileSync(
        path.join(TEST_DIR, '.claude', 'skills', 'review', 'references', 'nested', '说明.md'),
        'utf8',
      ),
    ).toBe('UTF-8 reference');
    expect(
      fs.readFileSync(path.join(TEST_DIR, '.claude', 'skills', 'review', 'assets', 'fixtures', 'sample.bin')),
    ).toEqual(Buffer.from([0, 255, 128]));
  });

  it('rejects support-file path traversal', async () => {
    await expect(
      applyProject(
        { skills: { review: { content: 'Review', references: { '../secret.md': 'nope' } } } },
        TEST_DIR,
      ),
    ).rejects.toThrow('must stay inside');
  });

  it('produces no output for an empty config', async () => {
    await applyProject({}, TEST_DIR);
    expect(fs.readdirSync(TEST_DIR)).toEqual([]);
  });
});
