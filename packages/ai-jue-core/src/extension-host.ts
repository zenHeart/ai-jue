import type { ArtifactChange, ArtifactResult, Confirmation } from './artifact-change';
import type { CanonicalDocument } from './canonical-document';

/** The six atomic Canonical Capability types an Adapter declares support for. */
export type CanonicalCapabilityType = 'rules' | 'commands' | 'skills' | 'agents' | 'hooks' | 'mcp';

export type CapabilitySupportLevel = 'supported' | 'degraded' | 'unsupported';

export type ApplyScope = 'project' | 'user';

export type CapabilitySupport = Record<CanonicalCapabilityType, CapabilitySupportLevel>;

export interface ArtifactTargetContext {
  artifactRoot: string;
  scope: ApplyScope;
  artifactKind?: string;
}

export interface ReadContext extends ArtifactTargetContext {}

export interface WriteContext extends ArtifactTargetContext {
  toolsConfig?: Record<string, unknown>;
  pluginManifest?: {
    name: string;
    version: string;
    description?: string;
    author?: { name: string; email?: string; url?: string };
    variables?: Record<string, unknown>;
  };
}

export interface ConfirmContext extends ArtifactTargetContext {}

export interface Adapter {
  id: string;
  capabilities: CapabilitySupport;
  /** Apply roots this Adapter maps natively. Omitted means project-only. */
  supportedScopes?: readonly ApplyScope[];
  read(context: ReadContext): Promise<CanonicalDocument>;
  write(canonical: CanonicalDocument, context: WriteContext): Promise<ArtifactChange[]>;
  confirm(results: ArtifactResult[], context: ConfirmContext): Promise<Confirmation>;
}

export interface ExtensionDefinition {
  adapters: Adapter[];
}

const CANONICAL_CAPABILITY_TYPES: ReadonlyArray<CanonicalCapabilityType> = [
  'rules',
  'commands',
  'skills',
  'agents',
  'hooks',
  'mcp',
];

const CAPABILITY_SUPPORT_LEVELS = new Set<CapabilitySupportLevel>(['supported', 'degraded', 'unsupported']);
const ADAPTER_METHODS = ['read', 'write', 'confirm'] as const;
const APPLY_SCOPES = new Set<ApplyScope>(['project', 'user']);

function assertCapabilitySupport(value: unknown): asserts value is CapabilitySupport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Adapter.capabilities must be an object');
  }
  const support = value as Record<string, unknown>;
  for (const capabilityType of CANONICAL_CAPABILITY_TYPES) {
    const level = support[capabilityType];
    if (typeof level !== 'string' || !CAPABILITY_SUPPORT_LEVELS.has(level as CapabilitySupportLevel)) {
      throw new Error(
        `Adapter.capabilities.${capabilityType} must be one of: ${[...CAPABILITY_SUPPORT_LEVELS].join(', ')}`,
      );
    }
  }
}

/**
 * Validates the Adapter contract's static shape: unique-checkable `id`,
 * a support level declared for every atomic Capability type, and `read`/
 * `write`/`confirm` present as functions. It does not invoke any of them.
 */
export function assertAdapter(value: unknown): asserts value is Adapter {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Adapter must be an object');
  }
  const adapter = value as Record<string, unknown>;
  if (typeof adapter.id !== 'string' || !adapter.id.trim()) {
    throw new Error('Adapter.id must be a non-empty string');
  }
  assertCapabilitySupport(adapter.capabilities);
  if (adapter.supportedScopes !== undefined) {
    if (!Array.isArray(adapter.supportedScopes) || adapter.supportedScopes.length === 0) {
      throw new Error('Adapter.supportedScopes must be a non-empty array of: project, user');
    }
    const seenScopes = new Set<string>();
    for (const scope of adapter.supportedScopes) {
      if (typeof scope !== 'string' || !APPLY_SCOPES.has(scope as ApplyScope)) {
        throw new Error('Adapter.supportedScopes entries must be one of: project, user');
      }
      if (seenScopes.has(scope)) {
        throw new Error('Adapter.supportedScopes must not contain duplicates');
      }
      seenScopes.add(scope);
    }
  }
  for (const method of ADAPTER_METHODS) {
    if (typeof adapter[method] !== 'function') {
      throw new Error(`Adapter.${method} must be a function`);
    }
  }
}

/**
 * Validates an Extension's default export: a non-empty `adapters` array of
 * well-formed Adapters with process-unique `id`s. Mirrors "`adapter.id` is
 * process-wide unique; conflicts fail" from the Extension API reference.
 */
export function assertExtensionDefinition(value: unknown): asserts value is ExtensionDefinition {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Extension default export must be an object with an `adapters` array');
  }
  const definition = value as Record<string, unknown>;
  if (!Array.isArray(definition.adapters) || definition.adapters.length === 0) {
    throw new Error('Extension.adapters must be a non-empty array');
  }
  const seenIds = new Set<string>();
  for (const adapter of definition.adapters) {
    assertAdapter(adapter);
    if (seenIds.has(adapter.id)) {
      throw new Error(`Adapter id "${adapter.id}" is declared more than once in this Extension`);
    }
    seenIds.add(adapter.id);
  }
}

/** Extension authors call this in their entry file's default export. */
export function defineExtension(definition: ExtensionDefinition): ExtensionDefinition {
  assertExtensionDefinition(definition);
  return definition;
}
