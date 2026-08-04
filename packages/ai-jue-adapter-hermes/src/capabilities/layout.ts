import fs from "fs";
import path from "path";

/**
 * Hermes Artifact kinds (RFC-0002):
 * - `workspace`: MEMORY.md / skills/<cat>/<name> / config.yaml / cron — JUE-303
 * - `skill-plugin`: thin plugin.yaml + register_skill (Phase B — not implemented yet)
 */
export type HermesArtifactKind = "workspace" | "skill-plugin";

export function isWorkspaceLayout(root: string): boolean {
  return (
    fs.existsSync(path.join(root, "config.yaml")) ||
    fs.existsSync(path.join(root, "skills")) ||
    fs.existsSync(path.join(root, "cron")) ||
    fs.existsSync(path.join(root, "MEMORY.md"))
  );
}
