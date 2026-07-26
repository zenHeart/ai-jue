import fs from "fs";
import path from "path";
import { extractManagedContent, managedMarkdownFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/**
 * Codex's real context surface is AGENTS.md (verified by JUE-104/105 and
 * JUE-301 Phase 1). The shared `managedMarkdownFile` factory handles the
 * `<!-- AI-JUE:START/END -->` block marker; we wrap its read with
 * `extractManagedContent` to strip those markers on read (returning just
 * the inner body — what we put there on write), and on write we set the
 * entire managed-block body to `global`. Wrap the result in
 * `{ global: string }` to match Canonical's `ContextSchema`.
 *
 * Project scope only — Plugins have no AGENTS.md equivalent.
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
