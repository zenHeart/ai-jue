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
  return yargs
    .option("watch", {
      alias: "w",
      type: "boolean",
      description: t("commands.apply.watch_describe"),
      default: false,
    })
    .option("adapter", {
      type: "string",
      array: true,
      description: t("commands.apply.adapter_describe"),
    })
    .option("all", {
      alias: "a",
      type: "boolean",
      description: t("commands.apply.all_describe"),
      default: false,
    });
};

const ADAPTER_ALIAS_MAP: Record<string, string> = {
  claude: "ai-jue-adapter-claude",
  "claude-code": "ai-jue-adapter-claude",
  cursor: "ai-jue-adapter-cursor",
  gemini: "ai-jue-adapter-gemini",
  copilot: "ai-jue-adapter-copilot",
};

const ADAPTER_INDICATORS: Record<string, string[]> = {
  "ai-jue-adapter-cursor": [
    ".cursor",
    ".cursor/rules/agents.mdc",
  ],
  "ai-jue-adapter-gemini": [
    ".gemini",
    ".gemini/settings.json",
    "GEMINI.md",
  ],
  "ai-jue-adapter-claude": [
    ".claude",
    "CLAUDE.md",
  ],
  "ai-jue-adapter-copilot": [
    ".github/copilot-instructions.md",
    ".github/copilot-settings.json",
  ],
};

function parseRequestedAdapters(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const expanded = list
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ADAPTER_ALIAS_MAP[item.toLowerCase()] || item);
  return [...new Set(expanded)];
}

function autoDetectAdapters(
  discoveredAdapters: string[],
  cwd: string,
): string[] {
  return discoveredAdapters.filter((adapterName) => {
    const indicators = ADAPTER_INDICATORS[adapterName];
    if (!indicators || indicators.length === 0) return false;
    return indicators.some((relativePath) =>
      fs.existsSync(path.join(cwd, relativePath)),
    );
  });
}

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

async function runAdapters(
  config: MergedConfig,
  outputDir: string,
  options: { all: boolean; requestedAdapters: string[] },
) {
  const spinner = ora(t("commands.apply.finding_adapters")).start();
  const discoveredAdapters = await findAdapters();

  if (discoveredAdapters.length === 0) {
    spinner.warn(pc.yellow(t("commands.apply.no_adapters")));
    return;
  }

  let targetAdapters = discoveredAdapters;
  if (!options.all) {
    if (options.requestedAdapters.length === 0) {
      const detected = autoDetectAdapters(discoveredAdapters, process.cwd());
      if (detected.length === 0) {
        spinner.warn(pc.yellow(t("commands.apply.no_adapter_selected")));
        return;
      }
      targetAdapters = detected;
      logger.info(
        pc.cyan(
          t("commands.apply.auto_detected_adapters", {
            count: detected.length,
            names: detected.join(", "),
          }),
        ),
      );
    } else {
      const unknown = options.requestedAdapters.filter(
        (name) => !discoveredAdapters.includes(name),
      );
      if (unknown.length > 0) {
        spinner.fail(
          pc.red(
            t("commands.apply.unknown_adapters", {
              unknown: unknown.join(", "),
              available: discoveredAdapters.join(", "),
            }),
          ),
        );
        process.exitCode = 1;
        return;
      }

      targetAdapters = options.requestedAdapters;
    }
  }

  spinner.succeed(
    pc.green(
      t("commands.apply.found_adapters", {
        count: targetAdapters.length,
        names: targetAdapters.join(", "),
      }),
    ),
  );

  for (const adapterName of targetAdapters) {
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
  const requestedAdapters = parseRequestedAdapters(
    (argv as Arguments<{ adapter?: string[] }>).adapter,
  );
  const applyOptions = {
    all: Boolean((argv as Arguments<{ all?: boolean }>).all),
    requestedAdapters,
  };

  const runApply = async () => {
    logger.info(pc.bold(pc.blue(t("commands.apply.running"))));
    const configEntries = [
      "ai.config.js",
      "jue.config.js",
      ".airc.js",
      ".juerc.js",
    ];
    for (const entry of configEntries) {
      try {
        const configPath = path.join(process.cwd(), entry);
        delete require.cache[require.resolve(configPath)];
      } catch (e) {
        // Ignore if file not found or not cached
      }
    }

    try {
      const config = await loadConfig(); // user config from ai.config.js
      logger.debug(pc.dim(t("commands.apply.loaded_config")));

      const finalConfig = await resolveFinalConfig(config);

      await runAdapters(finalConfig, process.cwd(), applyOptions);

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
      path.join(process.cwd(), "ai.config.json"),
      path.join(process.cwd(), ".airc.js"),
      path.join(process.cwd(), ".airc.json"),
      path.join(process.cwd(), "jue.config.js"),
      path.join(process.cwd(), "jue.config.json"),
      path.join(process.cwd(), ".juerc.js"),
      path.join(process.cwd(), ".juerc.json"),
      path.join(process.cwd(), "AGENTS.md"),
      path.join(process.cwd(), ".ai"),
      path.join(process.cwd(), ".jue"),
    ];

    const watcher = chokidar.watch(watchPaths, {
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
