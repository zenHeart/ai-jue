import path from "path";
import { flatMarkdownDirectory } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type ArtifactKind } from "./layout";

/** `.claude/commands/*.md` (project) or `commands/*.md` (Plugin). */
export function commands(artifactKind: ArtifactKind): CapabilityMapping<Record<string, any>> {
  return flatMarkdownDirectory({
    dirPath: (root) => path.join(componentRoot(root, artifactKind), "commands"),
  });
}
