import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generate as generateClaude } from '../../ai-jue-adapter-claude/src/index';
import { generate as generateCursor } from '../../ai-jue-adapter-cursor/src/index';
import { generate as generateCodex } from '../../ai-jue-adapter-codex/src/index';
import { parse as parseToml } from '@iarna/toml';

const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-matrix-'));

describe('adapter contract matrix', () => {
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

  it('produces predictable outputs for shared canonical input', async () => {
    const config = {
      context: {
        global: 'Global context',
      },
      rules: {
        style: {
          description: 'Style guide',
          globs: ['src/**/*.ts'],
          alwaysApply: true,
          content: 'Use strict typing',
        },
      },
      skills: {
        review: {
          prompt: 'Review skill',
          references: {
            'protocol/roles/reviewer.md': '# Reviewer role',
          },
          assets: {
            'fixtures/sample.bin': {
              content: Buffer.from([0, 255, 10, 128]).toString('base64'),
              encoding: 'base64',
            },
          },
        },
      },
      commands: {
        test: { description: 'Run tests', prompt: 'Run test suite', triggers: ['/test'] },
      },
      hooks: {
        PostToolUse: {
          script: 'npm test',
          matcher: 'Edit|Write',
          async: true,
          timeout: 30,
        },
      },
      mcp: {
        servers: {
          sqlite: {
            command: 'uvx',
            args: ['mcp-server-sqlite'],
            scope: 'project',
            autoApprove: ['read'],
          },
        },
      },
      tools: {
        codex: { approval_policy: 'on-request' },
        claude: { permissions: { allow: ['Read'] } },
        cursor: { temperature: 0.3 },
      },
      agents: {
        reviewer: { prompt: 'Review changes', skills: ['review'] },
      },
    };

    await generateCursor(config, TEST_DIR);
    await generateCodex(config, TEST_DIR);
    await generateClaude(config, TEST_DIR);

    const claude = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf8');
    const agentsMd = fs.readFileSync(path.join(TEST_DIR, 'AGENTS.md'), 'utf8');
    const cursorStyleRule = fs.readFileSync(path.join(TEST_DIR, '.cursor', 'rules', 'style.mdc'), 'utf8');
    const cursorCommand = fs.readFileSync(
      path.join(TEST_DIR, '.cursor', 'commands', 'test.md'),
      'utf8',
    );
    const cursorSkill = fs.readFileSync(
      path.join(TEST_DIR, '.cursor', 'skills', 'review', 'SKILL.md'),
      'utf8',
    );
    const cursorHooks = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.cursor', 'hooks.json'), 'utf8'),
    );
    const cursorAgent = fs.readFileSync(
      path.join(TEST_DIR, '.cursor', 'agents', 'reviewer.md'),
      'utf8',
    );
    const cursorMcp = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.cursor', 'mcp.json'), 'utf8'),
    );
    const cursorSettings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.cursor', 'settings.json'), 'utf8'),
    );
    const claudeSkill = fs.readFileSync(
      path.join(TEST_DIR, '.claude', 'skills', 'review', 'SKILL.md'),
      'utf8',
    );
    const claudeCommand = fs.readFileSync(
      path.join(TEST_DIR, '.claude', 'commands', 'test.md'),
      'utf8',
    );
    const claudeAgent = fs.readFileSync(
      path.join(TEST_DIR, '.claude', 'agents', 'reviewer.md'),
      'utf8',
    );
    const claudeSettings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.claude', 'settings.json'), 'utf8'),
    );
    const claudeRule = fs.readFileSync(path.join(TEST_DIR, '.claude', 'rules', 'style.md'), 'utf8');
    const codexSkill = fs.readFileSync(
      path.join(TEST_DIR, '.agents', 'skills', 'review', 'SKILL.md'),
      'utf8',
    );
    // The new Codex Adapter (JUE-301) honestly reports `commands` as
    // `degraded` — Codex's custom-commands mechanism was deprecated per
    // JUE-104/105/JUE-301 Phase 1, so a separate commands file is no
    // longer emitted. The original `test` command still flows into the
    // skills surface (where the runtime maps it to a slash command).
    const codexAgent = parseToml(
      fs.readFileSync(path.join(TEST_DIR, '.codex', 'agents', 'reviewer.toml'), 'utf8'),
    ) as any;
    // `tools.codex` (approval_policy, sandbox_mode, ...) and `mcp` (mcp_servers)
    // are NOT projected by the new Codex Adapter — Codex's project-config and
    // mcp config live in the same TOML file at .codex/config.toml; the
    // JUE-301 honest `unsupported`/`degraded` stance treats them as out of
    // scope for the JSON-based capability-mapping engine (a real TOML-aware
    // mapping would be a follow-up). config.toml may not exist on disk.
    const codexConfigPath = path.join(TEST_DIR, '.codex', 'config.toml');
    const codexConfig = fs.existsSync(codexConfigPath)
      ? (parseToml(fs.readFileSync(codexConfigPath, 'utf8')) as any)
      : {};
    const codexHooks = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.codex', 'hooks.json'), 'utf8'),
    );

    // Claude Code only ever reads CLAUDE.md natively (never AGENTS.md on its
    // own), so context.global is written directly into CLAUDE.md rather
    // than via a separate AGENTS.md + `@AGENTS.md` import.
    expect(claude).toContain('Global context');
    expect(codexSkill).toContain('Review skill');
    expect(codexAgent.developer_instructions).toBe('Review changes');
    // tools.codex and mcp.servers are NOT projected (honest unsupported/
    // degraded per JUE-301); config.toml is either absent or empty.
    expect(codexConfig.approval_policy).toBeUndefined();
    expect(codexConfig.mcp_servers).toBeUndefined();
    expect(codexHooks.hooks.PostToolUse[0].matcher).toBe('Edit|Write');
    expect(codexHooks.hooks.PostToolUse[0].hooks[0].command).toBe('npm test');
    expect(codexHooks.hooks.PostToolUse[0].hooks[0].timeout).toBe(30);
    // The new Codex Adapter passes `async` through to the inner hook
    // (same as Claude's `capabilities/hooks.ts` does). The legacy
    // `normalizeCodexHook` helper dropped it, which the JUE-301 honest
    // approach explicitly reverses.
    expect(codexHooks.hooks.PostToolUse[0].hooks[0].async).toBe(true);
    expect(claudeRule).toContain('Use strict typing');
    expect(claudeRule).toContain('paths:');
    // Only `globs` -> `paths` is a verified Claude Code rule frontmatter
    // rename (see packages/docs/agents/claude-code.md); `alwaysApply` has no
    // verified Claude-native equivalent, so it passes through unrenamed.
    expect(claudeRule).toContain('alwaysApply: true');
    expect(claudeSkill).toContain('Review skill');
    expect(
      fs.readFileSync(
        path.join(
          TEST_DIR,
          '.claude',
          'skills',
          'review',
          'references',
          'protocol',
          'roles',
          'reviewer.md',
        ),
        'utf8',
      ),
    ).toBe('# Reviewer role');
    expect(claudeCommand).toContain('Run test suite');
    expect(claudeAgent).toContain('Review changes');
    expect(agentsMd).toContain('Global context');
    expect(cursorStyleRule).toContain('Use strict typing');
    expect(cursorStyleRule).toContain('alwaysApply: true');
    expect(cursorCommand).toContain('Run test suite');
    expect(cursorCommand).toContain('/test');
    expect(cursorSkill).toContain('Review skill');
    expect(
      fs.readFileSync(
        path.join(
          TEST_DIR,
          '.cursor',
          'skills',
          'review',
          'references',
          'protocol',
          'roles',
          'reviewer.md',
        ),
        'utf8',
      ),
    ).toBe('# Reviewer role');
    expect(
      fs.readFileSync(
        path.join(
          TEST_DIR,
          '.cursor',
          'skills',
          'review',
          'assets',
          'fixtures',
          'sample.bin',
        ),
      ),
    ).toEqual(Buffer.from([0, 255, 10, 128]));
    expect(cursorHooks.PostToolUse.matcher).toBe('Edit|Write');
    expect(cursorHooks.PostToolUse.async).toBe(true);
    expect(cursorHooks.PostToolUse.timeout).toBe(30);
    expect(cursorAgent).toContain('Review changes');
    expect(cursorAgent).toContain('- review');
    expect(cursorMcp.mcpServers.sqlite.autoApprove).toEqual(['read']);
    expect(cursorSettings.temperature).toBe(0.3);
    expect(claudeSettings.permissions.allow).toEqual(['Read']);
    expect(claudeSettings.hooks.PostToolUse[0].matcher).toBe('Edit|Write');
    expect(claudeSettings.hooks.PostToolUse[0].hooks[0].async).toBe(true);
  });
});
