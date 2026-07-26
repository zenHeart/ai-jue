import fs from "fs";
import path from "path";

/**
 * JUE-303 Hermes Adapter supports exactly one native Artifact kind: a
 * per-workspace directory tree (the global `~/.hermes/` config lives at
 * the user home and is NOT a project-scoped surface this Adapter
 * targets). Three-level skills shape (`<workspace>/skills/<cat>/<name>/SKILL.md`)
 * confirmed by reading the real cwr:/d/devuser/.hermes/skills tree.
 */
export type HermesArtifactKind = "workspace";

export function isWorkspaceLayout(root: string): boolean {
  return (
    fs.existsSync(path.join(root, "config.yaml")) ||
    fs.existsSync(path.join(root, "skills")) ||
    fs.existsSync(path.join(root, "cron"))
  );
}
