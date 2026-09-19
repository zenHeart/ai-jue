import { Arguments, CommandBuilder } from "yargs";
import { loadConfig } from "../config";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import pc from "picocolors";
import { logger } from "../logger";
import { t } from "../i18n";

const execFileAsync = promisify(execFile);

export interface PresetCheckResult {
  preset: string;
  packageName: string;
  installedVersion: string;
  latestVersion?: string;
  hasUpdate: boolean;
  skipped?: boolean;
  error?: string;
}

function isLocalDependencySpec(value: unknown): boolean {
  return typeof value === "string" && /^(?:file|workspace|link):/.test(value);
}

function isLocalPreset(
  packageName: string,
  packageJsonPath: string,
  packageJson: Record<string, any>,
  cwd: string,
): boolean {
  if (packageJson.private === true) return true;
  const packageDir = fs.realpathSync(path.dirname(packageJsonPath));
  const projectRoot = fs.realpathSync(cwd);
  const relative = path.relative(projectRoot, packageDir);
  if (
    relative &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !relative.split(path.sep).includes("node_modules")
  ) {
    return true;
  }

  const rootManifestPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(rootManifestPath)) {
    const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, "utf8"));
    const declared = {
      ...rootManifest.dependencies,
      ...rootManifest.devDependencies,
      ...rootManifest.optionalDependencies,
    }[packageName];
    if (isLocalDependencySpec(declared)) return true;
  }

  const lockPath = path.join(projectRoot, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    const entry = lock.packages?.[`node_modules/${packageName}`];
    if (entry?.link === true || isLocalDependencySpec(entry?.resolved)) return true;
  }
  return false;
}

export async function checkPresetVersions(
  presets: string[],
  options: {
    cwd?: string;
    viewVersion?: (packageName: string) => Promise<string>;
  } = {},
): Promise<PresetCheckResult[]> {
  const cwd = options.cwd ?? process.cwd();
  const viewVersion =
    options.viewVersion ??
    (async (packageName: string) => {
      const { stdout } = await execFileAsync("npm", ["view", packageName, "version"], {
        cwd,
      });
      return stdout.trim();
    });

  return Promise.all(
    presets.map(async (presetName): Promise<PresetCheckResult> => {
      if (!/^[a-zA-Z0-9\-_@/]+$/.test(presetName)) {
        return {
          preset: presetName,
          packageName: "",
          installedVersion: "unknown",
          hasUpdate: false,
          error: "Invalid preset name",
        };
      }
      const packageName = presetName.startsWith("jue-preset-")
        ? presetName
        : `jue-preset-${presetName}`;
      let installedVersion = "unknown";
      try {
        const packageJsonPath = require.resolve(`${packageName}/package.json`, {
          paths: [cwd],
        });
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        installedVersion =
          typeof packageJson.version === "string"
            ? packageJson.version
            : "unknown";
        if (isLocalPreset(packageName, packageJsonPath, packageJson, cwd)) {
          return {
            preset: presetName,
            packageName,
            installedVersion,
            hasUpdate: false,
            skipped: true,
          };
        }
      } catch {
        // Registry lookup still gives a useful latest version for an uninstalled preset.
      }

      try {
        const latestVersion = await viewVersion(packageName);
        return {
          preset: presetName,
          packageName,
          installedVersion,
          latestVersion,
          hasUpdate:
            installedVersion !== "unknown" &&
            Boolean(latestVersion) &&
            installedVersion !== latestVersion,
        };
      } catch (error: any) {
        return {
          preset: presetName,
          packageName,
          installedVersion,
          hasUpdate: false,
          error: error.message,
        };
      }
    }),
  );
}

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

  const results = await checkPresetVersions(presets);

  if (!isJson) {
    for (const result of results) {
      if (result.error) {
        logger.error(pc.red(t("commands.check.failed", { message: result.error })));
        process.exitCode = 1;
      } else if (result.skipped) {
        logger.info(`${result.packageName}: ${pc.dim("[LOCAL — SKIPPED]")}`);
      } else if (result.hasUpdate) {
          logger.info(
          `${result.packageName}: ${result.installedVersion} -> ${pc.green(result.latestVersion!)} ${pc.yellow("[UPDATE]")}`,
          );
      } else if (result.installedVersion === result.latestVersion) {
          logger.info(
          `${result.packageName}: ${pc.green(result.installedVersion)} ${pc.dim("[LATEST]")}`,
          );
      } else {
          logger.info(
          `${result.packageName}: Installed=${result.installedVersion}, Latest=${result.latestVersion}`,
          );
      }
    }
  } else {
    console.log(JSON.stringify({ presets: results }));
  }
};
