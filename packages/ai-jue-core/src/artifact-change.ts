import crypto from 'crypto';
import path from 'path';

export type ArtifactChangeKind = 'create' | 'update' | 'delete';

/** How much of `path` an Adapter controls, not just whether it writes it. */
export type ArtifactOwnership = 'full' | 'managed-block' | 'merged-keys';

export type ArtifactRisk = 'low' | 'medium' | 'high';
export type ArtifactScope = 'project' | 'local' | 'user';
export type ArtifactAtomicState = 'planned' | 'applied' | 'rolled-back' | 'failed';

/** The actual bytes Core writes for `create`/`update`; absent for `delete`. */
export type ArtifactContent = string | { content: string; encoding: 'utf8' | 'base64' };

export interface ArtifactChange {
  target: string;
  kind: ArtifactChangeKind;
  ownership: ArtifactOwnership;
  scope: ArtifactScope;
  path: string;
  beforeHash: string | null;
  afterHash: string | null;
  /** Present for `create`/`update` (what Core writes); absent for `delete`. */
  content?: ArtifactContent;
  risk: ArtifactRisk;
  requiresApproval: boolean;
  atomicState: ArtifactAtomicState;
}

export interface ArtifactResult {
  change: ArtifactChange;
  applied: boolean;
}

export type ConfirmationStatus = 'confirmed' | 'unconfirmed' | 'failed';

export interface Confirmation {
  target: string;
  status: ConfirmationStatus;
  evidence?: string;
}

/** Content hashing shared by every Adapter so `beforeHash`/`afterHash` are comparable across targets. */
export function hashArtifactContent(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const ARTIFACT_CHANGE_KINDS = new Set<ArtifactChangeKind>(['create', 'update', 'delete']);
const ARTIFACT_OWNERSHIPS = new Set<ArtifactOwnership>(['full', 'managed-block', 'merged-keys']);
const ARTIFACT_RISKS = new Set<ArtifactRisk>(['low', 'medium', 'high']);
const ARTIFACT_SCOPES = new Set<ArtifactScope>(['project', 'local', 'user']);
const ARTIFACT_ATOMIC_STATES = new Set<ArtifactAtomicState>(['planned', 'applied', 'rolled-back', 'failed']);
const CONFIRMATION_STATUSES = new Set<ConfirmationStatus>(['confirmed', 'unconfirmed', 'failed']);

const UNSAFE_PATH_SEGMENT = /(^|\/)\.\.(\/|$)/;

function assertOneOf<T extends string>(
  field: string,
  value: unknown,
  allowed: ReadonlySet<T>,
): asserts value is T {
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    throw new Error(`${field} must be one of: ${[...allowed].join(', ')}`);
  }
}

function assertProjectRelativePath(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('ArtifactChange.path must be a non-empty string');
  }
  if (path.isAbsolute(value) || UNSAFE_PATH_SEGMENT.test(value)) {
    throw new Error(`ArtifactChange.path must be a safe project-relative path: ${value}`);
  }
}

function assertNullableHash(field: 'beforeHash' | 'afterHash', value: unknown): void {
  if (value === null) return;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`ArtifactChange.${field} must be a content hash string or null`);
  }
}

/** Decodes `ArtifactContent` into the raw bytes Core writes to disk. */
export function artifactContentBytes(content: ArtifactContent): string | Buffer {
  return typeof content === 'string' ? content : Buffer.from(content.content, content.encoding);
}

function assertContentMatchesKind(kind: ArtifactChangeKind, content: unknown, afterHash: unknown): void {
  if (kind === 'delete') {
    if (content !== undefined) {
      throw new Error('ArtifactChange.content must be absent when kind is "delete"');
    }
    return;
  }
  if (content === undefined) {
    throw new Error(`ArtifactChange.content must be present when kind is "${kind}"`);
  }
  const isPlainString = typeof content === 'string';
  const isEncodedObject =
    !!content &&
    typeof content === 'object' &&
    typeof (content as any).content === 'string' &&
    ((content as any).encoding === 'utf8' || (content as any).encoding === 'base64');
  if (!isPlainString && !isEncodedObject) {
    throw new Error('ArtifactChange.content must be a string or { content, encoding }');
  }
  if (hashArtifactContent(artifactContentBytes(content as ArtifactContent)) !== afterHash) {
    throw new Error('ArtifactChange.afterHash must match the hash of ArtifactChange.content');
  }
}

/**
 * Validates the ArtifactChange contract's structural invariants: closed
 * enums, a safe relative path, and hash presence matching `kind`. Whether a
 * given `risk` requires approval stays an Adapter/Core policy decision, not a
 * structural invariant, so it is intentionally not enforced here.
 */
export function assertArtifactChange(value: unknown): asserts value is ArtifactChange {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ArtifactChange must be an object');
  }
  const change = value as Record<string, unknown>;

  if (typeof change.target !== 'string' || !change.target) {
    throw new Error('ArtifactChange.target must be a non-empty string');
  }
  assertOneOf('ArtifactChange.kind', change.kind, ARTIFACT_CHANGE_KINDS);
  assertOneOf('ArtifactChange.ownership', change.ownership, ARTIFACT_OWNERSHIPS);
  assertOneOf('ArtifactChange.scope', change.scope, ARTIFACT_SCOPES);
  assertOneOf('ArtifactChange.risk', change.risk, ARTIFACT_RISKS);
  assertOneOf('ArtifactChange.atomicState', change.atomicState, ARTIFACT_ATOMIC_STATES);
  if (typeof change.requiresApproval !== 'boolean') {
    throw new Error('ArtifactChange.requiresApproval must be a boolean');
  }
  assertProjectRelativePath(change.path);
  assertNullableHash('beforeHash', change.beforeHash);
  assertNullableHash('afterHash', change.afterHash);

  const kind = change.kind as ArtifactChangeKind;
  if (kind === 'create' && change.beforeHash !== null) {
    throw new Error('ArtifactChange.beforeHash must be null when kind is "create"');
  }
  if (kind === 'delete' && change.afterHash !== null) {
    throw new Error('ArtifactChange.afterHash must be null when kind is "delete"');
  }
  if (kind === 'update' && (change.beforeHash === null || change.afterHash === null)) {
    throw new Error('ArtifactChange.beforeHash and afterHash must both be set when kind is "update"');
  }
  assertContentMatchesKind(kind, change.content, change.afterHash);
}

/**
 * A `Confirmation` may only claim `confirmed` alongside redacted evidence of
 * how it was confirmed — mirrors "a missing confirmation path is never
 * confirmed" from the Extension API reference.
 */
export function assertConfirmation(value: unknown): asserts value is Confirmation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Confirmation must be an object');
  }
  const confirmation = value as Record<string, unknown>;
  if (typeof confirmation.target !== 'string' || !confirmation.target) {
    throw new Error('Confirmation.target must be a non-empty string');
  }
  assertOneOf('Confirmation.status', confirmation.status, CONFIRMATION_STATUSES);
  if (confirmation.status === 'confirmed' && !confirmation.evidence) {
    throw new Error('Confirmation.status "confirmed" requires non-empty evidence');
  }
}
