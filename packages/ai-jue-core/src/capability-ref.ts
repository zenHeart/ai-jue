/**
 * The six atomic Canonical Capability leaves. A CapabilityRef resolves to
 * exactly one of these — never a whole preset-like directory.
 */
export type CapabilityType = 'rule' | 'command' | 'skill' | 'agent' | 'hook' | 'mcp';

export type CapabilitySource =
    | `file:${string}`
    | `npm:${string}`
    | `github:${string}`;

export interface CapabilityRef {
    source: CapabilitySource;
    type: CapabilityType;
    ref?: string;
    path?: string;
    config?: Record<string, unknown>;
    integrity?: string;
    status?: string;
}

const CAPABILITY_TYPES = new Set<CapabilityType>([
    'rule',
    'command',
    'skill',
    'agent',
    'hook',
    'mcp',
]);

/**
 * Validates the public Capability Source contract without coupling core to a
 * resolver implementation. Resolution remains an input concern owned by the
 * CLI package.
 */
export function assertCapabilityRef(name: string, value: unknown): asserts value is CapabilityRef {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
        throw new Error(`Capability name must be a safe single path segment: ${name}`);
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Capability "${name}" must be an object`);
    }
    const ref = value as Record<string, unknown>;
    if (
        typeof ref.source !== 'string' ||
        !/^(?:file|npm|github):.+/.test(ref.source)
    ) {
        throw new Error(`Capability "${name}" has an invalid source`);
    }
    if (
        typeof ref.type !== 'string' ||
        !CAPABILITY_TYPES.has(ref.type as CapabilityType)
    ) {
        throw new Error(`Capability "${name}" has an unknown type`);
    }
    if (ref.status !== undefined) {
        throw new Error(
            `Capability "${name}" is not loadable while status is present: ${String(ref.status)}`,
        );
    }
    if (ref.ref !== undefined && typeof ref.ref !== 'string') {
        throw new Error(`Capability "${name}" ref must be a string`);
    }
    if (ref.path !== undefined && typeof ref.path !== 'string') {
        throw new Error(`Capability "${name}" path must be a string`);
    }
    if (
        ref.config !== undefined &&
        (!ref.config || typeof ref.config !== 'object' || Array.isArray(ref.config))
    ) {
        throw new Error(`Capability "${name}" config must be an object`);
    }
}
