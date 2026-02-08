import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler as initHandler } from '../src/commands/init';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { logger } from '../src/logger';

vi.mock('fs');
vi.mock('readline');
vi.mock('../src/logger');

describe('init command', () => {
    let questionCallback: (answer: string) => void;

    beforeEach(() => {
        vi.resetAllMocks();
        
        // Mock readline to capture callback
        const rlMock = {
            question: vi.fn((q, cb) => {
                questionCallback = cb;
            }),
            close: vi.fn()
        };
        (readline.createInterface as any).mockReturnValue(rlMock);

        // Mock fs
        (fs.existsSync as any).mockReturnValue(false);
        (fs.writeFileSync as any).mockImplementation(() => {});
        (fs.mkdirSync as any).mockImplementation(() => {});
    });

    it('should create ai.config.js and .ai directory when user answers Y', async () => {
        const promise = initHandler({} as any);
        
        // Wait for first question
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(readline.createInterface().question).toHaveBeenCalledWith(expect.stringContaining('Create ai.config.js?'), expect.any(Function));
        questionCallback('Y');

        // Wait for second question
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(readline.createInterface().question).toHaveBeenCalledWith(expect.stringContaining('Enter preset name'), expect.any(Function));
        questionCallback('base');

        // Wait for third question
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(readline.createInterface().question).toHaveBeenCalledWith(expect.stringContaining('Create .ai directory structure?'), expect.any(Function));
        questionCallback('Y');

        await promise;

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('ai.config.js'), 
            expect.stringContaining("preset: 'base'")
        );
        expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('.ai'));
        expect(logger.success).toHaveBeenCalledWith('Created ai.config.js');
    });

    it('should skip creation if user answers n', async () => {
        const promise = initHandler({} as any);
        
        // Create ai.config.js? n
        await new Promise(resolve => setTimeout(resolve, 0));
        questionCallback('n');

        // Create .ai directory? n
        await new Promise(resolve => setTimeout(resolve, 0));
        questionCallback('n');

        await promise;

        expect(fs.writeFileSync).not.toHaveBeenCalled();
        expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
});
