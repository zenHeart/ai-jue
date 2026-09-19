import { assertExtensionDefinition, writeCapabilities } from "ai-jue-core";
import type {
  Adapter,
  ArtifactChange,
  CanonicalDocument,
  WriteContext as CoreWriteContext,
} from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export type WriteContext = CoreWriteContext;

const TARGET = "openclaw";

type BundleFormat = "claude" | "codex" | "cursor";

function resolveBundleFormat(
  toolsConfig: Record<string, unknown> | undefined,
  canonical: CanonicalDocument,
): BundleFormat {
  const configuredValue = toolsConfig?.bundleFormat;
  if (
    configuredValue !== undefined &&
    configuredValue !== null &&
    typeof configuredValue !== "string"
  ) {
    const error = new Error(
      `OpenClaw tools.bundleFormat must be a string: auto, claude, codex, or cursor; received ${typeof configuredValue}.`,
    ) as Error & { exitCode?: number };
    error.exitCode = 2;
    throw error;
  }
  const configured =
    typeof configuredValue === "string"
      ? configuredValue.trim().toLowerCase()
      : "";
  const raw = configured || "auto";
  if (raw === "claude" || raw === "codex" || raw === "cursor") return raw;
  if (raw !== "auto") {
    const error = new Error(
      `OpenClaw tools.bundleFormat must be one of: auto, claude, codex, cursor; received "${raw}".`,
    ) as Error & { exitCode?: number };
    error.exitCode = 2;
    throw error;
  }
  // auto never selects Cursor. Hooks pick the Codex-executable base.
  return canonical.hooks && Object.keys(canonical.hooks).length > 0 ? "codex" : "claude";
}

function loadBundleWriter(format: BundleFormat): Adapter {
  const packageName =
    format === "claude"
      ? "ai-jue-adapter-claude"
      : format === "codex"
        ? "ai-jue-adapter-codex"
        : "ai-jue-adapter-cursor";
  let resolved: string;
  try {
    // Prefer consumer project resolution, then this package's node_modules.
    resolved = require.resolve(packageName, {
      paths: [process.cwd(), __dirname],
    });
  } catch {
    throw new Error(
      `OpenClaw compatible-bundle (${format}) requires ${packageName}. ` +
        `Install it in the project (e.g. npm i -D ${packageName}) and retry.`,
    );
  }
  const extension = require(resolved)?.default;
  assertExtensionDefinition(extension);
  if (extension.adapters.length !== 1) {
    throw new Error(
      `${packageName} must expose exactly one Adapter for bundle delegation`,
    );
  }
  return extension.adapters[0];
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
    artifactRoot: writeContext.artifactRoot,
    scope: writeContext.scope,
    artifactKind: "plugin",
    pluginManifest: writeContext.pluginManifest,
  });
  const changes = delegatedChanges.map((change) => ({ ...change, target: TARGET }));
  if (format === "codex" && canonical.hooks && Object.keys(canonical.hooks).length > 0) {
    changes.push(...hooks().write(writeContext.artifactRoot, canonical.hooks, TARGET));
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
    writeContext.artifactRoot,
    TARGET,
  );

  if (canonical.context?.global) {
    changes.push(
      ...context().write(writeContext.artifactRoot, { global: canonical.context.global }, TARGET),
    );
  }

  return changes;
}

/**
 * Computes the `ArtifactChange[]` needed to make an OpenClaw workspace
 * or compatible bundle match `canonical`, without performing I/O itself.
 *
 * `compatible-bundle` does **not** invent a fourth directory dialect —
 * it delegates to Claude, Codex, or explicit Cursor `artifactKind: "plugin"`
 * writers so `openclaw plugins install` can treat the output as Format: bundle
 * (RFC-0002 / https://docs.openclaw.ai/plugins/bundles). `auto` still never
 * selects Cursor.
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
