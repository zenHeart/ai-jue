import { applyChangesOrThrow, defineExtension, toCanonicalDocument } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { confirm } from "./confirm";
import { read } from "./read";
import { write } from "./write";

export { read } from "./read";
export type { ReadContext } from "./read";
export { write } from "./write";
export type { WriteContext } from "./write";
export { confirm } from "./confirm";
export type { ConfirmContext } from "./confirm";

/**
 * `jue apply`'s Codex entry point: converts a resolved config into
 * `CanonicalDocument`, computes the Artifact via `write()`, and applies the
 * result to `outputDir`. `tools.codex` (target-private passthrough
 * settings, never part of Canonical) flows through separately as
 * `WriteContext` extensions in the future; for now it's read-side
 * (config.toml passthrough via `agents` and the project-config keys).
 */
export async function generate(config: any, outputDir: string): Promise<void> {
  const canonical = toCanonicalDocument(config);
  const changes = await write(canonical, { projectRoot: outputDir, artifactKind: "project" });
  applyChangesOrThrow(outputDir, changes);
}

const codexAdapter: Adapter = {
  id: "codex",
  capabilities: {
    rules: "degraded", // Codex has no separate Rules directory; rules fold into AGENTS.md via context
    commands: "degraded", // Codex's custom-commands was deprecated; this is documented honestly
    skills: "supported",
    agents: "supported",
    hooks: "supported",
    // Project MCP stays TOML-degraded; Plugin Artifacts write portable `.mcp.json`.
    mcp: "degraded",
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [codexAdapter] });
