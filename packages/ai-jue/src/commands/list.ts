import { Arguments, CommandBuilder } from 'yargs';
import { loadConfig } from '../config';
import { resolveFinalConfig } from '../resolver';
import { logger } from '../logger';

export const command = 'list [type]';
export const describe = 'List loaded assets (presets, prompts, skills)';

export const builder: CommandBuilder = (yargs) => {
    return yargs.positional('type', {
        describe: 'Type of assets to list',
        type: 'string',
        choices: ['presets', 'prompts', 'skills', 'all'],
        default: 'all'
    });
};

export const handler = async (argv: Arguments) => {
    const type = argv.type as string;
    const config = await loadConfig();
    const finalConfig = await resolveFinalConfig(config);

    if (type === 'presets' || type === 'all') {
        const presets = config.presets || (config.preset ? [config.preset] : []);
        logger.info('\nLoaded Presets:');
        if (presets.length > 0) {
            presets.forEach((p: string) => logger.log(`- ${p}`));
        } else {
            logger.log('  (none)');
        }
    }

    if (type === 'prompts' || type === 'all') {
        logger.info('\nLoaded Prompts:');
        if (finalConfig.prompts && Object.keys(finalConfig.prompts).length > 0) {
            Object.keys(finalConfig.prompts).forEach(key => logger.log(`- ${key}`));
        } else {
            logger.log('  (none)');
        }
    }

    if (type === 'skills' || type === 'all') {
        logger.info('\nLoaded Skills:');
        if (finalConfig.skills && Object.keys(finalConfig.skills).length > 0) {
            Object.keys(finalConfig.skills).forEach(key => logger.log(`- ${key}`));
        } else {
            logger.log('  (none)');
        }
    }
};
