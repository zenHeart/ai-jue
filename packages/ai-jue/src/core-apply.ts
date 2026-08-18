import pc from "picocolors";
import os from "os";
import {
  applyExecution,
  checkExecution,
  toCanonicalDocument,
  type ArtifactChange,
  type DriftConflict,
  type ExecutionStatus,
  type ApplyScope,
} from "ai-jue-core";
import {
  resolveArtifactKind,
  resolveBundlePluginManifest,
  resolveTargetSelection,
  shortAdapterName,
  UnsupportedArtifactKindError,
} from "./artifact-kind";
import { MergedConfig } from "./config";
import { logger } from "./logger";
import { t } from "./i18n";
import {
  assertAdapterSupportsScope,
  resolveApplyScope,
  resolveArtifactRoot,
} from "./apply-scope";

export interface CoreCapableAdapterModule {
  supportedScopes?: readonly ApplyScope[];
  default?: {
    adapters?: Array<{ id: string; supportedScopes?: readonly ApplyScope[] }>;
  };
  write(
    canonical: unknown,
    context: {
      projectRoot: string;
      artifactRoot?: string;
      scope?: ApplyScope;
      artifactKind?: string;
      toolsConfig?: Record<string, unknown>;
      pluginManifest?: {
        name: string;
        version: string;
        description?: string;
        author?: { name: string; email?: string; url?: string };
      };
    },
  ): Promise<ArtifactChange[]>;
  /** Adapter-owned layout detection used by `artifact: "auto"`. */
  detectArtifactKind?(projectRoot: string): string | undefined;
}

/**
 * An Adapter qualifies for the Core-driven `apply`/`--dry-run`/`--check`
 * path once it exports `write()` (the Canonical → Artifact conversion).
 * Claude, Codex, OpenClaw, Hermes, and Cursor all export it.
 */
export function isCoreCapableAdapter(adapterModule: unknown): adapterModule is CoreCapableAdapterModule {
  return typeof (adapterModule as CoreCapableAdapterModule | undefined)?.write === "function";
}

export interface RunCoreAdapterOptions {
  dryRun?: boolean;
  check?: boolean;
  /** CLI --artifact / --artifact-kind override for the current run. */
  artifactKind?: string;
  /** CLI --scope override for the current run. */
  scope?: ApplyScope;
  /** Isolated user root injection for tests; production defaults to os.homedir(). */
  userHome?: string;
}

function supportedScopesFor(
  adapterName: string,
  adapterModule: CoreCapableAdapterModule,
): readonly ApplyScope[] | undefined {
  if (adapterModule.supportedScopes) return adapterModule.supportedScopes;
  const adapters = adapterModule.default?.adapters;
  if (!adapters || adapters.length === 0) return undefined;
  const short = shortAdapterName(adapterName);
  const matched = adapters.find((adapter) =>
    adapter.id === short ||
    (short === "claude" && adapter.id === "claude-code") ||
    (short === "claude-code" && adapter.id === "claude-code"),
  );
  return (matched ?? (adapters.length === 1 ? adapters[0] : undefined))?.supportedScopes;
}

const EXIT_CODE_BY_STATUS: Record<ExecutionStatus, number> = {
  "no-change": 0,
  applied: 0,
  pending: 3,
  "blocked-conflict": 3,
  "blocked-unauthorized": 4,
  "rolled-back": 1,
};

function describeChange(change: ArtifactChange): string {
  return `${change.kind} ${change.path}`;
}

function describeConflict(conflict: DriftConflict): string {
  return `${conflict.path} (${conflict.reason})`;
}

function reportPlan(
  adapterName: string,
  plan: { pending: ArtifactChange[]; conflicts: DriftConflict[]; unauthorized: ArtifactChange[] },
): void {
  if (plan.pending.length > 0) {
    logger.info(
      pc.cyan(t("commands.apply.core.pending", { name: adapterName, count: plan.pending.length })),
    );
    for (const change of plan.pending) {
      logger.log(`  + ${describeChange(change)}`);
    }
  }
  if (plan.conflicts.length > 0) {
    logger.error(pc.red(t("commands.apply.core.conflict", { name: adapterName })));
    for (const conflict of plan.conflicts) {
      logger.error(`  ! ${describeConflict(conflict)}`);
    }
  }
  if (plan.unauthorized.length > 0) {
    logger.warn(pc.yellow(t("commands.apply.core.unauthorized", { name: adapterName })));
    for (const change of plan.unauthorized) {
      logger.warn(`  ? ${describeChange(change)}`);
    }
  }
  if (plan.pending.length === 0 && plan.conflicts.length === 0 && plan.unauthorized.length === 0) {
    logger.success(pc.green(t("commands.apply.core.no_change", { name: adapterName })));
  }
}

