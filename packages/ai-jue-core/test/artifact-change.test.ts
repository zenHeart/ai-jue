import { describe, expect, it } from 'vitest';
import {
  ArtifactChange,
  assertArtifactChange,
  assertConfirmation,
  hashArtifactContent,
} from '../src/artifact-change';

function baseChange(overrides: Partial<ArtifactChange> = {}): ArtifactChange {
  return {
    target: 'claude-code',
    kind: 'update',
    ownership: 'managed-block',
    scope: 'project',
    path: '.claude/CLAUDE.md',
    beforeHash: hashArtifactContent('old'),
    afterHash: hashArtifactContent('new'),
    content: 'new',
    risk: 'low',
    requiresApproval: false,
    atomicState: 'planned',
    ...overrides,
  };
}

describe('assertArtifactChange', () => {
  it('accepts a well-formed change for each kind', () => {
    expect(() => assertArtifactChange(baseChange())).not.toThrow();
    expect(() =>
      assertArtifactChange(baseChange({ kind: 'create', beforeHash: null })),
    ).not.toThrow();
    expect(() =>
      assertArtifactChange(
        baseChange({ kind: 'delete', afterHash: null, content: undefined }),
      ),
    ).not.toThrow();
  });

  it('accepts an encoded-object content matching afterHash', () => {
    const content = { content: Buffer.from('binary').toString('base64'), encoding: 'base64' as const };
    expect(() =>
      assertArtifactChange(
        baseChange({ afterHash: hashArtifactContent(Buffer.from('binary')), content }),
      ),
    ).not.toThrow();
  });

  it('rejects a "create" that still carries a beforeHash', () => {
    expect(() => assertArtifactChange(baseChange({ kind: 'create' }))).toThrow(
      'beforeHash must be null',
    );
  });

  it('rejects a "delete" that still carries an afterHash', () => {
    expect(() =>
      assertArtifactChange(baseChange({ kind: 'delete', beforeHash: null })),
    ).toThrow('afterHash must be null');
  });

  it('rejects a "delete" that still carries content', () => {
    expect(() =>
      assertArtifactChange(
        baseChange({ kind: 'delete', beforeHash: null, afterHash: null }),
      ),
    ).toThrow('content must be absent');
  });

  it('rejects a "create"/"update" missing content', () => {
    expect(() =>
      assertArtifactChange(baseChange({ content: undefined })),
    ).toThrow('content must be present');
  });

  it('rejects content whose hash does not match afterHash', () => {
    expect(() =>
      assertArtifactChange(baseChange({ content: 'not-new' })),
    ).toThrow('afterHash must match the hash of ArtifactChange.content');
  });

  it('rejects a content value that is neither a string nor an encoded object', () => {
    expect(() =>
      assertArtifactChange(baseChange({ content: 42 as any })),
    ).toThrow('must be a string or { content, encoding }');
  });

  it('rejects an "update" missing either hash', () => {
    expect(() =>
      assertArtifactChange(baseChange({ beforeHash: null })),
    ).toThrow('must both be set');
  });

  it.each([
    ['kind', 'not-a-kind'],
    ['ownership', 'shared'],
    ['scope', 'global'],
    ['risk', 'critical'],
    ['atomicState', 'unknown'],
  ])('rejects an invalid %s enum value', (field, value) => {
    expect(() => assertArtifactChange(baseChange({ [field]: value } as any))).toThrow();
  });

  it('rejects an absolute path', () => {
    expect(() =>
      assertArtifactChange(baseChange({ path: '/etc/passwd' })),
    ).toThrow('safe project-relative path');
  });

  it('rejects a path that escapes the project via traversal', () => {
    expect(() =>
      assertArtifactChange(baseChange({ path: '../outside/CLAUDE.md' })),
    ).toThrow('safe project-relative path');
  });

  it('rejects a non-boolean requiresApproval', () => {
    expect(() =>
      assertArtifactChange(baseChange({ requiresApproval: 'yes' as any })),
    ).toThrow('requiresApproval must be a boolean');
  });
});

describe('hashArtifactContent', () => {
  it('is deterministic for identical content', () => {
    expect(hashArtifactContent('same')).toBe(hashArtifactContent('same'));
  });

  it('differs for different content', () => {
    expect(hashArtifactContent('a')).not.toBe(hashArtifactContent('b'));
  });
});

describe('assertConfirmation', () => {
  it('accepts unconfirmed and failed without evidence', () => {
    expect(() =>
      assertConfirmation({ target: 'claude-code', status: 'unconfirmed' }),
    ).not.toThrow();
    expect(() =>
      assertConfirmation({ target: 'claude-code', status: 'failed' }),
    ).not.toThrow();
  });

  it('rejects "confirmed" without evidence', () => {
    expect(() =>
      assertConfirmation({ target: 'claude-code', status: 'confirmed' }),
    ).toThrow('requires non-empty evidence');
  });

  it('accepts "confirmed" with evidence', () => {
    expect(() =>
      assertConfirmation({
        target: 'claude-code',
        status: 'confirmed',
        evidence: 'claude plugin validate: 0 errors',
      }),
    ).not.toThrow();
  });
});
