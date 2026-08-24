import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadAssetsFromDir } from '../src/preset';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-preset-dual-mode-test-'));
}

describe('Preset Loader Dual-Mode Asset Support', () => {
  it('loads flat single-file agents alongside directory-based agents', async () => {
    const dir = makeTempDir();

    // 1. Flat single-file agent
    const agentsDir = path.join(dir, 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.writeFileSync(
      path.join(agentsDir, 'synthetic-analyst.md'),
      `---
name: synthetic-analyst
description: Synthetic analyst agent
model: inherit
---
# Synthetic Analyst
Perform structured analysis without side effects.`,
    );

    // 2. Directory-based agent
    const complexAgentDir = path.join(agentsDir, 'synthetic-coordinator');
    fs.mkdirSync(complexAgentDir, { recursive: true });
    fs.writeFileSync(
      path.join(complexAgentDir, 'prompt.md'),
      `---
name: synthetic-coordinator
description: Synthetic multi-role coordinator agent
---
# Synthetic Coordinator
Coordinate specialized roles.`,
    );
    const config = await loadAssetsFromDir(dir, 'en');

    // Verify flat single-file agent
    expect(config.agents?.['synthetic-analyst']).toBeDefined();
    expect(config.agents?.['synthetic-analyst']?.name).toBe('synthetic-analyst');
    expect(config.agents?.['synthetic-analyst']?.description).toBe('Synthetic analyst agent');
    expect(config.agents?.['synthetic-analyst']?.model).toBe('inherit');
    expect(config.agents?.['synthetic-analyst']?.prompt).toContain('Perform structured analysis');

    // Verify directory-based agent
    expect(config.agents?.['synthetic-coordinator']).toBeDefined();
    expect(config.agents?.['synthetic-coordinator']?.name).toBe('synthetic-coordinator');
    expect(config.agents?.['synthetic-coordinator']?.description).toBe('Synthetic multi-role coordinator agent');
    expect(config.agents?.['synthetic-coordinator']?.prompt).toContain('Coordinate specialized roles');
  });

  it('loads flat single-file commands alongside directory-based commands', async () => {
    const dir = makeTempDir();
    const commandsDir = path.join(dir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });

    // Flat command
    fs.writeFileSync(
      path.join(commandsDir, 'format-all.md'),
      `---
description: Format all files
---
Run format across source files.`,
    );

    // Directory command
    const lintDir = path.join(commandsDir, 'lint-check');
    fs.mkdirSync(lintDir, { recursive: true });
    fs.writeFileSync(
      path.join(lintDir, 'prompt.md'),
      `---
description: Run linter checks
---
Execute linter on codebase.`,
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.commands?.['format-all']?.description).toBe('Format all files');
    expect(config.commands?.['format-all']?.prompt).toContain('Run format across source files');
    expect(config.commands?.['lint-check']?.description).toBe('Run linter checks');
    expect(config.commands?.['lint-check']?.prompt).toContain('Execute linter on codebase');
  });

  it('loads flat single-file rules alongside directory-based rules', async () => {
    const dir = makeTempDir();
    const rulesDir = path.join(dir, 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });

    // Flat rule
    fs.writeFileSync(
      path.join(rulesDir, 'code-style.md'),
      `---
title: Code Style Rule
---
Maintain consistent code conventions.`,
    );

    // Directory rule
    const securityDir = path.join(rulesDir, 'security-policy');
    fs.mkdirSync(securityDir, { recursive: true });
    fs.writeFileSync(
      path.join(securityDir, 'prompt.md'),
      `---
title: Security Policy
---
Enforce least privilege access.`,
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.rules?.['code-style']?.title).toBe('Code Style Rule');
    expect(config.rules?.['code-style']?.content).toContain('Maintain consistent code conventions');
    expect(config.rules?.['security-policy']?.title).toBe('Security Policy');
    expect(config.rules?.['security-policy']?.content).toContain('Enforce least privilege access');
  });

  it('loads flat single-file hooks alongside directory-based hooks', async () => {
    const dir = makeTempDir();
    const hooksDir = path.join(dir, 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });

    // Flat hook
    fs.writeFileSync(path.join(hooksDir, 'pre-commit.md'), `---
matcher: Write|Edit
async: true
---
npm run test:quick`);

    // Directory hook
    const postBuildDir = path.join(hooksDir, 'post-build');
    fs.mkdirSync(postBuildDir, { recursive: true });
    fs.writeFileSync(
      path.join(postBuildDir, 'prompt.md'),
      'npm run smoke',
    );

    const config = await loadAssetsFromDir(dir, 'en');
    expect(config.hooks?.['pre-commit']).toEqual({
      matcher: 'Write|Edit',
      async: true,
      script: 'npm run test:quick',
    });
    expect(config.hooks?.['post-build']).toBe('npm run smoke');
  });

  it('selects requested flat-file language variants without creating suffixed capabilities', async () => {
    const dir = makeTempDir();
    for (const section of ['commands', 'rules', 'agents', 'hooks']) {
      const sectionDir = path.join(dir, section);
      fs.mkdirSync(sectionDir, { recursive: true });
      fs.writeFileSync(path.join(sectionDir, 'demo.md'), 'Default body');
      fs.writeFileSync(path.join(sectionDir, 'demo.en.md'), 'English body');
    }

    const config = await loadAssetsFromDir(dir, 'en');

    expect(config.commands?.demo?.content).toBe('English body');
    expect(config.rules?.demo?.content).toBe('English body');
    expect(config.agents?.demo?.content).toBe('English body');
    expect(config.hooks?.demo).toBe('English body');
    expect(config.commands?.['demo.en']).toBeUndefined();
    expect(config.rules?.['demo.en']).toBeUndefined();
    expect(config.agents?.['demo.en']).toBeUndefined();
    expect(config.hooks?.['demo.en']).toBeUndefined();
  });

  it('rejects an id defined in both flat-file and directory mode', async () => {
    const dir = makeTempDir();
    const rulesDir = path.join(dir, 'rules');
    fs.mkdirSync(path.join(rulesDir, 'duplicate'), { recursive: true });
    fs.writeFileSync(path.join(rulesDir, 'duplicate.md'), 'Flat rule');
    fs.writeFileSync(path.join(rulesDir, 'duplicate', 'prompt.md'), 'Directory rule');

    await expect(loadAssetsFromDir(dir, 'en')).rejects.toThrow(
      'rules.duplicate is defined in both flat-file and directory mode',
    );
  });
});
