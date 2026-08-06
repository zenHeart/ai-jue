import path from "path";
import { extractManagedContent, managedMarkdownFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/** Root `AGENTS.md` — Cursor native global context (managed block). */
export function context(): CapabilityMapping<string> {
  const managed = managedMarkdownFile({
    filePath: (root) => path.join(root, "AGENTS.md"),
  });
  return {
    read(root) {
      const raw = managed.read(root);
      if (typeof raw !== "string") return undefined;
      const content = extractManagedContent(raw);
      return content.trim() ? content : undefined;
    },
    write: managed.write,
  };
}
