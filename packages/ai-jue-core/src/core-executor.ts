import fs from 'fs';
import path from 'path';
import {
  ArtifactChange,
  ArtifactResult,
  artifactContentBytes,
  assertArtifactChange,
  hashArtifactContent,
} from './artifact-change';
import type { ApplyScope } from './extension-host';

export type ExecutionStatus =
  | 'no-change'
  | 'pending'
  | 'applied'
  | 'blocked-conflict'
  | 'blocked-unauthorized'
  | 'rolled-back';

export type DriftReason = 'modified' | 'missing' | 'unexpected-exists';

export interface DriftConflict {
  path: string;
  reason: DriftReason;
  expectedHash: string | null;
  actualHash: string | null;
}

export interface ExecutionOptions {
  /** Artifact-root-relative paths whose `requiresApproval: true` change is authorized to run. */
  authorizedTargets?: ReadonlySet<string>;
  /** Scope authorized by the current apply invocation. */
  expectedScope?: ApplyScope;
}

export interface ExecutionPlan {
  /** Changes whose precondition holds and (if gated) is authorized — safe to write. */
  pending: ArtifactChange[];
  /** On-disk state doesn't match what the change assumed; the whole batch blocks. */
  conflicts: DriftConflict[];
  /** Precondition holds but the change needs approval that wasn't granted. */
  unauthorized: ArtifactChange[];
}

