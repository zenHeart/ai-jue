import fs from "fs";
import path from "path";

/**
 * Hermes Artifact kinds (RFC-0002):
 * - `workspace`: MEMORY.md / skills/<cat>/<name> / config.yaml / cron — JUE-303
 * - `skill-plugin`: thin plugin.yaml + register_skill initializer + flat skills
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

/** Return a managed layout only when its marker is present. */
export function detectArtifactKind(root: string): HermesArtifactKind | undefined {
  if (
    fs.existsSync(path.join(root, "plugin.yaml")) &&
    fs.existsSync(path.join(root, "__init__.py"))
  ) {
    return "skill-plugin";
  }
  if (isWorkspaceLayout(root)) return "workspace";
  return undefined;
}
