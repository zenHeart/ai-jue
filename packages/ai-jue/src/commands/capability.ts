import fs from "fs";
import path from "path";
import { Arguments, CommandBuilder } from "yargs";
import pc from "picocolors";
import { loadConfig } from "../config";
import { resolveFinalConfig } from "../resolver";
import { CapabilitySourceOptions } from "../capability-source";
import { logger } from "../logger";
import { t } from "../i18n";

export const command = "capability <subcommand>";
export const describe = ""; // Set in cli.ts for dynamic translation, matching other commands.

export interface CapabilityUpdateResult {
  updated: string[];
}

/**
 * Re-resolves ai.capabilities references (root config + preset chain) and
 * rewrites ai-jue.lock. `sourceOptions` lets callers (tests, and eventually
 * other commands) inject fetch/cacheDir without touching the real network or
 * the real ~/.cache/ai-jue directory.
 */
export async function runCapabilityUpdate(
  name: string | undefined,
  sourceOptions: CapabilitySourceOptions = {},
): Promise<CapabilityUpdateResult> {
  const config = await loadConfig();
  const forceRefresh: CapabilitySourceOptions["forceRefresh"] = name
    ? new Set([name])
    : true;

  await resolveFinalConfig(config, { ...sourceOptions, forceRefresh });

  const lockPath = path.join(process.cwd(), "ai-jue.lock");
  if (!fs.existsSync(lockPath)) {
    if (name) {
      throw new Error(t("commands.capability.update.unknown", { name }));
    }
    return { updated: [] };
  }

  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  const resolvedNames = Object.keys(lock.capabilities || {});
  if (name && !resolvedNames.includes(name)) {
    throw new Error(t("commands.capability.update.unknown", { name }));
  }

  return { updated: name ? [name] : resolvedNames };
}

export const builder: CommandBuilder = (yargs) =>
  yargs
    .command(
      "update [name]",
      t("commands.capability.update.describe"),
      (y) =>
        y.positional("name", {
          type: "string",
          describe: t("commands.capability.update.name_describe"),
        }),
      async (argv: Arguments<{ name?: string }>) => {
        const name = argv.name;
        logger.info(
          pc.blue(
            name
              ? t("commands.capability.update.updating_one", { name })
              : t("commands.capability.update.updating_all"),
          ),
        );
        try {
          const result = await runCapabilityUpdate(name);
          if (result.updated.length === 0) {
            logger.info(t("commands.capability.update.none"));
            return;
          }
          logger.success(
            pc.green(
              name
                ? t("commands.capability.update.success_one", { name })
                : t("commands.capability.update.success_all", {
                    count: result.updated.length,
                  }),
            ),
          );
        } catch (error: any) {
          logger.error(
            pc.red(
              t("commands.capability.update.failed", { message: error.message }),
            ),
          );
          process.exitCode = 1;
        }
      },
    )
    .demandCommand(1);

export const handler = () => {
  // yargs dispatches to the `update` subcommand above; this top-level
  // handler only runs if no subcommand matched, which demandCommand(1)
  // already turns into a usage error.
};
