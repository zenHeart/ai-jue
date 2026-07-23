import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadAssetsFromDir } from '../src/preset';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-preset-test-'));
}

describe('loadAssetsFromDir', () => {
  it('loads AGENTS.md into context.global', async () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Global Context');

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.context?.global).toContain('Global Context');
  });

  it('loads commands from commands/*/prompt.md frontmatter', async () => {
    const dir = makeTempDir();
    const commandDir = path.join(dir, 'commands', 'review');
    fs.mkdirSync(commandDir, { recursive: true });
    fs.writeFileSync(
      path.join(commandDir, 'prompt.md'),
      `---
description: Review code
---
Review prompt`,
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.commands?.review?.description).toBe('Review code');
    expect(config.commands?.review?.prompt).toBe('Review prompt');
  });

  it('parses markdown yaml frontmatter and merges metadata', async () => {
    const dir = makeTempDir();
    const commandDir = path.join(dir, 'commands', 'refactor');
    fs.mkdirSync(commandDir, { recursive: true });
    fs.writeFileSync(
      path.join(commandDir, 'prompt.md'),
      `---
description: Better description
triggers: [/refactor, /cleanup]
---
Refactor body`,
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.commands?.refactor?.description).toBe('Better description');
    expect(config.commands?.refactor?.triggers).toEqual(['/refactor', '/cleanup']);
    expect(config.commands?.refactor?.prompt).toContain('Refactor body');
    expect(config.commands?.refactor?.prompt).not.toContain('description:');
  });

  it('loads skills from skills/*/SKILL.md frontmatter', async () => {
    const dir = makeTempDir();
    const skillDir = path.join(dir, 'skills', 'adapter-creator');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---
name: adapter-creator
description: Build adapter spec and implementation plan
---
# Adapter Creator

Create adapter docs first, then implementation.`,
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.skills?.['adapter-creator']?.name).toBe('adapter-creator');
    expect(config.skills?.['adapter-creator']?.description).toBe(
      'Build adapter spec and implementation plan',
    );
    expect(config.skills?.['adapter-creator']?.content).toContain(
      'Create adapter docs first',
    );
  });

  it('preserves nested text and binary skill resources', async () => {
    const dir = makeTempDir();
    const skillDir = path.join(dir, 'skills', 'deep-skill');
    fs.mkdirSync(path.join(skillDir, 'references', 'protocol', 'roles'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(skillDir, 'assets', 'fixtures'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: deep-skill\ndescription: Deep skill\n---\nUse nested resources.',
    );
    fs.writeFileSync(
      path.join(skillDir, 'references', 'protocol', 'roles', 'reviewer.md'),
      '# Reviewer',
    );
    const binary = Buffer.from([0, 255, 10, 128]);
    fs.writeFileSync(
      path.join(skillDir, 'assets', 'fixtures', 'sample.bin'),
      binary,
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(
      config.skills?.['deep-skill']?.references?.[
        'protocol/roles/reviewer.md'
      ],
    ).toBe('# Reviewer');
    expect(
      config.skills?.['deep-skill']?.assets?.['fixtures/sample.bin'],
    ).toEqual({
      content: binary.toString('base64'),
      encoding: 'base64',
    });
  });

  it('loads structured hooks without discarding canonical metadata', async () => {
    const dir = makeTempDir();
    const hookDir = path.join(dir, 'hooks', 'post-edit');
    fs.mkdirSync(hookDir, { recursive: true });
    fs.writeFileSync(
      path.join(hookDir, 'index.json'),
      JSON.stringify({
        script: 'npm test',
        matcher: 'Edit|Write',
        async: true,
        timeout: 30,
      }),
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.hooks?.['post-edit']).toEqual({
      script: 'npm test',
      matcher: 'Edit|Write',
      async: true,
      timeout: 30,
    });
  });

  it('loads MCP servers from the preset root mcp.json', async () => {
    const dir = makeTempDir();
    fs.writeFileSync(
      path.join(dir, 'mcp.json'),
      JSON.stringify({
        servers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
            scope: 'project',
          },
        },
      }),
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.mcp?.servers?.filesystem).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      scope: 'project',
    });
  });
});
