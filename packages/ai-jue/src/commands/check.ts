import { Arguments, CommandBuilder } from "yargs";
import { loadConfig } from "../config";
import { exec } from "child_process";
import { promisify } from "util";
import pc from "picocolors";
import { logger } from "../logger";
import { t } from "../i18n";

const execAsync = promisify(exec);

export const command = "check";
export const describe = "";

export const builder: CommandBuilder = (yargs) =>
  yargs.option("json", {
    type: "boolean",
    describe: "Output result as JSON",
    default: false,
  });

export const handler = async (argv: Arguments) => {
  const isJson = argv.json;

  if (!isJson) {
    logger.info(pc.blue(t("commands.check.checking")));
  }

  const config = await loadConfig();
  const presets = config.presets || (config.preset ? [config.preset] : []);

  if (presets.length === 0) {
    if (!isJson) {
      logger.warn(pc.yellow(t("commands.list.no_presets")));
    } else {
      console.log(JSON.stringify({ presets: [] }));
    }
    return;
  }

  const results: any[] = [];

  const checks = presets.map(async (presetName: string) => {
    // Security check: ensure presetName contains only safe characters to prevent shell injection
    if (!/^[a-zA-Z0-9\-_@\/]+$/.test(presetName)) {
      if (!isJson) {
        logger.error(
          pc.red(`[SECURITY] Invalid preset name skipped: "${presetName}"`),
        );
      }
      return;
    }

    const packageName = `jue-preset-${presetName}`;
    try {
      // Try to find the package.json of the installed preset
      let installedVersion = "unknown";
      try {
        const pkgJsonPath = require.resolve(`${packageName}/package.json`, {
          paths: [process.cwd()],
        });
        installedVersion = require(pkgJsonPath).version;
      } catch (e) {
        // console.warn(`Could not find installed version for ${packageName}`);
      }

      // Check latest version from npm
      const { stdout } = await execAsync(`npm view ${packageName} version`);
      const latestVersion = stdout.trim();

      const hasUpdate =
        installedVersion !== "unknown" &&
        latestVersion &&
        installedVersion !== latestVersion;

      results.push({
        preset: presetName,
        packageName,
        installedVersion,
        latestVersion,
        hasUpdate,
      });

      if (!isJson) {
        if (hasUpdate) {
          logger.info(
            `${packageName}: ${installedVersion} -> ${pc.green(latestVersion)} ${pc.yellow("[UPDATE]")}`,
          );
        } else if (installedVersion === latestVersion) {
          logger.info(
            `${packageName}: ${pc.green(installedVersion)} ${pc.dim("[LATEST]")}`,
          );
        } else {
          logger.info(
            `${packageName}: Installed=${installedVersion}, Latest=${latestVersion}`,
          );
        }
      }
    } catch (error: any) {
      if (!isJson) {
        logger.error(
          pc.red(t("commands.check.failed", { message: error.message })),
        );
      } else {
        results.push({
          preset: presetName,
          packageName,
          error: error.message,
        });
      }
    }
  });

  await Promise.all(checks);

  if (isJson) {
    console.log(JSON.stringify({ presets: results }));
  }
};
