import path from "path";
import { computeMergedJson, hashArtifactContent, mergedJsonFile, writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import type { ArtifactKind } from "./capabilities/layout";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { writePluginManifest, type PluginManifest } from "./capabilities/manifest";
import { rules } from "./capabilities/rules";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
  /** Which native Artifact shape to target. Defaults to `"project"`. */
  artifactKind?: ArtifactKind;
  /**
   * Target-private `tools.claude` passthrough settings (ProjectConfig-only —
   * never part of `CanonicalDocument`). Merged into the same `settings.json`
   * as `hooks`, alongside whatever the file already has.
   */
  toolsConfig?: Record<string, unknown>;
  /**
   * The Plugin's own identity (name/version/...), used only when
   * `artifactKind` is `"plugin"`. Jue cannot invent this — it comes from the
   * source Preset's own package metadata. Omitting it produces a
   * manifest-less Plugin, which is a valid, verified Claude Code mode
   * (`--plugin-dir` auto-discovery), not a degraded one — it just won't
   * pass `claude plugin validate`, which requires a manifest.
   */
  pluginManifest?: PluginManifest;
}

const TARGET = "claude-code";

/** Merges `toolsConfig` into whichever ArtifactChange already targets `settingsPath`, or creates one. */
function mergeToolsConfig(
  changes: ArtifactChange[],
  root: string,
  settingsPath: string,
  toolsConfig: Record<string, unknown>,
): ArtifactChange[] {
  const relativePath = path.relative(root, settingsPath).split(path.sep).join("/");
  const existingIndex = changes.findIndex((change) => change.path === relativePath);
  if (existingIndex === -1) {
    const mapping = mergedJsonFile<Record<string, unknown>>({ filePath: () => settingsPath });
    return [...changes, ...mapping.write(root, toolsConfig, TARGET)];
  }
  const existing = changes[existingIndex];
  const merged = computeMergedJson(JSON.parse(existing.content as string), toolsConfig);
  const finalRaw = JSON.stringify(merged, null, 2);
  const updated: ArtifactChange = { ...existing, content: finalRaw, afterHash: hashArtifactContent(finalRaw) };
  return [...changes.slice(0, existingIndex), updated, ...changes.slice(existingIndex + 1)];
}

/**
 * Computes the `ArtifactChange[]` needed to make a Claude Code project or
 * Plugin directory match `canonical`, without performing any I/O itself —
 * Core executes approved changes (per the Adapter/Core split frozen in
 * JUE-103's Extension Host). Each Capability's native shape is declared in
 * `./capabilities/*` and driven through the shared capability-mapping
 * engine; `context.global` is the one hand-written case, and only applies
 * to the `project` layout (a Plugin has no `context.global` concept).
 */
export async function write(canonical: CanonicalDocument, writeContext: WriteContext): Promise<ArtifactChange[]> {
  const artifactKind = writeContext.artifactKind ?? "project";
  const root = writeContext.projectRoot;

  let changes = writeCapabilities(
    {
      rules: rules(artifactKind),
      commands: commands(artifactKind),
      agents: agents(artifactKind),
      skills: skills(artifactKind),
      hooks: hooks(artifactKind),
      mcp: mcp(),
    },
    canonical as Record<string, unknown>,
    root,
    TARGET,
  );

  if (artifactKind === "project" && canonical.context?.global) {
    changes.push(...context().write(root, canonical.context.global, TARGET));
  }

  if (artifactKind === "project" && writeContext.toolsConfig && Object.keys(writeContext.toolsConfig).length > 0) {
    const settingsPath = path.join(root, ".claude", "settings.json");
    changes = mergeToolsConfig(changes, root, settingsPath, writeContext.toolsConfig);
  }

  if (artifactKind === "plugin" && writeContext.pluginManifest) {
    changes.push(...writePluginManifest(root, writeContext.pluginManifest, TARGET));
  }

  return changes;
}
