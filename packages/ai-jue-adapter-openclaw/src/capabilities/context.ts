import fs from "fs";
import path from "path";
import { extractManagedContent, managedMarkdownFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/**
 * OpenClaw's workspace-level context is `AGENTS.md` (verified by reading
 * the real `~/.openclaw/workspace-jue-probe/AGENTS.md` and by OpenClaw's
 * own documentation that identifies the workspace's AGENTS.md as the
 * per-workspace shared instruction surface). Reuse the shared
 * `managedMarkdownFile` factory for the on-disk read/write marker; wrap
 * its read with `extractManagedContent` to strip the markers on read
 * (returning just the inner body), and on write we set the entire
 * managed-block body to `global`. Wrap in `{ global: string }` to match
 * `ContextSchema`.
 */
export function context(): CapabilityMapping<{ global?: string }> {
  return {
    read(root) {
      const filePath = path.join(root, "AGENTS.md");
      if (!fs.existsSync(filePath)) return undefined;
      const raw = fs.readFileSync(filePath, "utf8");
      const inner = extractManagedContent(raw).trim();
      if (!inner) return undefined;
      return { global: inner };
    },
    write(root, value, target) {
      if (!value || value.global === undefined) return [];
      return managedMarkdownFile({
        filePath: () => path.join(root, "AGENTS.md"),
      }).write(root, value.global, target);
    },
  };
}
