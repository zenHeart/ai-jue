import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generate as generateClaude } from '../../ai-jue-adapter-claude/src/index';
import { generate as generateCursor } from '../../ai-jue-adapter-cursor/src/index';
import { generate as generateGemini } from '../../ai-jue-adapter-gemini/src/index';
import { generate as generateCopilot } from '../../ai-jue-adapter-copilot/src/index';
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
        gemini: { temperature: 0.2 },
        copilot: { codeReview: true },
      },
      agents: {
        reviewer: { prompt: 'Review changes', skills: ['review'] },
      },
    };

    await Promise.all([
      generateCursor(config, TEST_DIR),
      generateGemini(config, TEST_DIR),
      generateCopilot(config, TEST_DIR),
    ]);
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
      path.join(TEST_DIR, '.claude', 'skills', 'test', 'SKILL.md'),
      'utf8',
    );
    const claudeAgent = fs.readFileSync(
      path.join(TEST_DIR, '.claude', 'agents', 'reviewer.md'),
      'utf8',
    );
    const claudeSettings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.claude', 'settings.json'), 'utf8'),
    );
    const geminiMd = fs.readFileSync(path.join(TEST_DIR, 'GEMINI.md'), 'utf8');
    const gemini = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.gemini', 'settings.json'), 'utf8'),
    );
    const geminiCommand = fs.readFileSync(
      path.join(TEST_DIR, '.gemini', 'commands', 'test.toml'),
      'utf8',
    );
    const copilot = fs.readFileSync(
      path.join(TEST_DIR, '.github', 'copilot-instructions.md'),
      'utf8',
    );
    const copilotRule = fs.readFileSync(
      path.join(TEST_DIR, '.github', 'instructions', 'style.instructions.md'),
      'utf8',
    );
    const copilotSettings = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.github', 'copilot-settings.json'), 'utf8'),
    );

    const claudeRule = fs.readFileSync(path.join(TEST_DIR, '.claude', 'rules', 'style.md'), 'utf8');
    const codexSkill = fs.readFileSync(
      path.join(TEST_DIR, '.agents', 'skills', 'review', 'SKILL.md'),
      'utf8',
    );
    const codexCommand = fs.readFileSync(
      path.join(TEST_DIR, '.agents', 'skills', 'test', 'SKILL.md'),
      'utf8',
    );
    const codexAgent = parseToml(
      fs.readFileSync(path.join(TEST_DIR, '.codex', 'agents', 'reviewer.toml'), 'utf8'),
    ) as any;
    const codexConfig = parseToml(
      fs.readFileSync(path.join(TEST_DIR, '.codex', 'config.toml'), 'utf8'),
    ) as any;
    const codexHooks = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, '.codex', 'hooks.json'), 'utf8'),
    );

    expect(claude).toContain('@AGENTS.md');
    expect(agentsMd).toContain('## Rule: style');
    expect(codexSkill).toContain('Review skill');
    expect(codexCommand).toContain('Run test suite');
    expect(codexAgent.developer_instructions).toBe('Review changes');
    expect(codexConfig.approval_policy).toBe('on-request');
    expect(codexConfig.mcp_servers.sqlite.command).toBe('uvx');
    expect(codexHooks.hooks.PostToolUse[0].matcher).toBe('Edit|Write');
    expect(codexHooks.hooks.PostToolUse[0].hooks[0].command).toBe('npm test');
    expect(codexHooks.hooks.PostToolUse[0].hooks[0].timeout).toBe(30);
    expect(codexHooks.hooks.PostToolUse[0].hooks[0].async).toBeUndefined();
    expect(claudeRule).toContain('Use strict typing');
    expect(claudeRule).toContain('paths:');
    expect(claudeRule).toContain('auto-apply: true');
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
    expect(claudeCommand).toContain('disable-model-invocation: true');
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
    expect(geminiMd).toContain('Rules (Degraded)');
    expect(geminiMd).toContain('Use strict typing');
    expect(copilot).toContain('Global context');
    expect(copilotRule).toContain('Use strict typing');
    expect(copilotRule).toContain('applyTo: "src/**/*.ts"');
    expect(geminiCommand).toContain('description = "Run tests"');
    expect(geminiCommand).toContain('Run test suite');
    expect(gemini.hooks.PostToolUse).toBe('npm test');
    expect(gemini.mcpServers.sqlite.command).toBe('uvx');
    expect(gemini.temperature).toBe(0.2);
    expect(copilotSettings.codeReview).toBe(true);
  });
});
