import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks that need to be accessed in vi.mock
const { searchMock } = vi.hoisted(() => {
    return { searchMock: vi.fn() };
});

vi.mock('cosmiconfig', () => ({
    cosmiconfig: () => ({
        search: searchMock
    })
}));

vi.mock('../src/logger');

import { ConfigSchema, loadConfig } from '../src/config';
import { logger } from '../src/logger';

describe('loadConfig', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // We don't need to mockReturnValue for cosmiconfig here because it's already called
        // We just control searchMock
        
        // Mock process.exit
        vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return empty object if no config found', async () => {
        searchMock.mockResolvedValue(null);
        const config = await loadConfig();
        expect(config).toEqual({});
    });

    it('should return validated config if valid', async () => {
        searchMock.mockResolvedValue({
            config: {
                preset: 'base',
                mcp: {
                    servers: {
                        local: {
                            command: 'npx',
                            scope: 'project',
                            autoApprove: ['read']
                        }
                    }
                },
                hooks: {
                    'pre-tool-use': {
                        script: 'npm test',
                        matcher: 'Edit',
                        async: true
                    }
                }
            }
        });
        const config = await loadConfig();
        expect(config).toEqual({
            preset: 'base',
            mcp: {
                servers: {
                    local: {
                        command: 'npx',
                        scope: 'project',
                        autoApprove: ['read']
                    }
                }
            },
            hooks: {
                'pre-tool-use': {
                    script: 'npm test',
                    matcher: 'Edit',
                    async: true
                }
            }
        });
    });

    it('should fail validation for invalid config', async () => {
        searchMock.mockResolvedValue({
            config: {
                presets: 'not-an-array' // Should be array
            }
        });

        await loadConfig();
        
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed'));
    });

    it('should fail when preset and presets are both provided', async () => {
        searchMock.mockResolvedValue({
            config: {
                preset: 'base',
                presets: ['react']
            }
        });

        await loadConfig();

        expect(process.exit).toHaveBeenCalledWith(1);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed'));
    });

    it('should fail fast on unknown top-level capability fields', async () => {
        searchMock.mockResolvedValue({
            config: {
                preset: 'base',
                bugbot: {
                    enabled: true
                }
            }
        });

        await loadConfig();

        expect(process.exit).toHaveBeenCalledWith(1);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed'));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Unknown top-level capability field "bugbot"'));
    });

    it.each(['commands', 'rules', 'skills', 'agents'])(
        'should reject %s capabilities without an executable body',
        (section) => {
            const result = ConfigSchema.safeParse({
                [section]: {
                    empty: {
                        description: 'Metadata only'
                    }
                }
            });

            expect(result.success).toBe(false);
        }
    );

    it('should accept one-or-many canonical hook definitions and reject tool-native arrays', () => {
        expect(ConfigSchema.safeParse({
            hooks: {
                PostToolUse: [
                    { script: 'npm test', matcher: 'Edit' },
                    { script: 'npm run lint', async: true }
                ]
            }
        }).success).toBe(true);

        expect(ConfigSchema.safeParse({
            hooks: {
                PostToolUse: [
                    {
                        matcher: 'Edit',
                        hooks: [{ type: 'command', command: 'npm test' }]
                    }
                ]
            }
        }).success).toBe(false);
    });
});
