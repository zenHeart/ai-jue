import { Arguments, CommandBuilder } from "yargs";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { spawnSync } from "child_process";
import { loadConfig, MergedConfig } from "../config";
import { resolveFinalConfig } from "../resolver";
import * as glob from "glob";
import pc from "picocolors";
import ora from "ora";
import { createInterface } from "readline/promises";
import { logger } from "../logger";
import { t } from "../i18n";
import { runInitFlow } from "./init";

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
    .option("adpater", {
      type: "string",
      array: true,
      description: "",
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
const KNOWN_ADAPTERS = [...new Set(Object.values(ADAPTER_ALIAS_MAP))];

const ADAPTER_INDICATORS: Record<string, string[]> = {
  "ai-jue-adapter-cursor": [
    ".cursor",
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
const CONFIG_SEARCH_PATHS = [
  "ai.config.js",
  "ai.config.json",
  ".airc.js",
  ".airc.json",
  "jue.config.js",
  "jue.config.json",
  ".juerc.js",
  ".juerc.json",
];

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

function toAdapterShortName(adapterName: string): string {
  const prefix = "ai-jue-adapter-";
  return adapterName.startsWith(prefix)
    ? adapterName.slice(prefix.length)
    : adapterName;
}

function parseManualSelection(
  raw: string,
  discoveredAdapters: string[],
): string[] {
  const input = raw.trim();
  if (!input) return [];
  if (input.toLowerCase() === "all") return discoveredAdapters;

  const picked = input
    .split(/[,\s，]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const resolved = picked
    .map((token) => {
      if (/^\d+$/.test(token)) {
        const idx = Number(token) - 1;
        return discoveredAdapters[idx];
      }
      const normalized = token.toLowerCase();
      return (
        ADAPTER_ALIAS_MAP[normalized] ||
        discoveredAdapters.find((name) => name === token || toAdapterShortName(name) === normalized)
      );
    })
    .filter((item): item is string => Boolean(item));

  return [...new Set(resolved)];
}

async function promptManualAdapterSelection(
  discoveredAdapters: string[],
): Promise<string[]> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    logger.warn(pc.yellow(t("commands.apply.manual_selection_unavailable")));
    return [];
  }

  try {
    const Enquirer: any = require("enquirer");
    const MultiSelect = Enquirer.MultiSelect as any;
    const prompt = new MultiSelect({
      name: "adapters",
      message: t("commands.apply.manual_selection_intro"),
      hint: t("commands.apply.manual_selection_hint_inquirer"),
      choices: discoveredAdapters.map((adapter) => ({
        name: adapter,
        message: `${toAdapterShortName(adapter)} (${adapter})`,
      })),
      result(names: string[]) {
        return names;
      },
    });
    const selected = await prompt.run();
    if (!Array.isArray(selected)) return [];
    return selected.filter((item) => discoveredAdapters.includes(item));
  } catch (_error) {
    // Fallback for terminals that don't support interactive multiselect.
    logger.info(pc.cyan(t("commands.apply.manual_selection_intro")));
    discoveredAdapters.forEach((adapter, index) => {
      logger.log(
        `  ${index + 1}. ${toAdapterShortName(adapter)} (${adapter})`,
      );
    });
    logger.log(pc.dim(t("commands.apply.manual_selection_hint")));

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      const answer = await rl.question(
        `${t("commands.apply.manual_selection_prompt")} `,
      );
      return parseManualSelection(answer, discoveredAdapters);
    } finally {
      rl.close();
    }
  }
}

function hasProjectConfig(cwd: string): boolean {
  if (
    CONFIG_SEARCH_PATHS.some((fileName) =>
      fs.existsSync(path.join(cwd, fileName)),
    )
  ) {
    return true;
  }

  const packageJsonPath = path.join(cwd, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return Boolean(pkg?.ai || pkg?.jue);
  } catch {
    return false;
  }
}

async function ensureConfigReadyForApply(): Promise<boolean> {
  const cwd = process.cwd();
  if (hasProjectConfig(cwd)) return true;

  logger.warn(pc.yellow(t("commands.apply.no_config_detected")));

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    logger.warn(pc.yellow(t("commands.apply.no_config_non_interactive")));
    return false;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`${t("commands.apply.ask_init_before_apply")} `);
    if (answer.trim().toLowerCase() === "n") {
      logger.warn(pc.yellow(t("commands.apply.init_declined")));
      return false;
    }
  } finally {
    rl.close();
  }

  await runInitFlow({
    promptForAiDir: false,
    ensurePresetInstalled: true,
  });

  if (!hasProjectConfig(cwd)) {
    logger.warn(pc.yellow(t("commands.apply.init_not_completed")));
    return false;
  }

  logger.info(pc.green(t("commands.apply.init_completed_continue")));
  return true;
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

function detectPackageManager(): "npm" | "pnpm" | "yarn" {
  if (fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(process.cwd(), "yarn.lock"))) return "yarn";
  return "npm";
}

