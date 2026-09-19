import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { diagnoseLinkPattern } from '../src/diagnostics/link-pattern';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-link-pattern-'));
  tempDirs.push(dir);
  return dir;
}

function trySymlink(target: string, linkPath: string): boolean {
  try {
    fs.symlinkSync(target, linkPath);
    return fs.lstatSync(linkPath).isSymbolicLink();
  } catch {
    return false;
  }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('diagnoseLinkPattern', () => {
  it('reports a degraded checkout file that stores a relative target path', () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, '.claude', 'skills'), { recursive: true });
    fs.writeFileSync(path.join(root, '.claude', 'skills', 'demo'), '../../.agents/skills/demo');

    const findings = diagnoseLinkPattern(root);

    expect(findings).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'symlink-checkout-degraded',
        path: '.claude/skills/demo',
        expectedTarget: '../../.agents/skills/demo',
      }),
    ]);
    expect(findings[0]?.evidence.length).toBeLessThanOrEqual(200);
    expect(findings[0]?.evidence).not.toContain(root);
  });

  it('skips ordinary skill files that are not path text', () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, '.claude', 'skills'), { recursive: true });
    fs.writeFileSync(path.join(root, '.claude', 'skills', 'README.md'), '# Skills\n');

    expect(diagnoseLinkPattern(root)).toEqual([]);
  });

  it('reports broken, in-repo, and out-of-repo symlinks when the host can create them', () => {
    const root = tempDir();
    const outside = tempDir();
    fs.mkdirSync(path.join(root, '.claude', 'skills'), { recursive: true });
    fs.mkdirSync(path.join(root, '.agents', 'skills', 'shared'), { recursive: true });
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'shared', 'SKILL.md'), '---\nname: shared\n---\n');
    fs.writeFileSync(path.join(outside, 'foreign.txt'), 'x');

    const created = [
      trySymlink('../../.agents/skills/missing', path.join(root, '.claude', 'skills', 'broken')),
      trySymlink('../../.agents/skills/shared', path.join(root, '.claude', 'skills', 'shared')),
      trySymlink(path.join(outside, 'foreign.txt'), path.join(root, '.claude', 'skills', 'foreign')),
    ];
    if (created.some((ok) => !ok)) {
      return;
    }

    const findings = diagnoseLinkPattern(root);
    const byCode = Object.fromEntries(findings.map((finding) => [finding.code, finding]));

    expect(byCode['broken-symlink']).toMatchObject({
      severity: 'error',
      path: '.claude/skills/broken',
      target: '../../.agents/skills/missing',
    });
    expect(byCode['cross-tool-symlink']).toMatchObject({
      severity: 'warn',
      path: '.claude/skills/shared',
      target: '../../.agents/skills/shared',
    });
    expect(byCode['cross-repo-symlink']).toMatchObject({
      severity: 'error',
      path: '.claude/skills/foreign',
      target: '<outside-project>',
    });
    expect(JSON.stringify(findings)).not.toContain(outside);
    expect(JSON.stringify(findings)).not.toContain(root);
  });

  it('rejects a missing project root', () => {
    expect(() => diagnoseLinkPattern(path.join(tempDir(), 'missing'))).toThrow(
      'project root does not exist',
    );
  });
});
