import fs from "fs";
import path from "path";
import { extractManagedContent, managedMarkdownFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/**
 * `context.global` maps to Hermes's `MEMORY.md`: a real, user-authored,
 * per-HERMES_HOME memory/context file — verified against a live installation
 * (`D:\<home>\.hermes\MEMORY.md` on a real, running Hermes gateway), which
 * Hermes's own `common/RULE.md` docs describe as where "用户信息" and
 * project-specific conventions live, analogous to Claude Code's `CLAUDE.md`.
 *
 * Unlike Claude's `CLAUDE.md`, no `@import`-style directive was found on the
 * verified instance (it references `common/RULE.md`/`common/env.md` in plain
 * prose, not a resolvable import syntax), so read() only needs to extract the
 * Jue-managed block — no custom import resolution — and write() reuses the
 * generic managed-markdown-file mapping unchanged.
 *
 * The returned Canonical shape is `{global: string}` (matching
 * `ContextSchema`), NOT the bare string. The kit's `readCapabilities`
 * places the result under `canonical.context`, and the schema requires
 * an object there.
 */
export function context(): CapabilityMapping<{ global?: string }> {
  const managed = managedMarkdownFile({ filePath: (root) => path.join(root, "MEMORY.md") });
  return {
    read(root) {
      const filePath = path.join(root, "MEMORY.md");
      if (!fs.existsSync(filePath)) return undefined;
      const inner = extractManagedContent(fs.readFileSync(filePath, "utf8")).trim();
      if (!inner) return undefined;
      return { global: inner };
    },
    write(root, value, target) {
      if (!value || value.global === undefined) return [];
      return managed.write(root, value.global, target);
    },
  };
}
