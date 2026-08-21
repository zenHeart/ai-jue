import { Arguments, CommandBuilder } from "yargs";
import pc from "picocolors";
import { checkExecution } from "ai-jue-core";
import type { CanonicalDocument, CapabilitySupport, ExecutionStatus } from "ai-jue-core";
import { logger } from "../logger";
import { t } from "../i18n";
import { loadConfig, MergedConfig, toCanonicalDocument } from "../config";
import { resolveFinalConfig } from "../resolver";
import {
  ExtensionPackageIssue,
  loadExtensionGuarded,
  resolveExtensionPackage,
} from "../extension-loader";

export const command = "inspect";
export const describe = ""; // Managed in cli.ts for dynamic translation

export interface ExtensionAdapterDiagnostic {
  id: string;
  capabilities: CapabilitySupport;
}

export interface ApplyReadinessDiagnostic {
  adapterId: string;
  status: ExecutionStatus;
  pendingCount: number;
  conflictCount: number;
  unauthorizedCount: number;
}

export interface ExtensionDiagnostics {
  packageJsonPath: string;
  entryPath: string;
  issues: ExtensionPackageIssue[];
  adapters: ExtensionAdapterDiagnostic[];
  applyReadiness?: ApplyReadinessDiagnostic;
}

export interface ApplyCheckInput {
  canonical: CanonicalDocument;
  artifactRoot: string;
}

/**
 * The `--extension --diagnostics` slice of `jue inspect`'s target contract
 * (`packages/docs/reference/cli/workflow.md`): resolves an Extension
 * package's npm metadata, loads it in a guarded import, and reports the
 * declared Adapter(s)' capability-support levels. When `applyCheck` is
 * supplied (a resolved project Canonical + its root), also reports whether
 * applying would need changes, be blocked by drift, or be a no-op, via the
 * real Core executor (JUE-108) — read-only, never writes. `--capability`/
 * `--preset`/`--target`/`--artifact` filters are not implemented yet; see
 * `implementation-status.md`.
 */
export async function runExtensionDiagnostics(
  pathOrPackage: string,
  options: { cwd?: string; applyCheck?: ApplyCheckInput } = {},
): Promise<ExtensionDiagnostics> {
  const resolved = resolveExtensionPackage(pathOrPackage, options.cwd ?? process.cwd());
  const diagnostics: ExtensionDiagnostics = {
    packageJsonPath: resolved.packageJsonPath,
    entryPath: resolved.entryPath,
    issues: resolved.issues,
    adapters: [],
  };

  if (resolved.issues.length > 0) {
    return diagnostics;
  }

  const definition = loadExtensionGuarded(resolved.entryPath);
  diagnostics.adapters = definition.adapters.map((adapter) => ({
    id: adapter.id,
    capabilities: adapter.capabilities,
  }));

  if (options.applyCheck) {
    const adapter = definition.adapters[0];
    const changes = await adapter.write(options.applyCheck.canonical, {
      artifactRoot: options.applyCheck.artifactRoot,
      scope: "project",
    });
    const result = checkExecution(options.applyCheck.artifactRoot, changes);
    diagnostics.applyReadiness = {
      adapterId: adapter.id,
      status: result.status,
      pendingCount: result.pending.length,
      conflictCount: result.conflicts.length,
      unauthorizedCount: result.unauthorized.length,
    };
  }

  return diagnostics;
}

export const builder: CommandBuilder = (yargs) =>
  yargs
    .option("extension", {
      type: "string",
      describe: t("commands.inspect.extension_describe"),
    })
    .option("diagnostics", {
      type: "boolean",
      default: false,
      describe: t("commands.inspect.diagnostics_describe"),
    });

export const handler = async (argv: Arguments) => {
  const { extension, diagnostics } = argv as unknown as { extension?: string; diagnostics?: boolean };

  if (!extension) {
    logger.warn(pc.yellow(t("commands.inspect.no_target")));
    return;
  }

  try {
    let applyCheck: ApplyCheckInput | undefined;
    try {
      const userConfig: MergedConfig = await loadConfig();
      const finalConfig = await resolveFinalConfig(userConfig);
      applyCheck = { canonical: toCanonicalDocument(finalConfig), artifactRoot: process.cwd() };
    } catch {
      // No project config in cwd — diagnostics still report Extension/Adapter facts alone.
    }

    const result = await runExtensionDiagnostics(extension, diagnostics ? { applyCheck } : {});

    if (result.issues.length > 0) {
      logger.error(pc.red(t("commands.inspect.invalid_extension")));
      for (const issue of result.issues) {
        logger.error(`- ${issue.code}: ${issue.message}`);
      }
      process.exitCode = 2;
      return;
    }

    for (const adapter of result.adapters) {
      logger.info(pc.cyan(t("commands.inspect.adapter_line", { id: adapter.id })));
      for (const [capability, level] of Object.entries(adapter.capabilities)) {
        logger.log(`  ${capability}: ${level}`);
      }
    }

    if (result.applyReadiness) {
      logger.info(
        pc.cyan(
          t("commands.inspect.apply_readiness", {
            id: result.applyReadiness.adapterId,
            status: result.applyReadiness.status,
            pending: result.applyReadiness.pendingCount,
            conflicts: result.applyReadiness.conflictCount,
            unauthorized: result.applyReadiness.unauthorizedCount,
          }),
        ),
      );
    }
  } catch (error: any) {
    logger.error(pc.red(t("commands.inspect.failed", { message: error.message })));
    process.exitCode = 1;
  }
};
