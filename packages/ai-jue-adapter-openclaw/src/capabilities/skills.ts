import path from "path";
import { directoryPerItem } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

// OpenClaw workspace skills live at workspace/skills/NAME/SKILL.md (verified
// by reading the real OpenClaw workspace probe at
// ~/.openclaw/workspace-jue-probe/skills/jue-probe-skill/SKILL.md; note that
// OpenClaw's workspace shape is one-deep, not Hermes's
// skills/CATEGORY/NAME/SKILL.md). The shared directoryPerItem factory
// matches the shape; OpenClaw's SKILL.md frontmatter is `name` +
// `description` (plus optional version / metadata etc.), but
// directoryPerItem already handles arbitrary frontmatter via the
// engine's getRecordEntries.
//
// OpenClaw's GLOBAL skills at ~/.openclaw/skills/lark-*/SKILL.md are
// installed by OpenClaw itself (bundled into the distribution), not
// user-authored — they are NOT a project-scoped surface this Adapter
// targets. The canonical workspace skills/ is the only project-scoped
// skill surface.
export function skills(): CapabilityMapping<Record<string, unknown>> {
  return directoryPerItem({
    dirPath: (root) => path.join(root, "skills"),
    mainFileName: "SKILL.md",
    bundleKeys: ["references", "scripts", "assets", "files"],
  });
}
