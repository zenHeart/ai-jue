import fs from "fs";
import path from "path";
import { writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { isProjectLayout, type CodexArtifactKind } from "./capabilities/layout";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { writeCodexPluginManifest, type CodexPluginManifest } from "./capabilities/manifest";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
  artifactKind?: CodexArtifactKind;
  pluginManifest?: CodexPluginManifest;
}

const TARGET = "codex";

/**
 * Computes the `ArtifactChange[]` needed to make a Codex project or Plugin
 * directory match `canonical`, without performing I/O itself — Core
 * executes approved changes (per the Adapter/Core split frozen in JUE-103's
 * Extension Host).
 *
 * Plugin mode writes portable `skills/` + `.mcp.json` (RFC-0002 / OpenClaw
 * compatible-bundle). Project mode keeps MCP as an honest TOML no-op.
 */
export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const artifactKind: CodexArtifactKind =
    writeContext.artifactKind ?? (isProjectLayout(writeContext.projectRoot) ? "project" : "project");

  let changes = writeCapabilities(
    {
      commands: commands(),
      agents: agents(),
      skills: skills(artifactKind),
      hooks: hooks(),
      mcp: mcp(artifactKind),
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
