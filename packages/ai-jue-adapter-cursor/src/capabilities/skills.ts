import path from "path";
import { directoryPerItem } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type CursorArtifactKind } from "./layout";

/** `<root>/skills/<name>/SKILL.md` (project: under `.cursor/skills`). */
export function skills(artifactKind: CursorArtifactKind): CapabilityMapping<Record<string, unknown>> {
  return directoryPerItem({
    dirPath: (root) => path.join(componentRoot(root, artifactKind), "skills"),
    mainFileName: "SKILL.md",
    bundleKeys: ["references", "scripts", "assets"],
  });
}
