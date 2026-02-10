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

async function main() {
  const config = await loadConfig();
  await initI18n(config.language);

  yargs(hideBin(process.argv))
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
