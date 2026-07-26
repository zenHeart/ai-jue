import fs from "fs";
import path from "path";
import { writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { isProjectLayout } from "./capabilities/layout";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { writeCodexPluginManifest, type CodexPluginManifest } from "./capabilities/manifest";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
  artifactKind?: "project" | "plugin";
  pluginManifest?: CodexPluginManifest;
}

const TARGET = "codex";

/**
 * Computes the `ArtifactChange[]` needed to make a Codex project or Plugin
 * directory match `canonical`, without performing I/O itself — Core
 * executes approved changes (per the Adapter/Core split frozen in JUE-103's
 * Extension Host). Each Capability's native shape is declared in
 * `./capabilities/*` and driven through the shared capability-mapping
 * engine; the hand-written `agents` mapping exists because Codex agents
 * are TOML, not the Markdown+frontmatter shape any factory produces.
 *
 * `commands` is a no-op round-trip (Codex's custom-commands mechanism was
 * deprecated; see `capabilities/commands.ts` for the JUE-104/105 evidence).
 * `mcp` is similarly a no-op (Codex MCP lives in the same TOML file as
 * project settings; a real TOML parser is out of scope per the JUE-301
 * honest-unsupported stance).
 *
 * For Plugin Artifacts, if `pluginManifest` is not explicitly provided we
 * try to copy the existing on-disk manifest (e.g. a fixture's
 * `.codex-plugin/plugin.json`) — this lets the contract test round-trip
 * a Plugin fixture's manifest without forcing every caller to re-supply it.
 * If neither is present, the manifest is left untouched (a manifest-less
 * Plugin is Codex's documented `--plugin-dir` auto-discovery mode).
 */
export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const artifactKind = writeContext.artifactKind ?? (isProjectLayout(writeContext.projectRoot) ? "project" : "project");

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

  if (artifactKind === "project" && canonical.context?.global) {
    changes.push(...context().write(writeContext.projectRoot, { global: canonical.context.global }, TARGET));
  }

  if (artifactKind === "plugin") {
    let manifest = writeContext.pluginManifest;
    if (!manifest) {
      // Try to read an existing on-disk manifest (a fixture's own).
      const existingManifestPath = path.join(writeContext.projectRoot, ".codex-plugin", "plugin.json");
      if (fs.existsSync(existingManifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(existingManifestPath, "utf8")) as CodexPluginManifest;
        } catch {
          // Malformed manifest — fall through; write no new manifest.
        }
      }
    }
    if (manifest) {
      changes.push(...writeCodexPluginManifest(writeContext.projectRoot, manifest, TARGET));
    }
  }

  return changes;
}
