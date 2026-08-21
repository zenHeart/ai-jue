import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyChangesOrThrow,
  applyExecution,
  checkExecution,
  planExecution,
} from '../src/core-executor';
import { ArtifactChange, hashArtifactContent } from '../src/artifact-change';

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-core-executor-'));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function createChange(overrides: Partial<ArtifactChange> = {}): ArtifactChange {
  return {
    target: 'claude-code',
    kind: 'create',
    ownership: 'full',
    scope: 'project',
    path: 'notes.md',
    beforeHash: null,
    afterHash: hashArtifactContent('hello'),
    content: 'hello',
    risk: 'low',
    requiresApproval: false,
    atomicState: 'planned',
    ...overrides,
  };
}

describe('planExecution', () => {
  it('classifies a brand-new create as pending with zero writes', () => {
    const root = tempDir();
    const plan = planExecution(root, [createChange()]);
    expect(plan.pending).toHaveLength(1);
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.unauthorized).toHaveLength(0);
    expect(fs.existsSync(path.join(root, 'notes.md'))).toBe(false);
  });

  it('reports no pending work once the file already matches afterHash', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'notes.md'), 'hello');
    const plan = planExecution(root, [createChange()]);
    expect(plan.pending).toHaveLength(0);
    expect(plan.conflicts).toHaveLength(0);
  });

  it('flags drift when an update\'s beforeHash no longer matches the on-disk file', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'notes.md'), 'tampered');
    const change = createChange({
      kind: 'update',
      beforeHash: hashArtifactContent('hello'),
      afterHash: hashArtifactContent('world'),
      content: 'world',
    });
    const plan = planExecution(root, [change]);
    expect(plan.conflicts).toEqual([
      {
        path: 'notes.md',
        reason: 'modified',
        expectedHash: hashArtifactContent('hello'),
        actualHash: hashArtifactContent('tampered'),
      },
    ]);
  });

  it('flags drift when a create collides with a file that unexpectedly already exists', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'notes.md'), 'someone else wrote this');
    const plan = planExecution(root, [createChange()]);
    expect(plan.conflicts).toEqual([
      {
        path: 'notes.md',
        reason: 'unexpected-exists',
        expectedHash: null,
        actualHash: hashArtifactContent('someone else wrote this'),
      },
    ]);
  });

  it('flags drift when an update/delete target is missing on disk', () => {
    const root = tempDir();
    const change = createChange({
      kind: 'update',
      beforeHash: hashArtifactContent('hello'),
      afterHash: hashArtifactContent('world'),
      content: 'world',
    });
    const plan = planExecution(root, [change]);
    expect(plan.conflicts).toEqual([
      { path: 'notes.md', reason: 'missing', expectedHash: hashArtifactContent('hello'), actualHash: null },
    ]);
  });

  it('routes a requiresApproval change to unauthorized unless its path is authorized', () => {
    const root = tempDir();
    const change = createChange({ requiresApproval: true });
    const blocked = planExecution(root, [change]);
    expect(blocked.unauthorized).toEqual([change]);
    expect(blocked.pending).toHaveLength(0);

    const allowed = planExecution(root, [change], { authorizedTargets: new Set(['notes.md']) });
    expect(allowed.unauthorized).toHaveLength(0);
    expect(allowed.pending).toEqual([change]);
  });

  it('rejects changes whose scope does not match the authorized apply scope', () => {
    const root = tempDir();
    expect(() =>
      planExecution(root, [createChange({ scope: 'user' })], { expectedScope: 'project' }),
    ).toThrow('scope');
    expect(fs.existsSync(path.join(root, 'notes.md'))).toBe(false);
  });

  it('validates every ArtifactChange before reading from disk', () => {
    const root = tempDir();
    expect(() =>
      planExecution(root, [createChange({ path: '../outside.md' })]),
    ).toThrow('safe artifact-root-relative path');
  });

  it('rejects a target whose existing parent symlink escapes the authorized root', () => {
    const root = tempDir();
    const outside = tempDir();
    fs.symlinkSync(outside, path.join(root, 'escape'), 'dir');

    expect(() =>
      planExecution(root, [createChange({ path: 'escape/notes.md' })]),
    ).toThrow('authorized root');
    expect(fs.existsSync(path.join(outside, 'notes.md'))).toBe(false);
  });
});

