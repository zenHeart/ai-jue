import { Arguments, CommandBuilder } from 'yargs';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { logger } from '../logger';

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

export const command = 'init';
export const describe = 'Initialize ai-jue configuration';

export const builder: CommandBuilder = (yargs) => yargs;

export const handler = async (argv: Arguments) => {
    logger.info('Initializing ai-jue...');
    const configPath = path.join(process.cwd(), 'ai.config.js');
    
    let createConfig = true;
    if (fs.existsSync(configPath)) {
        logger.warn('ai.config.js already exists.');
        createConfig = false;
    } else {
        const answer = await askQuestion('Create ai.config.js? (Y/n) ');
        if (answer.toLowerCase() === 'n') {
            createConfig = false;
        }
    }

    if (createConfig) {
        const preset = await askQuestion('Enter preset name (default: base): ');
        const content = `module.exports = {\n  preset: '${preset || 'base'}',\n};\n`;
        fs.writeFileSync(configPath, content);
        logger.success('Created ai.config.js');
    }
    
    const aiDir = path.join(process.cwd(), '.ai');
    if (!fs.existsSync(aiDir)) {
         const answer = await askQuestion('Create .ai directory structure? (Y/n) ');
         if (answer.toLowerCase() !== 'n') {
             fs.mkdirSync(aiDir);
             fs.mkdirSync(path.join(aiDir, 'prompts'));
             fs.mkdirSync(path.join(aiDir, 'skills'));
             logger.success('Created .ai directory with prompts/ and skills/ subdirectories.');
         }
    } else {
        logger.info('.ai directory already exists.');
    }
};
