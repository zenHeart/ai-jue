import path from "path";
import { flatMarkdownDirectory } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type ArtifactKind } from "./layout";

/** `.claude/agents/*.md` (project) or `agents/*.md` (Plugin). */
export function agents(artifactKind: ArtifactKind): CapabilityMapping<Record<string, any>> {
  return flatMarkdownDirectory({
    dirPath: (root) => path.join(componentRoot(root, artifactKind), "agents"),
  });
}
