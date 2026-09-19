import { Arguments, CommandBuilder } from "yargs";
import os from "os";
import pc from "picocolors";
import { checkExecution, diagnoseLinkPattern } from "ai-jue-core";
import type {
  ApplyScope,
  CanonicalDocument,
  CapabilitySupport,
  ExecutionStatus,
  LinkPatternFinding,
} from "ai-jue-core";
import { logger } from "../logger";
import { t } from "../i18n";
import { loadConfig, MergedConfig, toCanonicalDocument } from "../config";
import { resolveFinalConfig } from "../resolver";
import {
  adapterConfigKey,
  resolveArtifactKind,
  resolveApplyPluginManifest,
  resolveTargetSelection,
  shortAdapterName,
  UnsupportedArtifactKindError,
} from "../artifact-kind";
import {
  assertAdapterSupportsScope,
  resolveApplyScope,
  resolveArtifactRoot,
} from "../apply-scope";
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
  scope: ApplyScope;
  artifactKind: string;
  status: ExecutionStatus;
  pendingCount: number;
  conflictCount: number;
  unauthorizedCount: number;
}

export interface ExtensionDiagnostics {
  name: string;
  version: string;
  packageDir: string;
  packageJsonPath: string;
  entryPath: string;
  peerRange: string | null;
  hostCoreVersion: string;
  issues: ExtensionPackageIssue[];
  adapters: ExtensionAdapterDiagnostic[];
  applyReadiness?: ApplyReadinessDiagnostic;
}

export interface ApplyCheckInput {
  canonical: CanonicalDocument;
  config?: MergedConfig;
  projectDirectory?: string;
  userHome?: string;
  artifactRoot?: string;
  scope?: ApplyScope;
  artifactKind?: string;
}

/** RFC-0004: read-only Skill link findings for a project root. */
export function runProjectLinkDiagnostics(projectRoot: string): LinkPatternFinding[] {
  return diagnoseLinkPattern(projectRoot);
}

function printLinkFindings(findings: LinkPatternFinding[]): void {
  if (findings.length === 0) {
    logger.info(t("commands.inspect.link_pattern_none"));
    return;
  }
  logger.info(t("commands.inspect.link_pattern_header", { count: String(findings.length) }));
  for (const finding of findings) {
    const location = finding.target
      ? `${finding.path} -> ${finding.target}`
      : finding.expectedTarget
        ? `${finding.path} -> ${finding.expectedTarget}`
        : finding.path;
    const line = t("commands.inspect.link_pattern_finding", {
      severity: finding.severity,
      code: finding.code,
      path: location,
    });
    if (finding.severity === "error") {
      logger.error(line);
    } else {
      logger.warn(pc.yellow(line));
    }
    logger.log(t("commands.inspect.link_pattern_remediation", { remediation: finding.remediation }));
  }
}

/**
 * The `--extension --diagnostics` slice of `jue inspect`'s target contract
 * (`packages/docs/reference/cli/workflow.md`): resolves an Extension
 * package's npm metadata, loads it in a guarded import, and reports the
 * declared Adapter(s)' capability-support levels. When `applyCheck` is
 * supplied (a resolved project Canonical + its root), also reports whether
 * applying would need changes, be blocked by drift, or be a no-op, via the
 * real Core executor (JUE-108) — read-only, never writes. `--diagnostics`
 * without `--extension` reports project-layer Skill link patterns
 * (RFC-0004). `--capability`/`--preset`/`--target`/`--artifact` filters
 * are not implemented yet; see `implementation-status.md`.
 */
export async function runExtensionDiagnostics(
  pathOrPackage: string,
  options: { cwd?: string; applyCheck?: ApplyCheckInput } = {},
): Promise<ExtensionDiagnostics> {
  const resolved = resolveExtensionPackage(pathOrPackage, options.cwd ?? process.cwd());
  const diagnostics: ExtensionDiagnostics = {
    name: resolved.name,
    version: resolved.version,
    packageDir: resolved.packageDir,
    packageJsonPath: resolved.packageJsonPath,
    entryPath: resolved.entryPath,
    peerRange: resolved.peerRange,
    hostCoreVersion: resolved.hostCoreVersion,
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
    const config = options.applyCheck.config ?? {};
    const targetSelection = resolveTargetSelection(config, adapter.id);
    const scope =
      options.applyCheck.scope ??
      resolveApplyScope(undefined, targetSelection?.scope);
    assertAdapterSupportsScope(
      shortAdapterName(adapter.id),
      adapter.supportedScopes,
      scope,
    );
    const projectDirectory =
      options.applyCheck.projectDirectory ??
      options.applyCheck.artifactRoot ??
      options.cwd ??
      process.cwd();
    const artifactRoot =
      options.applyCheck.artifactRoot ??
      resolveArtifactRoot(
        scope,
        projectDirectory,
        options.applyCheck.userHome ?? os.homedir(),
      );
    const artifactKind =
      options.applyCheck.artifactKind ??
      resolveArtifactKind({ adapterName: adapter.id, config });
    if (scope === "user" && !["project", "workspace"].includes(artifactKind)) {
      throw new UnsupportedArtifactKindError(
        shortAdapterName(adapter.id),
        artifactKind,
        ["project", "workspace"],
      );
    }
    const configKey = adapterConfigKey(adapter.id);
    const toolsConfig = (config as Record<string, any>)?.tools?.[configKey];
    const pluginManifest = resolveApplyPluginManifest(
      config as Record<string, unknown>,
      shortAdapterName(adapter.id),
      artifactKind,
      toolsConfig,
    );
    const changes = await adapter.write(options.applyCheck.canonical, {
      artifactRoot,
      scope,
      artifactKind,
      toolsConfig:
        toolsConfig && Object.keys(toolsConfig).length > 0
          ? toolsConfig
          : undefined,
      pluginManifest,
    });
    const result = checkExecution(artifactRoot, changes, {
      expectedScope: scope,
    });
    diagnostics.applyReadiness = {
      adapterId: adapter.id,
      scope,
      artifactKind,
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

  try {
    if (diagnostics) {
      printLinkFindings(runProjectLinkDiagnostics(process.cwd()));
    }

    if (!extension) {
      if (!diagnostics) {
        logger.warn(pc.yellow(t("commands.inspect.no_target")));
      }
      return;
    }

    let applyCheck: ApplyCheckInput | undefined;
    try {
      const userConfig: MergedConfig = await loadConfig();
      const finalConfig = await resolveFinalConfig(userConfig, {
        persistLock: false,
        readOnly: true,
      });
      applyCheck = {
        canonical: toCanonicalDocument(finalConfig),
        config: finalConfig,
        projectDirectory: process.cwd(),
        userHome: os.homedir(),
      };
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
