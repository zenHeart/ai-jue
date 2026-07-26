import fs from "fs";
import path from "path";

/**
 * JUE-302 OpenClaw Adapter supports exactly one native Artifact kind:
 * a per-workspace directory tree (no separate "plugin" or "bundle"
 * aggregate — OpenClaw's skills/hooks are all workspace-scoped; MCP is
 * global-only and lives in the user-level `openclaw.json`, not a
 * project-scoped file). The "context" capability maps to the workspace's
 * `AGENTS.md`.
 */
export type OpenClawArtifactKind = "workspace";

export function isWorkspaceLayout(root: string): boolean {
  return (
    fs.existsSync(path.join(root, "AGENTS.md")) ||
    fs.existsSync(path.join(root, "skills")) ||
    fs.existsSync(path.join(root, "hooks"))
  );
}
