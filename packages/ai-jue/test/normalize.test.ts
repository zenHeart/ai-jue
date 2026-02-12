import { describe, it, expect } from 'vitest';
import { normalizeConfig } from '../src/normalize';
import { logger } from '../src/logger';

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
          tools: ['review-skill'],
        },
      },
    } as any);

    expect(normalized.commands?.explain?.prompt).toBe('Explain code');
    expect(normalized.hooks?.['pre-commit']).toBe('npm test');
    expect(normalized.agents?.reviewer?.prompt).toBe('Review prompt');
    expect(normalized.agents?.reviewer?.skills).toEqual(['review-skill']);
    expect(normalized.context?.global).toBe('');
  });

  it('throws on conflicting agent skills/tools by default', () => {
    expect(() =>
      normalizeConfig({
        agents: {
          reviewer: {
            prompt: 'review',
            skills: ['a'],
            tools: ['b'],
          },
        },
      } as any),
    ).toThrow(/conflicting skills\/tools/);
  });

  it('warns instead of throwing when conflictPolicy is warn', () => {
    const originalWarn = logger.warn;
    let warned = false;
    try {
      (logger as any).warn = () => {
        warned = true;
      };

      normalizeConfig({
        conflictPolicy: 'warn',
        agents: {
          reviewer: {
            prompt: 'review',
            skills: ['a'],
            tools: ['b'],
          },
        },
      } as any);

      expect(warned).toBe(true);
    } finally {
      (logger as any).warn = originalWarn;
    }
  });
});
