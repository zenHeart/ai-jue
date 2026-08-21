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
import type { ApplyScope } from "ai-jue-core";
import {
  isTargetEnabled,
  resolveTargetSelection,
} from "../artifact-kind";
import {
  runCoreAdapter,
  RunCoreAdapterOptions,
} from "../core-apply";
import { loadExtensionAdapterGuarded } from "../extension-loader";

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
    })
    .option("frozen", {
      type: "boolean",
      description: "Require immutable Capability Source references",
      default: false,
    })
    .option("dry-run", {
      type: "boolean",
      description: t("commands.apply.dry_run_describe"),
      default: false,
    })
    .option("check", {
      type: "boolean",
      description: t("commands.apply.check_describe"),
      default: false,
    })
    .option("artifact", {
      alias: "artifact-kind",
      type: "string",
      description: t("commands.apply.artifact_describe"),
    })
    .option("scope", {
      type: "string",
      choices: ["project", "user"] as const,
      description: t("commands.apply.scope_describe"),
    });
};

const ADAPTER_ALIAS_MAP: Record<string, string> = {
  codex: "ai-jue-adapter-codex",
  claude: "ai-jue-adapter-claude",
  "claude-code": "ai-jue-adapter-claude",
  cursor: "ai-jue-adapter-cursor",
  openclaw: "ai-jue-adapter-openclaw",
  hermes: "ai-jue-adapter-hermes",
};
const KNOWN_ADAPTERS = [...new Set(Object.values(ADAPTER_ALIAS_MAP))];

const ADAPTER_INDICATORS: Record<string, string[]> = {
  "ai-jue-adapter-codex": [
    "AGENTS.md",
    ".agents/skills",
    ".codex",
  ],
  "ai-jue-adapter-cursor": [
    ".cursor",
  ],
  "ai-jue-adapter-claude": [
    ".claude",
    "CLAUDE.md",
  ],
  "ai-jue-adapter-openclaw": [
    "openclaw.json",
  ],
  "ai-jue-adapter-hermes": [
    // Not `config.yaml`: that filename is common across many unrelated
    // tools (Docusaurus, mkdocs, Ansible, Serverless, etc.) and would
    // false-positive-detect Hermes on unrelated projects, silently
    // triggering an `npm install -D ai-jue-adapter-hermes` and an apply
    // run against files it was never meant to read. `MEMORY.md` matches
    // the specificity of the other Adapters' indicators (e.g. `CLAUDE.md`).
    "MEMORY.md",
  ],
};

export function resolveAdapterAlias(name: string): string {
  return ADAPTER_ALIAS_MAP[name.toLowerCase()] || name;
}
const CONFIG_SEARCH_PATHS = [
  "ai.config.js",
  "ai.config.cjs",
  "ai.config.json",
  ".airc.js",
  ".airc.cjs",
  ".airc.json",
  "jue.config.js",
  "jue.config.cjs",
  "jue.config.json",
  ".juerc.js",
  ".juerc.cjs",
  ".juerc.json",
];

export function parseRequestedAdapters(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const expanded = list
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => resolveAdapterAlias(item));
  return [...new Set(expanded)];
}

