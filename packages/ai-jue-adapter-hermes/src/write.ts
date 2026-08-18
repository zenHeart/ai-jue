import { writeCapabilities } from "ai-jue-core";
import type {
  ArtifactChange,
  CanonicalDocument,
  WriteContext as CoreWriteContext,
} from "ai-jue-core";
import { context } from "./capabilities/context";
import { cron } from "./capabilities/cron";
import { mcp } from "./capabilities/mcp";
import { writeSkillPlugin } from "./capabilities/skill-plugin";
import { skills } from "./capabilities/skills";

export type WriteContext = CoreWriteContext;

const TARGET = "hermes";

/**
 * Hermes Adapter write (RFC-0002):
 * - workspace: MEMORY.md / skills/<cat>/<name> / config.yaml mcp / cron
 * - skill-plugin: plugin.yaml + __init__.py + flat skills/ (skills only)
 */
export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const kind = writeContext.artifactKind ?? "workspace";

  if (kind === "skill-plugin" || kind === "plugin") {
    return writeSkillPlugin(canonical, writeContext.projectRoot, writeContext.pluginManifest);
  }
  if (kind === "compatible-bundle") {
    throw new Error(
      'Hermes does not use OpenClaw-style "compatible-bundle". ' +
        "Use --artifact skill-plugin (or plugin) for a thin skill pack, " +
        "or omit --artifact for workspace apply (skills + mcp).",
    );
  }
  if (kind !== "workspace" && kind !== "project") {
    throw new Error(
      `Hermes adapter does not support artifact kind "${kind}". Supported: workspace, skill-plugin.`,
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
