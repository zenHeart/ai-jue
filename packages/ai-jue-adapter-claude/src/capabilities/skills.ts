import path from "path";
import { directoryPerItem } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type ArtifactKind } from "./layout";

/** `.claude/skills/<name>/SKILL.md` (project) or `skills/<name>/SKILL.md` (Plugin), with attachment bundles. */
export function skills(artifactKind: ArtifactKind): CapabilityMapping<Record<string, any>> {
  return directoryPerItem({
    dirPath: (root) => path.join(componentRoot(root, artifactKind), "skills"),
    mainFileName: "SKILL.md",
    bundleKeys: ["references", "scripts", "assets"],
  });
}
