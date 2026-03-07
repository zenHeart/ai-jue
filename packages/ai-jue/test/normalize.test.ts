import { describe, it, expect } from 'vitest';
import { normalizeConfig } from '../src/normalize';

describe('normalizeConfig', () => {
  it('normalizes commands/hooks/agents/skills/rules to canonical fields', () => {
    const normalized = normalizeConfig({
      rules: {
        style: {
          prompt: 'Use strict typing',
        },
      },
      skills: {
        review: {
          prompt: 'Review skill',
        },
      },
      commands: {
        explain: {
          content: 'Explain code',
        },
      },
      hooks: {
        'pre-commit': {
          script: 'npm test',
          tools: ['Edit', ' Read '],
        },
      },
      agents: {
        reviewer: {
          content: 'Review prompt',
          skills: ['review-skill'],
        },
      },
    } as any);

    expect(normalized.rules?.style?.content).toBe('Use strict typing');
    expect(normalized.skills?.review?.content).toBe('Review skill');
    expect(normalized.skills?.review?.prompt).toBe('Review skill');
    expect(normalized.commands?.explain?.prompt).toBe('Explain code');
    expect(normalized.hooks?.['pre-commit']).toEqual({
      script: 'npm test',
      tools: ['Edit', 'Read'],
    });
    expect(normalized.agents?.reviewer?.prompt).toBe('Review prompt');
    expect(normalized.agents?.reviewer?.content).toBe('Review prompt');
    expect(normalized.agents?.reviewer?.skills).toEqual(['review-skill']);
    expect(normalized.context?.global).toBe('');
  });
});
