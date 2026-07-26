import path from "path";
import { directoryPerItem } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/**
 * Codex Skills live at `.agents/skills/<name>/SKILL.md` (verified by JUE-104/105
 * and JUE-301 Phase 1; real installed-plugin SKILL.md files on this machine
 * confirmed `name`/`description` frontmatter only — Claude-style
 * `user-invocable`/`trigger-hints` fields are NOT real Codex fields,
 * matching JUE-301's documented carry-over warning). `directoryPerItem`
 * matches the exact shape; bundleKeys enables the same attachments Claude
 * supports.
 */
export function skills(): CapabilityMapping<Record<string, unknown>> {
  return directoryPerItem({
    dirPath: (root) => path.join(root, ".agents", "skills"),
    mainFileName: "SKILL.md",
    bundleKeys: ["references", "scripts", "assets"],
  });
}
