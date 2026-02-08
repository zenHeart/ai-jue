import { Arguments, CommandBuilder } from 'yargs';
import { loadConfig } from '../config';
import { exec } from 'child_process';
import { promisify } from 'util';
import pc from 'picocolors';
import { logger } from '../logger';

const execAsync = promisify(exec);

export const command = 'check';
export const describe = 'Check for updates for installed presets';

export const builder: CommandBuilder = (yargs) => yargs;

export const handler = async (argv: Arguments) => {
    logger.info(pc.blue('Checking for preset updates...'));
    const config = await loadConfig();
    const presets = config.presets || (config.preset ? [config.preset] : []);

    if (presets.length === 0) {
        logger.warn(pc.yellow('No presets found in configuration.'));
        return;
    }

    const checks = presets.map(async (presetName: string) => {
        // Security check: ensure presetName contains only safe characters to prevent shell injection
        if (!/^[a-zA-Z0-9\-_@\/]+$/.test(presetName)) {
            logger.error(pc.red(`[SECURITY] Invalid preset name skipped: "${presetName}"`));
            return;
        }

        const packageName = `jue-preset-${presetName}`;
        try {
            // Try to find the package.json of the installed preset
            let installedVersion = 'unknown';
            try {
                const pkgJsonPath = require.resolve(`${packageName}/package.json`, { paths: [process.cwd()] });
                installedVersion = require(pkgJsonPath).version;
            } catch (e) {
                // console.warn(`Could not find installed version for ${packageName}`);
            }

            // Check latest version from npm
            // Use --json for easier parsing if needed, but version string is fine
            const { stdout } = await execAsync(`npm view ${packageName} version`);
            const latestVersion = stdout.trim();

            if (installedVersion !== 'unknown' && latestVersion && installedVersion !== latestVersion) {
                logger.info(`${packageName}: ${installedVersion} -> ${pc.green(latestVersion)} ${pc.yellow('[UPDATE]')}`);
            } else if (installedVersion === latestVersion) {
                logger.info(`${packageName}: ${pc.green(installedVersion)} ${pc.dim('[LATEST]')}`);
            } else {
                logger.info(`${packageName}: Installed=${installedVersion}, Latest=${latestVersion}`);
            }
        } catch (error: any) {
            logger.error(pc.red(`Error checking ${packageName}: ${error.message}`));
        }
    });

    await Promise.all(checks);
};
