import path from "path";
import { flatMarkdownDirectory } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type ArtifactKind } from "./layout";

/** `.claude/rules/*.md` (project) or `rules/*.md` (Plugin); `paths` frontmatter maps to Canonical `globs`. */
export function rules(artifactKind: ArtifactKind): CapabilityMapping<Record<string, any>> {
  return flatMarkdownDirectory({
    dirPath: (root) => path.join(componentRoot(root, artifactKind), "rules"),
    fieldRenames: { globs: "paths" },
  });
}
