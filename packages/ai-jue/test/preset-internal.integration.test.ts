import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveFinalConfig } from '../src/resolver';
import { generate as generateClaude } from '../../ai-jue-adapter-claude/src/index';
import { generate as generateCursor } from '../../ai-jue-adapter-cursor/src/index';

describe('jue-preset-internal bootstrap integration', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-internal-integration-'));

  beforeEach(() => {
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('loads internal AGENTS, internal commands, and nested base commands', async () => {
    const config = await resolveFinalConfig({ preset: 'internal', language: 'zh-CN' } as any);

    expect(config.context?.global).toBeTruthy();
    expect(config.commands?.['repo-governance']?.prompt).toBeTruthy();
    expect(config.commands?.impl?.prompt).toBeTruthy();
    expect(config.skills?.['adapter-creator']?.content).toBeTruthy();
  });

  it('consumes internal preset across all adapters for self-bootstrap outputs', async () => {
    const config = await resolveFinalConfig({ preset: 'internal', language: 'zh-CN' } as any);

    await Promise.all([
      generateClaude(config, outDir),
      generateCursor(config, outDir),
    ]);

    expect(fs.existsSync(path.join(outDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'AGENTS.md'))).toBe(true);
  });

  it('keeps documentation claims consistent with shipped internal assets', () => {
    const internalDir = path.join(process.cwd(), 'packages', 'jue-preset-internal');
    const agentsPath = path.join(internalDir, 'AGENTS.md');
    const commandPath = path.join(
      internalDir,
      'commands',
      'repo-governance',
      'prompt.md',
    );
    const skillPath = path.join(
      internalDir,
      'skills',
      'adapter-creator',
      'SKILL.md',
    );

    expect(fs.existsSync(agentsPath)).toBe(true);
    expect(fs.existsSync(commandPath)).toBe(true);
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  it('ships a Cursor dual-layout creation contract with valid source paths', () => {
    const repoRoot = process.cwd();
    const skillPath = path.join(
      repoRoot,
      'packages',
      'jue-preset-internal',
      'skills',
      'adapter-creator',
      'SKILL.md',
    );
    const patternsPath = path.join(
      path.dirname(skillPath),
      'references',
      'IMPLEMENTATION-patterns.md',
    );
    const skill = fs.readFileSync(skillPath, 'utf8');
    const patterns = fs.readFileSync(patternsPath, 'utf8');

    expect(skill).toContain('Does the target expose multiple Artifact kinds?');
    expect(patterns).toContain('## 8. Cursor dual layout');

    const linkedSources = [
      'packages/ai-jue-adapter-cursor/src/capabilities/layout.ts',
      'packages/ai-jue-adapter-cursor/src/capabilities/skills.ts',
      'packages/ai-jue-adapter-cursor/src/capabilities/hooks.ts',
      'packages/ai-jue-adapter-cursor/src/capabilities/mcp.ts',
      'packages/ai-jue-adapter-cursor/src/capabilities/context.ts',
      'packages/ai-jue-adapter-cursor/src/capabilities/cursor-tools.ts',
      'packages/ai-jue-adapter-cursor/src/capabilities/manifest.ts',
      'packages/ai-jue-adapter-cursor/src/read.ts',
      'packages/ai-jue-adapter-cursor/src/write.ts',
      'packages/ai-jue-adapter-cursor/src/confirm.ts',
      'packages/ai-jue/src/artifact-kind.ts',
      'packages/ai-jue-adapter-cursor/test/contract.test.ts',
      'packages/ai-jue-adapter-cursor/test/hooks-shape.test.ts',
      'packages/ai-jue-adapter-cursor/test/plugin-manifest.test.ts',
      'packages/ai-jue-adapter-cursor/fixtures/README.md',
    ];
    for (const relativePath of linkedSources) {
      const relativeLink = `../../../../${relativePath.replace(/^packages\//, '')}`;
      expect(patterns.includes(relativePath) || patterns.includes(relativeLink)).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
    expect(patterns).not.toContain('packages/ai-jue-adapter-cursor/test/write.test.ts');
  });
});
