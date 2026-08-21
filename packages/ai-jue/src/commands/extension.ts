import fs from "fs";
import path from "path";
import { CommandBuilder } from "yargs";
import pc from "picocolors";
import { CanonicalDocumentSchema } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { logger } from "../logger";
import { t } from "../i18n";
import {
  ExtensionPackageIssue,
  loadExtensionGuarded,
  resolveExtensionPackage,
} from "../extension-loader";

export interface FixtureCheckResult {
  name: string;
  path: string;
  ok: boolean;
  error?: string;
}

/**
 * Runs `adapter.read()` against every immediate subdirectory of
 * `fixturesDir` and checks the result against `CanonicalDocumentSchema` —
 * the lightweight "fixture" entry point JUE-203 adds under `jue extension
 * validate`. It deliberately only checks the schema contract; the full
 * equivalence/idempotency/native-confirmation suite is JUE-202's
 * `ai-jue-core/testkit`, run via the Extension's own `npm test`, not
 * reimplemented here.
 */
export async function runExtensionFixtureCheck(
  adapter: Adapter,
  fixturesDir: string,
): Promise<FixtureCheckResult[]> {
  const entries = fs
    .readdirSync(fixturesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const results: FixtureCheckResult[] = [];
  for (const entry of entries) {
    const fixturePath = path.join(fixturesDir, entry.name);
    try {
      const canonical = await adapter.read({ artifactRoot: fixturePath, scope: "project" });
      CanonicalDocumentSchema.parse(canonical);
      results.push({ name: entry.name, path: fixturePath, ok: true });
    } catch (error: any) {
      results.push({ name: entry.name, path: fixturePath, ok: false, error: error.message });
    }
  }
  return results;
}

export const command = "extension <subcommand>";
export const describe = ""; // Set in cli.ts for dynamic translation, matching other commands.

export interface ExtensionValidateResult {
  packageJsonPath: string;
  entryPath: string;
  issues: ExtensionPackageIssue[];
  loaded: boolean;
  adapterIds: string[];
}

/**
 * Validates an Extension package's npm metadata (`exports`/`main`,
 * `peerDependencies`) without running its entry. With `load: true` and no
 * metadata issues, also loads the default export in a guarded import (see
 * `extension-loader.ts`) and validates it as an Adapter-bearing
 * ExtensionDefinition.
 */
export function runExtensionValidate(
  pathOrPackage: string,
  options: { load?: boolean; cwd?: string } = {},
): ExtensionValidateResult {
  const resolved = resolveExtensionPackage(pathOrPackage, options.cwd ?? process.cwd());
  const result: ExtensionValidateResult = {
    packageJsonPath: resolved.packageJsonPath,
    entryPath: resolved.entryPath,
    issues: resolved.issues,
    loaded: false,
    adapterIds: [],
  };

  if (options.load && resolved.issues.length === 0) {
    const definition = loadExtensionGuarded(resolved.entryPath);
    result.loaded = true;
    result.adapterIds = definition.adapters.map((adapter) => adapter.id);
  }

  return result;
}

export const builder: CommandBuilder = (yargs) =>
  yargs
    .command(
      "validate <pathOrPackage>",
      t("commands.extension.validate.describe"),
      ((y: any): any =>
        y
          .positional("pathOrPackage", {
            type: "string",
            describe: t("commands.extension.validate.path_describe"),
          })
          .option("load", {
            type: "boolean",
            default: false,
            describe: t("commands.extension.validate.load_describe"),
          })
          .option("fixtures", {
            type: "string",
            describe: t("commands.extension.validate.fixtures_describe"),
          })) as any,
      async (argv: any) => {
        const { pathOrPackage, load, fixtures } = argv as {
          pathOrPackage: string;
          load?: boolean;
          fixtures?: string;
        };
        try {
          const result = runExtensionValidate(pathOrPackage, { load: load || Boolean(fixtures) });
          if (result.issues.length > 0) {
            logger.error(pc.red(t("commands.extension.validate.invalid")));
            for (const issue of result.issues) {
              logger.error(`- ${issue.code}: ${issue.message}`);
            }
            process.exitCode = 2;
            return;
          }
          if (load || fixtures) {
            logger.success(
              pc.green(
                t("commands.extension.validate.loaded", {
                  ids: result.adapterIds.join(", "),
                }),
              ),
            );
          } else {
            logger.success(pc.green(t("commands.extension.validate.valid")));
          }

          if (fixtures) {
            const definition = loadExtensionGuarded(result.entryPath);
            const fixtureResults = await runExtensionFixtureCheck(definition.adapters[0], fixtures);
            for (const fixtureResult of fixtureResults) {
              if (fixtureResult.ok) {
                logger.success(pc.green(`  + ${fixtureResult.name}`));
              } else {
                logger.error(pc.red(`  ! ${fixtureResult.name}: ${fixtureResult.error}`));
              }
            }
            if (fixtureResults.some((r) => !r.ok)) {
              process.exitCode = 2;
            }
          }
        } catch (error: any) {
          logger.error(
            pc.red(t("commands.extension.validate.failed", { message: error.message })),
          );
          process.exitCode = 1;
        }
      },
    )
    .demandCommand(1);

export const handler = () => {
  // yargs dispatches to the `validate` subcommand above; this top-level
  // handler only runs if no subcommand matched, which demandCommand(1)
  // already turns into a usage error.
};
