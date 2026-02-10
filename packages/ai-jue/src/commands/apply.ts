import { Arguments, CommandBuilder } from "yargs";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { loadConfig, MergedConfig } from "../config";
import { resolveFinalConfig } from "../resolver";
import * as glob from "glob";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../logger";
import { t } from "../i18n";

export const command = "apply";
export const describe = ""; // Managed in cli.ts for dynamic translation

export const builder: CommandBuilder = (yargs) => {
  return yargs.option("watch", {
    alias: "w",
    type: "boolean",
    description: t("commands.apply.watch_describe"),
    default: false,
  });
};

async function findAdapters(): Promise<string[]> {
  const rootDir = process.cwd();
  const options = { cwd: rootDir, realpath: true as const };

  const [monorepoAdapters, installedAdapters] = await Promise.all([
    glob.glob("packages/ai-jue-adapter-*/package.json", options),
    glob.glob("**/node_modules/ai-jue-adapter-*/package.json", options),
  ]);

  const allAdapterPackageJsons = [...monorepoAdapters, ...installedAdapters];
  const uniqueAdapterPackageJsons = [...new Set(allAdapterPackageJsons)];

  const packageNames: string[] = [];
  await Promise.all(
    uniqueAdapterPackageJsons.map(async (pkgJsonPath) => {
      try {
        const pkgJsonContent = await fs.promises.readFile(pkgJsonPath, "utf8");
        const pkgJson = JSON.parse(pkgJsonContent);
        if (pkgJson.name) {
          packageNames.push(pkgJson.name);
        }
      } catch (e) {
        logger.error(`Could not read or parse ${pkgJsonPath}`, e);
      }
    }),
  );
  return packageNames;
}

async function runAdapters(config: MergedConfig, outputDir: string) {
  const spinner = ora(t("commands.apply.finding_adapters")).start();
  const adapterNames = await findAdapters();

  if (adapterNames.length === 0) {
    spinner.warn(pc.yellow(t("commands.apply.no_adapters")));
    return;
  }

  spinner.succeed(
    pc.green(
      t("commands.apply.found_adapters", {
        count: adapterNames.length,
        names: adapterNames.join(", "),
      }),
    ),
  );

  for (const adapterName of adapterNames) {
    const adapterSpinner = ora(
      t("commands.apply.running_adapter", { name: adapterName }),
    ).start();
    try {
      const adapter = require(adapterName);
      if (adapter.generate && typeof adapter.generate === "function") {
        await adapter.generate(config, outputDir);
        adapterSpinner.succeed(
          pc.green(t("commands.apply.adapter_success", { name: adapterName })),
        );
      } else {
        adapterSpinner.warn(
          pc.yellow(
            t("commands.apply.adapter_no_generate", { name: adapterName }),
          ),
        );
      }
    } catch (error: any) {
      adapterSpinner.fail(
        pc.red(
          t("commands.apply.adapter_failed", {
            name: adapterName,
            message: error.message,
          }),
        ),
      );
      // Don't throw here to allow other adapters to run, but mark as failure?
      process.exitCode = 1;
    }
  }
}

export const handler = async (argv: Arguments) => {
  const runApply = async () => {
    logger.info(pc.bold(pc.blue(t("commands.apply.running"))));
    try {
      // Need to clear require cache for ai.config.js to support reloading
      const configPath = path.join(process.cwd(), "ai.config.js");
      delete require.cache[require.resolve(configPath)];
    } catch (e) {
      // Ignore if file not found or not cached
    }

    try {
      const config = await loadConfig(); // user config from ai.config.js
      logger.debug(pc.dim(t("commands.apply.loaded_config")));

      const finalConfig = await resolveFinalConfig(config);

      // Run all discovered adapters
      await runAdapters(finalConfig, process.cwd());

      logger.success(pc.bold(pc.green(t("commands.apply.finished"))));
    } catch (error: any) {
      logger.error(t("commands.apply.failed", { message: error.message }));
      process.exitCode = 1;
    }
  };

  await runApply();

  if (argv.watch) {
    logger.info(pc.cyan(t("commands.apply.watch_start")));

    const watchPaths = [
      path.join(process.cwd(), "ai.config.js"),
      path.join(process.cwd(), ".ai"),
      path.join(process.cwd(), ".jue"),
    ];

    const watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    let isUpdating = false;
    const debouncedApply = async () => {
      if (isUpdating) return;
      isUpdating = true;
      logger.info(pc.yellow(t("commands.apply.watch_update")));
      await runApply();
      isUpdating = false;
    };

    watcher.on("change", debouncedApply);
    watcher.on("add", debouncedApply);
    watcher.on("unlink", debouncedApply);

    // Graceful Shutdown
    const cleanup = async () => {
      logger.info(pc.cyan(t("commands.apply.watch_stop")));
      await watcher.close();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    // Keep process alive
    await new Promise(() => {});
  }
};
