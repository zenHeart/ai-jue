import path from "path";
import { directoryPerItem } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import type { CodexArtifactKind } from "./layout";

/**
 * Codex Skills:
 * - project → `.agents/skills/<name>/SKILL.md` (JUE-301)
 * - plugin  → root `skills/<name>/SKILL.md` (marketplace / OpenClaw bundle shape;
 *   matches fixtures/plugin and RFC-0002)
 */
export function skills(
  artifactKind: CodexArtifactKind = "project",
): CapabilityMapping<Record<string, unknown>> {
  return directoryPerItem({
    dirPath: (root) =>
      artifactKind === "plugin"
        ? path.join(root, "skills")
        : path.join(root, ".agents", "skills"),
    mainFileName: "SKILL.md",
    bundleKeys: ["references", "scripts", "assets"],
  });
}
