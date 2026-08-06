import fs from "fs";
import path from "path";

/**
 * JUE-301 Codex Adapter supports two native Artifact kinds:
 * - `project`: a flat, in-tree `.codex/` and `.agents/` config directory, the
 *   form users generate locally for their own repo.
 * - `plugin`: an installable Bundle published to a Codex marketplace, with
 *   `.codex-plugin/plugin.json` manifest at the Bundle root plus `skills/`,
 *   `hooks/`, `.mcp.json` etc. — Codex's equivalent of Claude Code's Plugin
 *   aggregate Artifact.
 */
export type CodexArtifactKind = "project" | "plugin";

export function isProjectLayout(root: string): boolean {
  return (
    fs.existsSync(path.join(root, ".codex")) ||
    fs.existsSync(path.join(root, ".codex", "config.toml")) ||
    fs.existsSync(path.join(root, "AGENTS.md"))
  );
}

export function detectArtifactKind(root: string): CodexArtifactKind | undefined {
  if (fs.existsSync(path.join(root, ".codex-plugin", "plugin.json"))) {
    return "plugin";
  }
  if (isProjectLayout(root)) return "project";
  return undefined;
}
