import { describe, expect, it } from 'vitest';
import { CanonicalDocumentSchema, toCanonicalDocument } from '../src/canonical-document';

describe('toCanonicalDocument', () => {
  it('keeps only context and the six atomic Capabilities', () => {
    const merged = {
      context: { global: 'Project-specific constraints.' },
      rules: { style: { content: 'Use tabs.' } },
      commands: { build: { prompt: 'Build the project.' } },
      skills: { review: { content: 'Review the diff.' } },
      agents: { planner: { content: 'Plan the work.' } },
      hooks: { onSave: 'echo saved' },
      mcp: { servers: { local: { command: 'node', args: ['server.js'] } } },
    };

    const canonical = toCanonicalDocument(merged);

    expect(canonical).toEqual(merged);
  });

  it.each([
    ['presets', ['base']],
    ['preset', 'base'],
    ['extends', { rules: './extra.md' }],
    ['capabilities', { review: { source: 'file:./review', type: 'skill' } }],
    ['extensions', ['jue-extension-openclaw']],
    ['tools', { claude: { hooksNote: 'target-private' } }],
    ['language', 'zh'],
    ['prompts', { legacy: { content: 'old field' } }],
  ])('never lets ProjectConfig-only field "%s" reach the Canonical output', (key, value) => {
    const merged: Record<string, unknown> = {
      context: { global: 'kept' },
      [key]: value,
    };

    const canonical = toCanonicalDocument(merged);

    expect(canonical).not.toHaveProperty(key);
    expect(canonical).toEqual({ context: { global: 'kept' } });
  });

  it('rejects a top-level field outside the closed Canonical key set', () => {
    expect(() => CanonicalDocumentSchema.parse({ tools: {} })).toThrow();
  });

  it('produces an empty document for an empty config', () => {
    expect(toCanonicalDocument({})).toEqual({});
  });
});
