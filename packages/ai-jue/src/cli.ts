#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  handler as initHandler,
  builder as initBuilder,
  describe as initDescribe,
  command as initCommandStr,
} from "./commands/init";
import {
  handler as applyHandler,
  builder as applyBuilder,
  describe as applyDescribe,
  command as applyCommandStr,
} from "./commands/apply";
import {
  handler as createPresetHandler,
  builder as createPresetBuilder,
  describe as createPresetDescribe,
  command as createPresetCommandStr,
} from "./commands/create-preset";
import {
  handler as checkHandler,
  builder as checkBuilder,
  describe as checkDescribe,
  command as checkCommandStr,
} from "./commands/check";
import {
  handler as validateHandler,
  builder as validateBuilder,
  describe as validateDescribe,
  command as validateCommandStr,
} from "./commands/validate";
import {
  handler as listHandler,
  builder as listBuilder,
  describe as listDescribe,
  command as listCommandStr,
} from "./commands/list";
import { logger, LogLevel } from "./logger";
import { initI18n, t } from "./i18n";
import { loadConfig } from "./config";
const CLI_VERSION: string = require("../package.json").version;

function parseRuntimeLang(rawArgv: string[]): string | undefined {
  for (let i = 0; i < rawArgv.length; i++) {
    const arg = rawArgv[i];
    if (arg === "--lang" || arg === "-l") {
      const value = rawArgv[i + 1];
      if (value && !value.startsWith("-")) return value;
    }
    if (arg.startsWith("--lang=")) {
      const value = arg.slice("--lang=".length).trim();
      if (value) return value;
    }
  }
  return undefined;
}

async function main() {
  const config = await loadConfig();
  const runtimeLang = parseRuntimeLang(hideBin(process.argv));
  if (runtimeLang) {
    process.env.AI_JUE_LANG = runtimeLang;
  }
  await initI18n(runtimeLang || config.language);

  yargs(hideBin(process.argv))
    .version(CLI_VERSION)
    .option("lang", {
      alias: "l",
      type: "string",
      description: t("common.lang_describe", {
        defaultValue: "Runtime language override (e.g. en, zh)",
      }),
    })
    .option("verbose", {
      alias: "v",
      type: "boolean",
      description: t("common.verbose_describe", {
        defaultValue: "Run with verbose logging",
      }),
    })
    .middleware((argv) => {
      if (argv.verbose) {
        logger.setLevel(LogLevel.DEBUG);
        logger.debug("Verbose mode enabled");
      }
    })
    .command(
      initCommandStr,
      t("commands.init.describe"),
      initBuilder as any,
      initHandler,
    )
    .command(
      applyCommandStr,
      t("commands.apply.describe"),
      applyBuilder as any,
      applyHandler,
    )
    .command(
      createPresetCommandStr,
      t("commands.create-preset.describe"),
      createPresetBuilder as any,
      createPresetHandler,
    )
    .command(
      checkCommandStr,
      t("commands.check.describe"),
      checkBuilder as any,
      checkHandler,
    )
    .command(
      validateCommandStr,
      t("commands.validate.describe"),
      validateBuilder as any,
      validateHandler,
    )
    .command(
      listCommandStr,
      t("commands.list.describe"),
      listBuilder as any,
      listHandler,
    )
    .demandCommand(
      1,
      t("common.demand_command", {
        defaultValue: "You need at least one command before moving on",
      }),
    )
    .help().argv;
}

main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
