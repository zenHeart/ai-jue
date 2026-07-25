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
        'post-edit': [
          {
            script: 'npm run lint',
            tools: [' Edit ', 'Write'],
          },
        ],
      },
      agents: {
        reviewer: {
          content: 'Review prompt',
          skills: ['review-skill'],
        },
      },
      prompts: {
        gemini: {
          prompt: 'Gemini-only prompt body',
        },
        claude: {
          content: 'Claude-only prompt body',
        },
      },
    } as any);

    expect(normalized.rules?.style?.content).toBe('Use strict typing');
    expect(normalized.skills?.review?.content).toBe('Review skill');
    expect(normalized.skills?.review?.prompt).toBe('Review skill');
    expect(normalized.commands?.explain?.prompt).toBe('Explain code');
    expect(normalized.commands?.explain?.content).toBe('Explain code');
    expect(normalized.rules?.style?.prompt).toBe('Use strict typing');
    expect(normalized.hooks?.['pre-commit']).toEqual({
      script: 'npm test',
      tools: ['Edit', 'Read'],
    });
    expect(normalized.hooks?.['post-edit']).toEqual([
      {
        script: 'npm run lint',
        tools: ['Edit', 'Write'],
      },
    ]);
    expect(normalized.agents?.reviewer?.prompt).toBe('Review prompt');
    expect(normalized.agents?.reviewer?.content).toBe('Review prompt');
    expect(normalized.agents?.reviewer?.skills).toEqual(['review-skill']);
    expect(normalized.context?.global).toBe('');
    expect(normalized.prompts?.gemini?.content).toBe('Gemini-only prompt body');
    expect(normalized.prompts?.gemini?.prompt).toBe('Gemini-only prompt body');
    expect(normalized.prompts?.claude?.prompt).toBe('Claude-only prompt body');
    expect(normalized.prompts?.claude?.content).toBe('Claude-only prompt body');
  });
});
