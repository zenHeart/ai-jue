import fs from "fs";
import path from "path";

export type ArtifactKind = "project" | "plugin";

/**
 * A project root has a `.claude/` directory; a Plugin root does not (its
 * components live directly at the root instead of under `.claude/`).
 * `--plugin-dir` loads a Plugin whether or not it has its own
 * `.claude-plugin/plugin.json` (manifest-optional auto-discovery, confirmed
 * in JUE-105), so presence of `.claude/` is the one structural signal that
 * reliably tells the two layouts apart.
 */
export function isProjectLayout(root: string): boolean {
  return fs.existsSync(path.join(root, ".claude"));
}

/** Where per-capability component directories live for a given layout. */
export function componentRoot(root: string, artifactKind: ArtifactKind): string {
  return artifactKind === "project" ? path.join(root, ".claude") : root;
}