/** `targets.<adapter>.enabled=false` excludes discovery and `--all`. */
export function filterEnabledAdapters(
  adapterNames: string[],
  config: MergedConfig,
): string[] {
  return adapterNames.filter((adapterName) => isTargetEnabled(config, adapterName));
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
      const aliased = resolveAdapterAlias(normalized);
      return (
        aliased !== normalized
          ? aliased
          : discoveredAdapters.find(
              (name) =>
                name === token || toAdapterShortName(name) === normalized,
            )
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

async function ensureConfigReadyForApply(allowInit: boolean): Promise<boolean> {
  const cwd = process.cwd();
  if (hasProjectConfig(cwd)) return true;

  logger.warn(pc.yellow(t("commands.apply.no_config_detected")));

  if (!allowInit) {
    logger.warn(pc.yellow(t("commands.apply.read_only_requires_config")));
    return false;
  }

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

async function ensureAdaptersInstalled(
  adapterNames: string[],
  allowInstall: boolean,
): Promise<string[]> {
  const ready: string[] = [];
  for (const adapterName of adapterNames) {
    if (canResolveAdapter(adapterName)) {
      ready.push(adapterName);
      continue;
    }
    if (!allowInstall) {
      logger.warn(
        pc.yellow(t("commands.apply.read_only_missing_adapter", { packageName: adapterName })),
      );
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

function parseCliArtifact(argv: Arguments): string | undefined {
  const typed = argv as Arguments<{ artifact?: string; "artifact-kind"?: string }>;
  const raw = typed.artifact ?? typed["artifact-kind"];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function configuredAdapters(config: MergedConfig): string[] {
  return Object.entries(config.targets ?? {})
    .filter(([, selection]) => selection?.enabled !== false)
    .map(([name]) => resolveAdapterAlias(name));
}

async function runSingleAdapter(
  adapterName: string,
  config: MergedConfig,
  outputDir: string,
  coreOptions: RunCoreAdapterOptions = {},
): Promise<number> {
  const adapterSpinner = ora(
    t("commands.apply.running_adapter", { name: adapterName }),
  ).start();
  try {
    const adapterPath = require.resolve(adapterName, {
      paths: [process.cwd(), __dirname],
    });
    const adapter = loadExtensionAdapterGuarded(adapterPath);
    adapterSpinner.stop();
    return await runCoreAdapter(adapter, config, outputDir, coreOptions);
  } catch (error: any) {
    adapterSpinner.fail(
      pc.red(
        t("commands.apply.adapter_failed", {
          name: adapterName,
          message: error.message,
        }),
      ),
    );
    process.exitCode = typeof error?.exitCode === "number" ? error.exitCode : 1;
    throw error;
  }
}

/**
 * Run one Adapter per iteration with per-Adapter failure isolation: a
 * failing Adapter is reported (runSingleAdapter) and its exit code is
 * aggregated, but it must not skip the rest of an `--all` batch — otherwise
 * one broken Adapter silently leaves every later target un-applied.
 */
export async function runAdapterList(
  adapterNames: string[],
  config: MergedConfig,
  outputDir: string,
  coreOptions: RunCoreAdapterOptions = {},
): Promise<number> {
  const readyAdapters = await ensureAdaptersInstalled(
    adapterNames,
    !coreOptions.dryRun && !coreOptions.check,
  );
  if (readyAdapters.length === 0) {
    logger.warn(pc.yellow(t("commands.apply.no_adapter_selected")));
    process.exitCode = 1;
    return 1;
  }
  let exitCode = 0;
  for (const adapterName of readyAdapters) {
    try {
      exitCode = Math.max(
        exitCode,
        await runSingleAdapter(adapterName, config, outputDir, coreOptions),
      );
    } catch (error: any) {
      exitCode = Math.max(
        exitCode,
        typeof error?.exitCode === "number" ? error.exitCode : 1,
      );
    }
  }
  return exitCode;
}

async function runAdapters(
  config: MergedConfig,
  outputDir: string,
  options: RunCoreAdapterOptions & { all: boolean; requestedAdapters: string[] },
): Promise<number> {
  const coreOptions: RunCoreAdapterOptions = {
    dryRun: options.dryRun,
    check: options.check,
    artifactKind: options.artifactKind,
    scope: options.scope,
    userHome: options.userHome,
  };
  const allowInstall = !options.dryRun && !options.check;
  const spinner = ora(t("commands.apply.finding_adapters")).start();
  const discoveredAdapters = await findAdapters();
  const availableAdapters = discoverAvailableAdapters(discoveredAdapters);

  if (availableAdapters.length === 0) {
    spinner.warn(pc.yellow(t("commands.apply.no_adapters")));
    if (!options.all && options.requestedAdapters.length === 0) {
      const configured = configuredAdapters(config);
      if (configured.length > 0) {
        return await runAdapterList(configured, config, outputDir, coreOptions);
      }
      if (options.scope !== "user") {
        const footprintDetected = filterEnabledAdapters(
          autoDetectAdapters(KNOWN_ADAPTERS, process.cwd()),
          config,
        );
        if (footprintDetected.length > 0) {
          logger.info(
            pc.cyan(
              t("commands.apply.auto_detected_adapters", {
                count: footprintDetected.length,
                names: footprintDetected.join(", "),
              }),
            ),
          );
          return await runAdapterList(footprintDetected, config, outputDir, coreOptions);
        }
      }
      const manualSelected = await promptManualAdapterSelection(KNOWN_ADAPTERS);
      if (manualSelected.length === 0) {
        logger.warn(pc.yellow(t("commands.apply.no_adapter_selected")));
        return 1;
      }
      logger.info(
        pc.cyan(
          t("commands.apply.manual_selected_adapters", {
            count: manualSelected.length,
            names: manualSelected.join(", "),
          }),
        ),
      );
      return await runAdapterList(manualSelected, config, outputDir, coreOptions);
    }

    if (options.requestedAdapters.length > 0) {
      return await runAdapterList(options.requestedAdapters, config, outputDir, coreOptions);
    }

    if (options.all) {
      return await runAdapterList(
        filterEnabledAdapters(KNOWN_ADAPTERS, config),
        config,
        outputDir,
        coreOptions,
      );
    }

    return 1;
  }

  let targetAdapters = options.all
    ? filterEnabledAdapters(availableAdapters, config)
    : availableAdapters;
  if (!options.all) {
    if (options.requestedAdapters.length === 0) {
      const configured = configuredAdapters(config);
      if (configured.length > 0) {
        targetAdapters = configured;
        logger.info(
          pc.cyan(
            t("commands.apply.configured_adapters", {
              count: configured.length,
              names: configured.join(", "),
            }),
          ),
        );
      } else if (options.scope === "user") {
        spinner.warn(pc.yellow(t("commands.apply.user_scope_requires_selection")));
        const manualSelected = await promptManualAdapterSelection(availableAdapters);
        if (manualSelected.length === 0) return 1;
        targetAdapters = manualSelected;
      } else {
        const detected = filterEnabledAdapters(
          autoDetectAdapters(availableAdapters, process.cwd()),
          config,
        );
        if (detected.length === 0) {
          spinner.warn(pc.yellow(t("commands.apply.no_adapter_detected")));
          const manualSelected = await promptManualAdapterSelection(
            availableAdapters,
          );
          if (manualSelected.length === 0) {
            logger.warn(pc.yellow(t("commands.apply.no_adapter_selected")));
            return 1;
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
      }
    } else {
      let selected = options.requestedAdapters;
      const unknown = selected.filter(
        (name) => !availableAdapters.includes(name),
      );
      if (unknown.length > 0) {
        const installedUnknown = await ensureAdaptersInstalled(unknown, allowInstall);
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
          return 1;
        }
        selected = [...new Set([...selected, ...installedUnknown])];
      }
      targetAdapters = selected;
    }
  }

  const runnableAdapters = await ensureAdaptersInstalled(targetAdapters, allowInstall);
  if (runnableAdapters.length === 0) {
    spinner.fail(pc.red(t("commands.apply.no_adapter_selected")));
    process.exitCode = 1;
    return 1;
  }

  spinner.succeed(
    pc.green(
      t("commands.apply.found_adapters", {
        count: runnableAdapters.length,
        names: runnableAdapters.join(", "),
      }),
    ),
  );

  let exitCode = 0;
  for (const adapterName of runnableAdapters) {
    try {
      exitCode = Math.max(
        exitCode,
        await runSingleAdapter(adapterName, config, outputDir, coreOptions),
      );
    } catch (error: any) {
      exitCode = Math.max(
        exitCode,
        typeof error?.exitCode === "number" ? error.exitCode : 1,
      );
    }
  }
  return exitCode;
}

export interface ApplyRuntime {
  /** Isolated user root injection for tests; CLI production uses os.homedir(). */
  userHome?: string;
}

export const handler = async (argv: Arguments, runtime: ApplyRuntime = {}) => {
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
    dryRun: Boolean((argv as Arguments<{ "dry-run"?: boolean }>)["dry-run"]),
    check: Boolean((argv as Arguments<{ check?: boolean }>).check),
    artifactKind: parseCliArtifact(argv),
    scope: (argv as Arguments<{ scope?: ApplyScope }>).scope,
    userHome: runtime.userHome,
  };

  const runApply = async () => {
    logger.info(pc.bold(pc.blue(t("commands.apply.running"))));
    const readOnly = applyOptions.dryRun || applyOptions.check;
    const configReady = await ensureConfigReadyForApply(!readOnly);
    if (!configReady) {
      process.exitCode = 1;
      return;
    }

    const configEntries = [
      "ai.config.js",
      "ai.config.cjs",
      "jue.config.js",
      "jue.config.cjs",
      ".airc.js",
      ".airc.cjs",
      ".juerc.js",
      ".juerc.cjs",
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

      const finalConfig = await resolveFinalConfig(config, {
        frozen: Boolean((argv as Arguments<{ frozen?: boolean }>).frozen),
        persistLock: !readOnly,
      });

      const exitCode = await runAdapters(finalConfig, process.cwd(), applyOptions);
      process.exitCode = exitCode;

      if (exitCode === 0) {
        logger.success(pc.bold(pc.green(t("commands.apply.finished"))));
      }
    } catch (error: any) {
      logger.error(t("commands.apply.failed", { message: error.message }));
      process.exitCode = typeof error?.exitCode === "number" ? error.exitCode : 1;
    }
  };

  await runApply();

  if (argv.watch) {
    logger.info(pc.cyan(t("commands.apply.watch_start")));

    const watchPaths = [
      path.join(process.cwd(), "ai.config.js"),
      path.join(process.cwd(), "ai.config.cjs"),
      path.join(process.cwd(), "ai.config.json"),
      path.join(process.cwd(), ".airc.js"),
      path.join(process.cwd(), ".airc.cjs"),
      path.join(process.cwd(), ".airc.json"),
      path.join(process.cwd(), "jue.config.js"),
      path.join(process.cwd(), "jue.config.cjs"),
      path.join(process.cwd(), "jue.config.json"),
      path.join(process.cwd(), ".juerc.js"),
      path.join(process.cwd(), ".juerc.cjs"),
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
