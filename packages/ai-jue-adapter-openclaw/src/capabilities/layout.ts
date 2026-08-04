import fs from "fs";
import path from "path";

/**
 * OpenClaw Artifact kinds (RFC-0002):
 * - `workspace`: project tree (AGENTS.md / skills / hooks) — JUE-302
 * - `compatible-bundle`: Claude or Codex plugin directory installable via
 *   `openclaw plugins install` (Format: bundle). No third dialect.
 */
export type OpenClawArtifactKind = "workspace" | "compatible-bundle";

export function isWorkspaceLayout(root: string): boolean {
  return (
    fs.existsSync(path.join(root, "AGENTS.md")) ||
    fs.existsSync(path.join(root, "skills")) ||
    fs.existsSync(path.join(root, "hooks"))
  );
}

export function isCompatibleBundleLayout(root: string): boolean {
  return (
    fs.existsSync(path.join(root, ".claude-plugin", "plugin.json")) ||
    fs.existsSync(path.join(root, ".codex-plugin", "plugin.json")) ||
    fs.existsSync(path.join(root, ".cursor-plugin", "plugin.json"))
  );
}

export function detectArtifactKind(root: string): OpenClawArtifactKind {
  // Native/bundle markers win over workspace when both exist (OpenClaw precedence).
  if (isCompatibleBundleLayout(root)) return "compatible-bundle";
  return "workspace";
}
