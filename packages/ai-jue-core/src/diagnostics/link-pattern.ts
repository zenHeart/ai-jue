import fs from 'fs';
import path from 'path';

/**
 * Project-relative Skill roots that Agent clients scan for directory entries.
 * Only immediate children are classified; apply still materializes regular
 * files and directories, so this module stays read-only.
 */
export const PROJECT_SKILL_ROOTS = [
  '.claude/skills',
  '.cursor/skills',
  '.codex/skills',
  '.agents/skills',
] as const;

export type LinkPatternCode =
  | 'broken-symlink'
  | 'symlink-checkout-degraded'
  | 'cross-tool-symlink'
  | 'cross-repo-symlink';

export interface LinkPatternFinding {
  severity: 'error' | 'warn';
  code: LinkPatternCode;
  path: string;
  target?: string;
  expectedTarget?: string;
  remediation: string;
  evidence: string;
}

const EVIDENCE_LIMIT = 200;
const DEGRADED_MAX_BYTES = 512;

function clipEvidence(value: string): string {
  return value.length <= EVIDENCE_LIMIT ? value : value.slice(0, EVIDENCE_LIMIT);
}

function toPosixRelative(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

function isInsideProject(projectRoot: string, candidate: string): boolean {
  const root = path.resolve(projectRoot);
  const resolved = path.resolve(candidate);
  const relative = path.relative(root, resolved);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isEscapingTarget(rawTarget: string): boolean {
  return rawTarget.startsWith('~') || path.isAbsolute(rawTarget);
}

function looksLikeLinkTarget(content: string): boolean {
  const text = content.trim();
  if (!text || text.length > DEGRADED_MAX_BYTES) {
    return false;
  }
  if (text.includes('\n') || text.includes('\0')) {
    return false;
  }
  if (text.startsWith('---') || text.startsWith('#')) {
    return false;
  }
  if (isEscapingTarget(text)) {
    return true;
  }
  return /^(?:\.\.\/|\.\/)[A-Za-z0-9._/@-]+/.test(text) || /^\.[A-Za-z0-9._-]+\/[A-Za-z0-9._/@-]+/.test(text);
}

function redactTarget(rawTarget: string, resolvedTarget: string, projectRoot: string, inside: boolean): string {
  if (!inside || isEscapingTarget(rawTarget)) {
    return '<outside-project>';
  }
  return path.isAbsolute(rawTarget) ? toPosixRelative(projectRoot, resolvedTarget) : rawTarget;
}

function classifySymlink(
  projectRoot: string,
  relativePath: string,
  rawTarget: string,
  parentDir: string,
): LinkPatternFinding {
  const resolvedTarget = path.resolve(parentDir, rawTarget);
  const inside = !isEscapingTarget(rawTarget) && isInsideProject(projectRoot, resolvedTarget);
  const safeTarget = redactTarget(rawTarget, resolvedTarget, projectRoot, inside);

  if (!inside) {
    return {
      severity: 'error',
      code: 'cross-repo-symlink',
      path: relativePath,
      target: safeTarget,
      remediation: 'Point the link at an in-repo path, or replace it with `jue apply`.',
      evidence: clipEvidence('lstat=symlink target-kind=outside'),
    };
  }

  if (!fs.existsSync(resolvedTarget)) {
    return {
      severity: 'error',
      code: 'broken-symlink',
      path: relativePath,
      target: safeTarget,
      remediation: 'Restore the target or re-run `jue apply`.',
      evidence: clipEvidence(`lstat=symlink target=${safeTarget}`),
    };
  }

  return {
    severity: 'warn',
    code: 'cross-tool-symlink',
    path: relativePath,
    target: safeTarget,
    remediation: 'Prefer `jue apply` to materialize each Agent root.',
    evidence: clipEvidence(`lstat=symlink target=${safeTarget}`),
  };
}

/**
 * Read-only classification of project-layer Skill link patterns. Findings use
 * repository-relative paths so diagnostics stay portable and redacted.
 */
export function diagnoseLinkPattern(projectRoot: string): LinkPatternFinding[] {
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('diagnoseLinkPattern requires a project root');
  }
  if (!fs.existsSync(projectRoot)) {
    throw new Error('diagnoseLinkPattern project root does not exist');
  }

  const root = path.resolve(projectRoot);
  const findings: LinkPatternFinding[] = [];

  for (const skillRoot of PROJECT_SKILL_ROOTS) {
    const absRoot = path.join(root, skillRoot);
    let rootStat: fs.Stats;
    try {
      rootStat = fs.lstatSync(absRoot);
    } catch {
      continue;
    }
    if (!rootStat.isDirectory()) {
      continue;
    }

    let names: string[];
    try {
      names = fs.readdirSync(absRoot);
    } catch {
      continue;
    }

    for (const name of names) {
      if (name === '.' || name === '..') {
        continue;
      }
      const absEntry = path.join(absRoot, name);
      const relativePath = toPosixRelative(root, absEntry);
      let entry: fs.Stats;
      try {
        entry = fs.lstatSync(absEntry);
      } catch {
        continue;
      }

      if (entry.isSymbolicLink()) {
        let rawTarget = '';
        try {
          rawTarget = fs.readlinkSync(absEntry);
        } catch {
          continue;
        }
        findings.push(classifySymlink(root, relativePath, rawTarget, absRoot));
        continue;
      }

      if (!entry.isFile() || entry.size <= 0 || entry.size > DEGRADED_MAX_BYTES) {
        continue;
      }

      let content = '';
      try {
        content = fs.readFileSync(absEntry, 'utf8');
      } catch {
        continue;
      }
      if (!looksLikeLinkTarget(content)) {
        continue;
      }

      const expectedRaw = content.trim();
      const expectedTarget = isEscapingTarget(expectedRaw) ? '<outside-project>' : expectedRaw;
      findings.push({
        severity: 'error',
        code: 'symlink-checkout-degraded',
        path: relativePath,
        expectedTarget,
        remediation:
          'Restore a real symlink after enabling git core.symlinks, or replace the pattern with `jue apply`.',
        evidence: clipEvidence(
          isEscapingTarget(expectedRaw)
            ? 'lstat=file content-kind=outside'
            : `lstat=file content=${expectedTarget}`,
        ),
      });
    }
  }

  findings.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
  return findings;
}
