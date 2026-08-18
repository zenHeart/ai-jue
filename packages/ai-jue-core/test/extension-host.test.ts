import { describe, expect, it } from 'vitest';
import { Adapter, CapabilitySupport, assertAdapter, assertExtensionDefinition, defineExtension } from '../src/extension-host';

type CanonicalKey = keyof CapabilitySupport;

function fullSupport(level: CapabilitySupport[CanonicalKey] = 'supported'): CapabilitySupport {
  return { rules: level, commands: level, skills: level, agents: level, hooks: level, mcp: level };
}

function neutralAdapter(overrides: Partial<Adapter> = {}): Adapter {
  return {
    id: 'neutral-agent',
    capabilities: fullSupport(),
    read: async () => ({}),
    write: async () => [],
    confirm: async () => ({ target: 'neutral-agent', status: 'unconfirmed' }),
    ...overrides,
  };
}

describe('assertAdapter', () => {
  it('accepts a well-formed Adapter', () => {
    expect(() => assertAdapter(neutralAdapter())).not.toThrow();
  });

  it('accepts project/user scope declarations', () => {
    expect(() =>
      assertAdapter(neutralAdapter({ supportedScopes: ['project', 'user'] })),
    ).not.toThrow();
  });

  it('rejects duplicate or unknown scope declarations', () => {
    expect(() =>
      assertAdapter(neutralAdapter({ supportedScopes: ['project', 'project'] })),
    ).toThrow('must not contain duplicates');
    expect(() =>
      assertAdapter(neutralAdapter({ supportedScopes: ['global'] as any })),
    ).toThrow('project, user');
  });

  it('rejects a missing id', () => {
    expect(() => assertAdapter(neutralAdapter({ id: '' }))).toThrow('non-empty string');
  });

  it('rejects capabilities missing an atomic Capability type', () => {
    const { mcp, ...incomplete } = fullSupport();
    expect(() =>
      assertAdapter(neutralAdapter({ capabilities: incomplete as CapabilitySupport })),
    ).toThrow('capabilities.mcp');
  });

  it('rejects an invalid support level', () => {
    expect(() =>
      assertAdapter(
        neutralAdapter({ capabilities: { ...fullSupport(), hooks: 'maybe' as any } }),
      ),
    ).toThrow('capabilities.hooks');
  });

  it.each(['read', 'write', 'confirm'] as const)('rejects a non-function %s', (method) => {
    expect(() => assertAdapter(neutralAdapter({ [method]: 'not-a-function' } as any))).toThrow(
      `Adapter.${method} must be a function`,
    );
  });
});

describe('assertExtensionDefinition / defineExtension', () => {
  it('accepts a single well-formed Adapter', () => {
    expect(() => assertExtensionDefinition({ adapters: [neutralAdapter()] })).not.toThrow();
    expect(defineExtension({ adapters: [neutralAdapter()] }).adapters).toHaveLength(1);
  });

  it('rejects an empty adapters array', () => {
    expect(() => assertExtensionDefinition({ adapters: [] })).toThrow('non-empty array');
  });

  it('rejects duplicate adapter ids within one Extension', () => {
    expect(() =>
      assertExtensionDefinition({
        adapters: [neutralAdapter(), neutralAdapter()],
      }),
    ).toThrow('declared more than once');
  });

  it('rejects a non-object default export', () => {
    expect(() => assertExtensionDefinition('not-an-object')).toThrow('adapters` array');
  });
});
