import { Arguments, CommandBuilder } from 'yargs';
import { loadConfig } from '../config';
import path from 'path';
import fs from 'fs';
import pc from 'picocolors';
import { logger } from '../logger';

export const command = 'validate';
export const describe = 'Validate the configuration and assets';

export const builder: CommandBuilder = (yargs) => yargs;

export const handler = async (argv: Arguments) => {
    logger.info(pc.blue('Validating configuration...'));
    const config = await loadConfig();
    let hasErrors = false;

    // 1. Validate Structure
    if (config.presets && !Array.isArray(config.presets)) {
        logger.error(pc.red('[ERROR] "presets" must be an array.'));
        hasErrors = true;
    }

    // 2. Validate Presets Existence
    const presets = config.presets || (config.preset ? [config.preset] : []);
    for (const presetName of presets) {
        try {
            const packageName = `jue-preset-${presetName}`;
            require.resolve(`${packageName}/package.json`, { paths: [process.cwd()] });
            logger.success(pc.green(`[OK] Preset "${presetName}" found.`));
        } catch (e) {
            logger.error(pc.red(`[ERROR] Preset "${presetName}" not installed.`));
            hasErrors = true;
        }
    }

    // 3. Validate Extends
    if (config.extends) {
        for (const [key, value] of Object.entries(config.extends)) {
            const paths = Array.isArray(value) ? value : [value];
            for (const p of paths) {
                const absPath = path.resolve(process.cwd(), p);
                if (fs.existsSync(absPath)) {
                    logger.success(pc.green(`[OK] Extended asset "${p}" found.`));
                } else {
                    logger.error(pc.red(`[ERROR] Extended asset "${p}" not found.`));
                    hasErrors = true;
                }
            }
        }
    }

    if (hasErrors) {
        logger.error(pc.red('\nValidation failed with errors.'));
        process.exit(1);
    } else {
        logger.success(pc.green('\nValidation passed!'));
    }
};