function installAdapterPackage(adapterName: string): boolean {
  const pm = detectPackageManager();
  const argsByPm: Record<string, string[]> = {
    npm: ["install", "-D", adapterName],
    pnpm: ["add", "-D", adapterName],
    yarn: ["add", "-D", adapterName],
  };
  const args = argsByPm[pm];
  logger.info(
    t("commands.apply.installing_adapter", {
      packageName: adapterName,
      command: `${pm} ${args.join(" ")}`,
    }),
  );
  const result = spawnSync(pm, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

async function ensureAdaptersInstalled(adapterNames: string[]): Promise<string[]> {
  const ready: string[] = [];
  for (const adapterName of adapterNames) {
    if (canResolveAdapter(adapterName)) {
      ready.push(adapterName);
      continue;
    }
    const installed = installAdapterPackage(adapterName);
    if (installed && canResolveAdapter(adapterName)) {
      logger.success(
        t("commands.apply.installed_adapter", { packageName: adapterName }),
      );
      ready.push(adapterName);
    } else {
      logger.warn(
        t("commands.apply.install_adapter_failed", { packageName: adapterName }),
      );
    }
  }
  return ready;
}

function canResolveAdapter(adapterName: string): boolean {
  try {
    require.resolve(adapterName, {
      paths: [process.cwd(), __dirname],
    });
    return true;
  } catch {
    return false;
  }
}

function discoverAvailableAdapters(discoveredAdapters: string[]): string[] {
  const resolvableKnownAdapters = KNOWN_ADAPTERS.filter((name) =>
    canResolveAdapter(name),
  );
  return [...new Set([...discoveredAdapters, ...resolvableKnownAdapters])];
}

async function runSingleAdapter(
  adapterName: string,
  config: MergedConfig,
  outputDir: string,
): Promise<void> {
  const adapterSpinner = ora(
    t("commands.apply.running_adapter", { name: adapterName }),
  ).start();
  try {
    const adapterPath = require.resolve(adapterName, {
      paths: [process.cwd(), __dirname],
    });
    const adapter = require(adapterPath);
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
    process.exitCode = 1;
  }
}

async function runAdapterList(
  adapterNames: string[],
  config: MergedConfig,
  outputDir: string,
): Promise<void> {
  const readyAdapters = await ensureAdaptersInstalled(adapterNames);
  if (readyAdapters.length === 0) {
    logger.warn(pc.yellow(t("commands.apply.no_adapter_selected")));
    process.exitCode = 1;
    return;
  }
  for (const adapterName of readyAdapters) {
    await runSingleAdapter(adapterName, config, outputDir);
  }
}

async function runAdapters(
  config: MergedConfig,
  outputDir: string,
  options: { all: boolean; requestedAdapters: string[] },
) {
  const spinner = ora(t("commands.apply.finding_adapters")).start();
  const discoveredAdapters = await findAdapters();
  const availableAdapters = discoverAvailableAdapters(discoveredAdapters);

  if (availableAdapters.length === 0) {
    spinner.warn(pc.yellow(t("commands.apply.no_adapters")));
    if (!options.all && options.requestedAdapters.length === 0) {
      const footprintDetected = autoDetectAdapters(KNOWN_ADAPTERS, process.cwd());
      if (footprintDetected.length > 0) {
        logger.info(
          pc.cyan(
            t("commands.apply.auto_detected_adapters", {
              count: footprintDetected.length,
              names: footprintDetected.join(", "),
            }),
          ),
        );
        await runAdapterList(footprintDetected, config, outputDir);
        return;
      }
      const manualSelected = await promptManualAdapterSelection(KNOWN_ADAPTERS);
      if (manualSelected.length === 0) {
        logger.warn(pc.yellow(t("commands.apply.no_adapter_selected")));
        return;
      }
      logger.info(
        pc.cyan(
          t("commands.apply.manual_selected_adapters", {
            count: manualSelected.length,
            names: manualSelected.join(", "),
          }),
        ),
      );
      await runAdapterList(manualSelected, config, outputDir);
      return;
    }

    if (options.requestedAdapters.length > 0) {
      await runAdapterList(options.requestedAdapters, config, outputDir);
      return;
    }

    if (options.all) {
      await runAdapterList(KNOWN_ADAPTERS, config, outputDir);
      return;
    }

    return;
  }

  let targetAdapters = availableAdapters;
  if (!options.all) {
    if (options.requestedAdapters.length === 0) {
      const detected = autoDetectAdapters(availableAdapters, process.cwd());
      if (detected.length === 0) {
        spinner.warn(pc.yellow(t("commands.apply.no_adapter_detected")));
        const manualSelected = await promptManualAdapterSelection(
          availableAdapters,
        );
        if (manualSelected.length === 0) {
          logger.warn(pc.yellow(t("commands.apply.no_adapter_selected")));
          return;
        }
        targetAdapters = manualSelected;
        logger.info(
          pc.cyan(
            t("commands.apply.manual_selected_adapters", {
              count: manualSelected.length,
              names: manualSelected.join(", "),
            }),
          ),
        );
      } else {
        targetAdapters = detected;
        logger.info(
          pc.cyan(
            t("commands.apply.auto_detected_adapters", {
              count: detected.length,
              names: detected.join(", "),
            }),
          ),
        );
      }
    } else {
      let selected = options.requestedAdapters;
      const unknown = selected.filter(
        (name) => !availableAdapters.includes(name),
      );
      if (unknown.length > 0) {
        const installedUnknown = await ensureAdaptersInstalled(unknown);
        const stillUnknown = unknown.filter(
          (name) => !installedUnknown.includes(name),
        );
        if (stillUnknown.length > 0) {
          spinner.fail(
            pc.red(
              t("commands.apply.unknown_adapters", {
                unknown: stillUnknown.join(", "),
                available: availableAdapters.join(", "),
              }),
            ),
          );
          process.exitCode = 1;
          return;
        }
        selected = [...new Set([...selected, ...installedUnknown])];
      }
      targetAdapters = selected;
    }
  }

  const runnableAdapters = await ensureAdaptersInstalled(targetAdapters);
  if (runnableAdapters.length === 0) {
    spinner.fail(pc.red(t("commands.apply.no_adapter_selected")));
    process.exitCode = 1;
    return;
  }

  spinner.succeed(
    pc.green(
      t("commands.apply.found_adapters", {
        count: runnableAdapters.length,
        names: runnableAdapters.join(", "),
      }),
    ),
  );

  for (const adapterName of runnableAdapters) {
    await runSingleAdapter(adapterName, config, outputDir);
  }
}

export const handler = async (argv: Arguments) => {
  const runtimeLang =
    typeof (argv as Arguments<{ lang?: string }>).lang === "string"
      ? String((argv as Arguments<{ lang?: string }>).lang).trim()
      : "";
  const typoAdapters = parseRequestedAdapters(
    (argv as Arguments<{ adpater?: string[] }>).adpater,
  );
  if (typoAdapters.length > 0) {
    logger.warn(pc.yellow(t("commands.apply.adapter_typo_option")));
  }
  const requestedAdapters = parseRequestedAdapters(
    (argv as Arguments<{ adapter?: string[] }>).adapter,
  );
  const mergedRequestedAdapters = [...new Set([...requestedAdapters, ...typoAdapters])];
  const applyOptions = {
    all: Boolean((argv as Arguments<{ all?: boolean }>).all),
    requestedAdapters: mergedRequestedAdapters,
  };

  const runApply = async () => {
    logger.info(pc.bold(pc.blue(t("commands.apply.running"))));
    const configReady = await ensureConfigReadyForApply();
    if (!configReady) {
      process.exitCode = 1;
      return;
    }

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
      if (runtimeLang) {
        config.language = runtimeLang;
      }
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