export interface ExecutionResult extends ExecutionPlan {
  status: ExecutionStatus;
  results: ArtifactResult[];
  error?: string;
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

/**
 * Resolves a target through its deepest existing parent so an Adapter cannot
 * escape the Core-authorized root through an existing symbolic link.
 */
function absolutePathFor(root: string, relativePath: string): string {
  const realRoot = fs.realpathSync(root);
  const absolute = path.resolve(realRoot, ...relativePath.split('/'));
  if (!isWithinRoot(realRoot, absolute)) {
    throw new Error(`ArtifactChange.path escapes the authorized root: ${relativePath}`);
  }

  let existingAncestor = absolute;
  while (!fs.existsSync(existingAncestor)) {
    const parent = path.dirname(existingAncestor);
    if (parent === existingAncestor) break;
    existingAncestor = parent;
  }
  const realAncestor = fs.realpathSync(existingAncestor);
  if (!isWithinRoot(realRoot, realAncestor)) {
    throw new Error(`ArtifactChange.path escapes the authorized root through a symlink: ${relativePath}`);
  }
  return absolute;
}

function currentHash(root: string, relativePath: string): string | null {
  const absolute = absolutePathFor(root, relativePath);
  if (!fs.existsSync(absolute)) return null;
  return hashArtifactContent(fs.readFileSync(absolute));
}

function driftReasonFor(
  kind: ArtifactChange['kind'],
  expectedHash: string | null,
  actualHash: string | null,
): DriftReason | undefined {
  if (kind === 'create') {
    return actualHash !== null ? 'unexpected-exists' : undefined;
  }
  // update / delete: the target must currently exist and match the recorded beforeHash.
  if (expectedHash === null) return undefined; // no known prior state to verify against
  if (actualHash === null) return 'missing';
  if (actualHash !== expectedHash) return 'modified';
  return undefined;
}

/**
 * Classifies each ArtifactChange against real on-disk state without writing
 * anything: already-satisfied changes (afterHash already on disk) are
 * dropped for idempotency, changes whose beforeHash no longer matches the
 * file become conflicts, and `requiresApproval` changes not covered by
 * `authorizedTargets` become unauthorized. This is the zero-write primitive
 * behind both `--dry-run` and `--check`.
 */
export function planExecution(
  root: string,
  changes: ArtifactChange[],
  options: ExecutionOptions = {},
): ExecutionPlan {
  const pending: ArtifactChange[] = [];
  const conflicts: DriftConflict[] = [];
  const unauthorized: ArtifactChange[] = [];

  for (const change of changes) {
    assertArtifactChange(change);
    if (options.expectedScope !== undefined && change.scope !== options.expectedScope) {
      throw new Error(
        `ArtifactChange.scope "${change.scope}" does not match authorized apply scope "${options.expectedScope}"`,
      );
    }
    const actualHash = currentHash(root, change.path);

    if (change.afterHash !== null && actualHash === change.afterHash) {
      continue; // desired state already on disk
    }

    const reason = driftReasonFor(change.kind, change.beforeHash, actualHash);
    if (reason) {
      conflicts.push({ path: change.path, reason, expectedHash: change.beforeHash, actualHash });
      continue;
    }

    if (change.requiresApproval && !options.authorizedTargets?.has(change.path)) {
      unauthorized.push(change);
      continue;
    }

    pending.push(change);
  }

  return { pending, conflicts, unauthorized };
}

function statusForPlan(plan: ExecutionPlan): ExecutionStatus {
  if (plan.conflicts.length > 0) return 'blocked-conflict';
  if (plan.unauthorized.length > 0) return 'blocked-unauthorized';
  if (plan.pending.length > 0) return 'pending';
  return 'no-change';
}

/**
 * Read-only variant of `applyExecution`: computes the same plan and never
 * writes, reporting `'pending'` when changes would still be needed (the
 * signal `jue apply --check` fails CI on).
 */
export function checkExecution(
  root: string,
  changes: ArtifactChange[],
  options: ExecutionOptions = {},
): ExecutionResult {
  const plan = planExecution(root, changes, options);
  return { ...plan, status: statusForPlan(plan), results: [] };
}

interface Snapshot {
  change: ArtifactChange;
  existed: boolean;
  originalContent: Buffer | null;
}

function snapshotBeforeWrite(root: string, change: ArtifactChange): Snapshot {
  const absolute = absolutePathFor(root, change.path);
  const existed = fs.existsSync(absolute);
  return { change, existed, originalContent: existed ? fs.readFileSync(absolute) : null };
}

function writeOne(root: string, change: ArtifactChange): void {
  const absolute = absolutePathFor(root, change.path);
  if (change.kind === 'delete') {
    fs.rmSync(absolute, { force: true });
    return;
  }
  if (change.content === undefined) {
    throw new Error(`ArtifactChange for "${change.path}" is missing content`);
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, artifactContentBytes(change.content));
}

function restoreSnapshot(root: string, snapshot: Snapshot): void {
  const absolute = absolutePathFor(root, snapshot.change.path);
  if (snapshot.existed) {
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, snapshot.originalContent as Buffer);
    return;
  }
  // The write that failed may never have created `absolute` — e.g. a parent
  // path component is a plain file (ENOTDIR on mkdir). On Linux, rmSync of
  // such a path throws ENOTDIR even with force:true; treat that as "already
  // clean" so earlier snapshots in the reverse-rollback loop still run.
  try {
    fs.rmSync(absolute, { force: true, recursive: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' && code !== 'ENOTDIR') throw error;
  }
}

interface AtomicOutcome {
  status: 'applied' | 'rolled-back';
  results: ArtifactResult[];
  error?: string;
}

/**
 * Applies pending changes atomically: each write is snapshotted immediately
 * before it happens, so a later failure in the same batch restores every
 * change already applied this call (original bytes, or deletes what didn't
 * exist before). Never partially commits a batch.
 */
function applyAtomically(root: string, pending: ArtifactChange[]): AtomicOutcome {
  const snapshots: Snapshot[] = [];
  const results: ArtifactResult[] = [];
  try {
    for (const change of pending) {
      snapshots.push(snapshotBeforeWrite(root, change));
      writeOne(root, change);
      results.push({ change: { ...change, atomicState: 'applied' }, applied: true });
    }
    return { status: 'applied', results };
  } catch (error) {
    for (const snapshot of [...snapshots].reverse()) {
      restoreSnapshot(root, snapshot);
    }
    return { status: 'rolled-back', results: [], error: (error as Error).message };
  }
}

/**
 * The Core execution loop: plans against real on-disk state, blocks the
 * entire batch with zero writes on conflict or missing authorization, and
 * otherwise applies every pending change atomically with rollback on
 * failure. A second call with the same `changes` against the resulting
 * state reports `'no-change'` (idempotent).
 */
export function applyExecution(
  root: string,
  changes: ArtifactChange[],
  options: ExecutionOptions = {},
): ExecutionResult {
  const plan = planExecution(root, changes, options);
  if (plan.conflicts.length > 0 || plan.unauthorized.length > 0) {
    return { ...plan, status: statusForPlan(plan), results: [] };
  }
  if (plan.pending.length === 0) {
    return { ...plan, status: 'no-change', results: [] };
  }
  const outcome = applyAtomically(root, plan.pending);
  return { ...plan, ...outcome };
}

/**
 * Convenience wrapper for callers materializing `write()` output into an
 * isolated directory without inspecting the full execution result.
 */
export function applyChangesOrThrow(
  root: string,
  changes: ArtifactChange[],
  options: ExecutionOptions = {},
): ArtifactResult[] {
  const result = applyExecution(root, changes, options);
  if (result.status === 'applied' || result.status === 'no-change') {
    return result.results;
  }
  if (result.status === 'blocked-conflict') {
    const detail = result.conflicts.map((c) => `${c.path} (${c.reason})`).join(', ');
    throw new Error(`applyChangesOrThrow: conflicting on-disk state for: ${detail}`);
  }
  if (result.status === 'blocked-unauthorized') {
    const detail = result.unauthorized.map((c) => c.path).join(', ');
    throw new Error(`applyChangesOrThrow: unauthorized changes for: ${detail}`);
  }
  throw new Error(`applyChangesOrThrow: rolled back — ${result.error}`);
}
