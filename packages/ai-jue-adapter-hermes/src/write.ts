import { writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { context } from "./capabilities/context";
import { cron } from "./capabilities/cron";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
  /** Defaults to `"workspace"`. `skill-plugin` is RFC-0002 Phase B (not implemented). */
  artifactKind?: string;
  toolsConfig?: Record<string, unknown>;
  pluginManifest?: { name: string; version: string; description?: string };
}

const TARGET = "hermes";

const SKILL_PLUGIN_HINT =
  'Hermes "plugin" / skill-plugin is not implemented yet (RFC-0002 Phase B). ' +
  "Canonical capability packs should use workspace apply (default). " +
  "Hermes plugins are Python runtimes (plugin.yaml + register()), not Claude-style plugin.json packs.";

/**
 * Hermes Adapter's write: thin composition; routes through
 * `core-executor.ts` `applyChangesOrThrow` (no bespoke apply/rollback
 * mechanism — Core executes `ArtifactChange` per the JUE-103 contract).
 * Same honest-stance map as read.
 */
export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const kind = writeContext.artifactKind ?? "workspace";
  if (kind === "skill-plugin" || kind === "plugin" || kind === "compatible-bundle" || kind === "bundle") {
    throw new Error(SKILL_PLUGIN_HINT);
  }
  if (kind !== "workspace" && kind !== "project") {
    throw new Error(
      `Hermes adapter does not support artifact kind "${kind}". Supported: workspace.`,
    );
  }

  const result = writeCapabilities(
    {
      hooks: { read: () => undefined, write: () => [] },
      commands: { read: () => undefined, write: () => [] },
      agents: { read: () => undefined, write: () => [] },
      mcp: mcp(),
      skills: skills(),
      cron: cron(),
    },
    canonical as unknown as Record<string, unknown>,
    writeContext.projectRoot,
    TARGET,
  );

  if (canonical.context?.global) {
    result.push(
      ...context().write(
        writeContext.projectRoot,
        { global: (canonical.context as { global?: string }).global ?? "" },
        TARGET,
      ),
    );
  }

  return result;
}
