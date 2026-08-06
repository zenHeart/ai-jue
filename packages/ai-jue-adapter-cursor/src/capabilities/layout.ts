import fs from "fs";
import path from "path";

export type CursorArtifactKind = "project" | "plugin";

/** A project root has a `.cursor/` directory; plugin components live at the root. */
export function isProjectLayout(root: string): boolean {
  return fs.existsSync(path.join(root, ".cursor"));
}

/** Return a managed layout only when the root contains an unambiguous marker. */
export function detectArtifactKind(root: string): CursorArtifactKind | undefined {
  if (fs.existsSync(path.join(root, ".cursor-plugin", "plugin.json"))) {
    return "plugin";
  }
  if (isProjectLayout(root)) return "project";
  return undefined;
}

/** Where per-capability component directories live for a given layout. */
export function componentRoot(root: string, artifactKind: CursorArtifactKind): string {
  return artifactKind === "project" ? path.join(root, ".cursor") : root;
}
