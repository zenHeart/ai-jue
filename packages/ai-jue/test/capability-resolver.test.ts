import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolveFinalConfig } from '../src/resolver';

describe('resolveFinalConfig Capability Source integration', () => {
  it('resolves project capabilities before normalization and writes a redacted lock', async () => {
    const projectDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'jue-capability-project-'),
    );
    const skillDir = path.join(projectDir, 'vendor', 'neutral-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\ndescription: Neutral project skill\n---\nProject capability',
    );
    const originalCwd = process.cwd();
    process.chdir(projectDir);
    try {
      const config = await resolveFinalConfig(
        {
          capabilities: {
            'neutral-skill': {
              source: 'file:./vendor/neutral-skill',
              type: 'skill',
            },
          },
        },
        { cacheDir: path.join(projectDir, 'cache') },
      );
      expect(config.capabilities).toBeUndefined();
      expect(config.skills?.['neutral-skill']?.content).toContain(
        'Project capability',
      );
      const lock = JSON.parse(
        fs.readFileSync(path.join(projectDir, 'ai-jue.lock'), 'utf8'),
      );
      expect(lock.capabilities['neutral-skill'].sourceType).toBe('file');
      expect(JSON.stringify(lock)).not.toContain(projectDir);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it('removes a stale ai-jue.lock when the current run resolves zero capabilities', async () => {
    const projectDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'jue-capability-project-'),
    );
    const skillDir = path.join(projectDir, 'vendor', 'neutral-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\ndescription: Neutral project skill\n---\nProject capability',
    );
    const originalCwd = process.cwd();
    process.chdir(projectDir);
    try {
      await resolveFinalConfig(
        {
          capabilities: {
            'neutral-skill': {
              source: 'file:./vendor/neutral-skill',
              type: 'skill',
            },
          },
        },
        { cacheDir: path.join(projectDir, 'cache') },
      );
      const lockPath = path.join(projectDir, 'ai-jue.lock');
      expect(fs.existsSync(lockPath)).toBe(true);

      // Simulate the user removing all ai.capabilities from their config and
      // re-running. The previous run's lock must not linger and be
      // misread as evidence that a Capability was resolved this run.
      await resolveFinalConfig({}, { cacheDir: path.join(projectDir, 'cache') });

      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it('keeps ai-jue.lock unchanged when resolution is read-only', async () => {
    const projectDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'jue-capability-read-only-'),
    );
    const skillDir = path.join(projectDir, 'vendor', 'neutral-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\ndescription: Neutral project skill\n---\nProject capability',
    );
    const lockPath = path.join(projectDir, 'ai-jue.lock');
    const existingLock = '{"version":1,"capabilities":{"existing":{}}}\n';
    fs.writeFileSync(lockPath, existingLock);
    const originalCwd = process.cwd();
    process.chdir(projectDir);
    try {
      await resolveFinalConfig(
        {
          capabilities: {
            'neutral-skill': {
              source: 'file:./vendor/neutral-skill',
              type: 'skill',
            },
          },
        },
        {
          cacheDir: path.join(projectDir, 'cache'),
          persistLock: false,
        },
      );

      expect(fs.readFileSync(lockPath, 'utf8')).toBe(existingLock);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
