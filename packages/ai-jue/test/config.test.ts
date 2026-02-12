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

import { loadConfig } from '../src/config';
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
                preset: 'base'
            }
        });
        const config = await loadConfig();
        expect(config).toEqual({ preset: 'base' });
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

    it('should fail when agents.skills and agents.tools conflict', async () => {
        searchMock.mockResolvedValue({
            config: {
                agents: {
                    reviewer: {
                        prompt: 'review',
                        skills: ['a'],
                        tools: ['b']
                    }
                }
            }
        });

        await loadConfig();

        expect(process.exit).toHaveBeenCalledWith(1);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed'));
    });
});