/**
 * Runs `jue apply`'s Core-driven path for a `write()`-capable Adapter:
 * computes the Artifact from the resolved config, then either previews it
 * (`--dry-run`: always zero-write, always exits 0), gates it (`--check`:
 * zero-write, exit code reflects whether a change/conflict/authorization is
 * outstanding), or applies it atomically through the real Core executor.
 * Sets `process.exitCode` per the CLI Reference's exit-code table for every
 * branch; a blocked or pending outcome is reported, not thrown.
 */
export async function runCoreAdapter(
  adapterName: string,
  adapterModule: CoreCapableAdapterModule,
  config: MergedConfig,
  outputDir: string,
  options: RunCoreAdapterOptions,
): Promise<number> {
  const short = shortAdapterName(adapterName);
  const targetSelection = resolveTargetSelection(config, adapterName);
  const scope = resolveApplyScope(options.scope, targetSelection?.scope);
  assertAdapterSupportsScope(short, supportedScopesFor(adapterName, adapterModule), scope);
  const artifactRoot = resolveArtifactRoot(scope, outputDir, options.userHome ?? os.homedir());
  const artifactKind = resolveArtifactKind({
    adapterName,
    cliArtifact: options.artifactKind,
    config,
    existingArtifactKind: adapterModule.detectArtifactKind?.(artifactRoot),
  });
  if (scope === "user" && !["project", "workspace"].includes(artifactKind)) {
    throw new UnsupportedArtifactKindError(
      short,
      artifactKind,
      ["project", "workspace"],
      `Adapter "${short}" cannot apply artifact kind "${artifactKind}" in user scope. ` +
        "User scope supports only native project/workspace artifacts.",
    );
  }

  logger.info(
    pc.dim(
      t("commands.apply.artifact_kind_resolved", {
        name: adapterName,
        kind: artifactKind,
      }),
    ),
  );
  logger.info(pc.dim(`${adapterName}: scope=${scope}, root=${scope === "user" ? "~" : "."}`));

  const canonical = toCanonicalDocument(config as unknown as Record<string, unknown>);
  const toolsConfig = (config as Record<string, any>)?.tools?.[short];
  const pluginManifest =
    artifactKind === "plugin" ||
    artifactKind === "compatible-bundle" ||
    artifactKind === "skill-plugin"
      ? // Delegate writers first: OpenClaw bundles are Claude/Codex plugin
        // layouts, so the identity must match what those writers emit —
        // otherwise multiple Adapters re-write one plugin.json differently
        // on every run and the Artifact is never idempotent.
        resolveBundlePluginManifest(config as Record<string, unknown>, short)
      : undefined;

  const changes = await adapterModule.write(canonical, {
    projectRoot: artifactRoot,
    artifactRoot,
    scope,
    artifactKind,
    toolsConfig: toolsConfig && Object.keys(toolsConfig).length > 0 ? toolsConfig : undefined,
    pluginManifest,
  });

  if (options.dryRun) {
    const preview = checkExecution(artifactRoot, changes, { expectedScope: scope });
    reportPlan(adapterName, preview);
    process.exitCode = 0; // a preview never fails on its own findings
    return 0;
  }

  if (options.check) {
    const result = checkExecution(artifactRoot, changes, { expectedScope: scope });
    reportPlan(adapterName, result);
    const exitCode = EXIT_CODE_BY_STATUS[result.status];
    process.exitCode = exitCode;
    return exitCode;
  }

  const result = applyExecution(artifactRoot, changes, { expectedScope: scope });
  reportPlan(adapterName, result);
  if (result.status === "rolled-back") {
    logger.error(
      pc.red(t("commands.apply.core.rolled_back", { name: adapterName, message: result.error ?? "" })),
    );
  } else if (result.status === "applied" || result.status === "no-change") {
    logger.success(pc.green(t("commands.apply.adapter_success", { name: adapterName })));
  }
  const exitCode = EXIT_CODE_BY_STATUS[result.status];
  process.exitCode = exitCode;
  return exitCode;
}
