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
export { detectArtifactKind } from "./capabilities/layout";

/**
 * `jue apply`'s OpenClaw entry point: converts a resolved config into
 * `CanonicalDocument`, computes the Artifact via `write()`, and applies
 * the result to `outputDir`. Kept for parity with the other Adapters'
 * legacy `generate()`-style entry point, but the canonical
 * JUE-103/JUE-205 contract for `apply` is the `Adapter` default export
 * below.
 */
export async function generate(config: any, outputDir: string): Promise<void> {
  const canonical = toCanonicalDocument(config);
  const changes = await write(canonical, {
    projectRoot: outputDir,
    artifactKind: "workspace",
  });
  applyChangesOrThrow(outputDir, changes);
}

const openclawAdapter: Adapter = {
  id: "openclaw",
  capabilities: {
    rules: "degraded", // OpenClaw has no separate rules directory
    commands: "degraded", // OpenClaw has no per-workspace commands directory
    skills: "supported",
    agents: "degraded", // OpenClaw has no per-workspace agents directory
    hooks: "supported",
    mcp: "degraded", // OpenClaw MCP is global-only; we read but don't write the user-level openclaw.json
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [openclawAdapter] });
