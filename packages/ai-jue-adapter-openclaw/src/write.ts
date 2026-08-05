import { writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import type { OpenClawArtifactKind } from "./capabilities/layout";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
  /** Defaults to `"workspace"`. `"compatible-bundle"` delegates to Claude/Codex plugin writers. */
  artifactKind?: OpenClawArtifactKind | string;
  toolsConfig?: Record<string, unknown>;
  pluginManifest?: { name: string; version: string; description?: string };
}

const TARGET = "openclaw";

function resolveBundleFormat(
  toolsConfig: Record<string, unknown> | undefined,
  canonical: CanonicalDocument,
): "claude" | "codex" {
  const configuredValue = toolsConfig?.bundleFormat;
  if (
    configuredValue !== undefined &&
    configuredValue !== null &&
    typeof configuredValue !== "string"
  ) {
    const error = new Error(
      `OpenClaw tools.bundleFormat must be a string: auto, claude, or codex; received ${typeof configuredValue}.`,
    ) as Error & { exitCode?: number };
    error.exitCode = 2;
    throw error;
  }
  const configured =
    typeof configuredValue === "string"
      ? configuredValue.trim().toLowerCase()
      : "";
  const raw = configured || "auto";
  if (raw === "claude" || raw === "codex") return raw;
  if (raw !== "auto") {
    const error = new Error(
      `OpenClaw tools.bundleFormat must be one of: auto, claude, codex; received "${raw}".`,
    ) as Error & { exitCode?: number };
    error.exitCode = 2;
    throw error;
  }
  // OpenClaw only executes OpenClaw-style hook packs (Codex-compatible).
  return canonical.hooks && Object.keys(canonical.hooks).length > 0 ? "codex" : "claude";
}

function loadBundleWriter(format: "claude" | "codex"): {
  write: (
    canonical: CanonicalDocument,
    context: {
      projectRoot: string;
      artifactKind: "plugin";
      pluginManifest?: { name: string; version: string; description?: string };
    },
  ) => Promise<ArtifactChange[]>;
} {
  const packageName =
    format === "claude" ? "ai-jue-adapter-claude" : "ai-jue-adapter-codex";
  try {
    // Prefer consumer project resolution, then this package's node_modules.
    const resolved = require.resolve(packageName, {
      paths: [process.cwd(), __dirname],
    });
    return require(resolved);
  } catch {
    throw new Error(
      `OpenClaw compatible-bundle (${format}) requires ${packageName}. ` +
        `Install it in the project (e.g. npm i -D ${packageName}) and retry.`,
    );
  }
}

async function writeCompatibleBundle(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const format = resolveBundleFormat(writeContext.toolsConfig, canonical);
  const writer = loadBundleWriter(format);
  // Codex's project hook file is not an OpenClaw bundle hook surface. Keep
  // the delegated writer for shared skills/MCP/manifest logic, then use the
  // OpenClaw Adapter's own verified HOOK.md + handler.js mapping.
  const delegatedCanonical =
    format === "codex" ? { ...canonical, hooks: undefined } : canonical;
  const delegatedChanges = await writer.write(delegatedCanonical, {
    projectRoot: writeContext.projectRoot,
    artifactKind: "plugin",
    pluginManifest: writeContext.pluginManifest,
  });
  const changes = delegatedChanges.map((change) => ({ ...change, target: TARGET }));
  if (format === "codex" && canonical.hooks && Object.keys(canonical.hooks).length > 0) {
    changes.push(...hooks().write(writeContext.projectRoot, canonical.hooks, TARGET));
  }
  return changes;
}

async function writeWorkspace(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  let changes = writeCapabilities(
    {
      commands: commands(),
      agents: agents(),
      skills: skills(),
      hooks: hooks(),
      mcp: mcp(),
    },
    canonical as unknown as Record<string, unknown>,
    writeContext.projectRoot,
    TARGET,
  );

  if (canonical.context?.global) {
    changes.push(
      ...context().write(writeContext.projectRoot, { global: canonical.context.global }, TARGET),
    );
  }

  return changes;
}

/**
 * Computes the `ArtifactChange[]` needed to make an OpenClaw workspace
 * or compatible bundle match `canonical`, without performing I/O itself.
 *
 * `compatible-bundle` does **not** invent a third directory dialect —
 * it delegates to Claude or Codex `artifactKind: "plugin"` writers so
 * `openclaw plugins install` can treat the output as Format: bundle
 * (RFC-0002 / https://docs.openclaw.ai/plugins/bundles).
 */
export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const kind = (writeContext.artifactKind ?? "workspace") as string;
  if (kind === "compatible-bundle" || kind === "plugin" || kind === "bundle") {
    return writeCompatibleBundle(canonical, writeContext);
  }
  if (kind === "workspace" || kind === "project") {
    return writeWorkspace(canonical, writeContext);
  }
  throw new Error(
    `OpenClaw adapter does not support artifact kind "${kind}". Supported: workspace, compatible-bundle.`,
  );
}