describe('applyExecution', () => {
  it('performs zero writes and reports "no-change" when nothing is pending', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'notes.md'), 'hello');
    const result = applyExecution(root, [createChange()]);
    expect(result.status).toBe('no-change');
  });

  it('writes pending changes and reports "applied"', () => {
    const root = tempDir();
    const change = createChange();
    const result = applyExecution(root, [change]);
    expect(result.status).toBe('applied');
    expect(fs.readFileSync(path.join(root, 'notes.md'), 'utf8')).toBe('hello');
    expect(result.results).toEqual([{ change: expect.objectContaining({ atomicState: 'applied' }), applied: true }]);
    // The plan's `pending` list still reflects what was applied, so a caller
    // reporting the outcome doesn't see an empty plan for a real write.
    expect(result.pending).toEqual([change]);
  });

  it('blocks with zero writes when a conflict is present, even alongside a clean change', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'tampered.md'), 'not what we expected');
    const changes = [
      createChange({ path: 'clean.md' }),
      createChange({
        path: 'tampered.md',
        kind: 'update',
        beforeHash: hashArtifactContent('expected'),
        afterHash: hashArtifactContent('world'),
        content: 'world',
      }),
    ];
    const result = applyExecution(root, changes);
    expect(result.status).toBe('blocked-conflict');
    expect(result.conflicts).toHaveLength(1);
    expect(fs.existsSync(path.join(root, 'clean.md'))).toBe(false);
  });

  it('blocks with zero writes when a change requires approval that was not granted', () => {
    const root = tempDir();
    const result = applyExecution(root, [createChange({ requiresApproval: true })]);
    expect(result.status).toBe('blocked-unauthorized');
    expect(fs.existsSync(path.join(root, 'notes.md'))).toBe(false);
  });

  it('rolls back every change already applied in the batch when a later write fails', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'existing.md'), 'original');
    const changes = [
      createChange({ path: 'existing.md', kind: 'update', beforeHash: hashArtifactContent('original'), afterHash: hashArtifactContent('updated'), content: 'updated' }),
      createChange({ path: 'new.md' }),
      // "broken" already exists as a plain file, so creating a directory at
      // "broken/nested.md" during the write step throws ENOTDIR mid-batch.
      createChange({ path: 'broken/nested.md' }),
    ];
    fs.writeFileSync(path.join(root, 'broken'), 'not a directory');

    const result = applyExecution(root, changes);

    expect(result.status).toBe('rolled-back');
    expect(fs.readFileSync(path.join(root, 'existing.md'), 'utf8')).toBe('original');
    expect(fs.existsSync(path.join(root, 'new.md'))).toBe(false);
  });

  it('rolls back a partial user-scope batch inside the authorized user root', () => {
    const userRoot = tempDir();
    fs.writeFileSync(path.join(userRoot, 'existing.md'), 'original');
    fs.writeFileSync(path.join(userRoot, 'broken'), 'not a directory');
    const changes = [
      createChange({
        scope: 'user',
        path: 'existing.md',
        kind: 'update',
        beforeHash: hashArtifactContent('original'),
        afterHash: hashArtifactContent('updated'),
        content: 'updated',
      }),
      createChange({ scope: 'user', path: 'new.md' }),
      createChange({ scope: 'user', path: 'broken/nested.md' }),
    ];

    const result = applyExecution(userRoot, changes, { expectedScope: 'user' });

    expect(result.status).toBe('rolled-back');
    expect(fs.readFileSync(path.join(userRoot, 'existing.md'), 'utf8')).toBe('original');
    expect(fs.existsSync(path.join(userRoot, 'new.md'))).toBe(false);
  });

  it('second apply of the same changes is idempotent (zero further writes)', () => {
    const root = tempDir();
    applyExecution(root, [createChange()]);
    const mtimeBefore = fs.statSync(path.join(root, 'notes.md')).mtimeMs;
    const second = applyExecution(root, [createChange()]);
    expect(second.status).toBe('no-change');
    expect(fs.statSync(path.join(root, 'notes.md')).mtimeMs).toBe(mtimeBefore);
  });
});

describe('checkExecution', () => {
  it('never writes and reports "pending" when changes would be needed', () => {
    const root = tempDir();
    const result = checkExecution(root, [createChange()]);
    expect(result.status).toBe('pending');
    expect(fs.existsSync(path.join(root, 'notes.md'))).toBe(false);
  });

  it('reports "no-change" when the desired state already exists', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'notes.md'), 'hello');
    const result = checkExecution(root, [createChange()]);
    expect(result.status).toBe('no-change');
  });

  it('reports "blocked-conflict" for on-disk drift', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'notes.md'), 'tampered');
    const change = createChange({ kind: 'update', beforeHash: hashArtifactContent('hello'), afterHash: hashArtifactContent('world'), content: 'world' });
    const result = checkExecution(root, [change]);
    expect(result.status).toBe('blocked-conflict');
  });
});

describe('applyChangesOrThrow', () => {
  it('writes changes and returns their results', () => {
    const root = tempDir();
    const results = applyChangesOrThrow(root, [createChange()]);
    expect(results).toHaveLength(1);
    expect(fs.readFileSync(path.join(root, 'notes.md'), 'utf8')).toBe('hello');
  });

  it('throws with the conflict detail when blocked by drift', () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, 'notes.md'), 'someone else wrote this');
    expect(() => applyChangesOrThrow(root, [createChange()])).toThrow('notes.md');
  });
});
