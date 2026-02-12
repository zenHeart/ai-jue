import { describe, it, expect } from 'vitest';
import { normalizeConfig } from '../src/normalize';

describe('normalizeConfig', () => {
  it('normalizes commands/hook/agents to canonical fields', () => {
    const normalized = normalizeConfig({
      commands: {
        explain: {
          content: 'Explain code',
        },
      },
      hooks: {
        'pre-commit': {
          script: 'npm test',
        },
      },
      agents: {
        reviewer: {
          content: 'Review prompt',
          skills: ['review-skill'],
        },
      },
    } as any);

    expect(normalized.commands?.explain?.prompt).toBe('Explain code');
    expect(normalized.hooks?.['pre-commit']).toBe('npm test');
    expect(normalized.agents?.reviewer?.prompt).toBe('Review prompt');
    expect(normalized.agents?.reviewer?.skills).toEqual(['review-skill']);
    expect(normalized.context?.global).toBe('');
  });
});
