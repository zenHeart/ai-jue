import fs from "fs";
import path from "path";
import { extractManagedContent, managedMarkdownFile } from "ai-jue-core";
import type { ApplyScope, CapabilityMapping } from "ai-jue-core";

const IMPORT_LINE = /^@(\S+)\s*$/gm;
const MAX_IMPORT_DEPTH = 5;

/**
 * Resolves Claude Code's `@<path>` memory-file import syntax so Canonical
 * `context.global` carries the actual imported content, not the import
 * directive. Caps recursion to avoid a cycle; Claude Code's own docs cap
 * recursive imports similarly.
 */
function resolveImports(content: string, baseDir: string, depth = 0): string {
  if (depth >= MAX_IMPORT_DEPTH) return content;
  return content.replace(IMPORT_LINE, (match, importPath) => {
    const resolved = path.resolve(baseDir, importPath);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return match;
    const imported = fs.readFileSync(resolved, "utf8");
    return resolveImports(imported, path.dirname(resolved), depth + 1).trim();
  });
}

/**
 * `context.global` maps to root `CLAUDE.md` (project layout only — a
 * Plugin has no `context.global` concept). Write reuses the generic
 * managed-markdown-file mapping unchanged; read is the one custom bit,
 * since `@import` resolution has no sibling among the other Capabilities.
 */
export function context(scope: ApplyScope = "project"): CapabilityMapping<string> {
  const managed = managedMarkdownFile({
    filePath: (root) =>
      scope === "user" ? path.join(root, ".claude", "CLAUDE.md") : path.join(root, "CLAUDE.md"),
  });
  return {
    read(root) {
      const claudeMdPath =
        scope === "user" ? path.join(root, ".claude", "CLAUDE.md") : path.join(root, "CLAUDE.md");
      if (!fs.existsSync(claudeMdPath)) return undefined;
      const raw = fs.readFileSync(claudeMdPath, "utf8");
      const managedContent = extractManagedContent(raw);
      return resolveImports(managedContent, path.dirname(claudeMdPath)).trim();
    },
    write: managed.write,
  };
}
