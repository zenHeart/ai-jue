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
export const supportedScopes = ["project", "user"] as const;

/**
 * `jue apply`'s Claude Code entry point: converts a resolved config into
 * `CanonicalDocument`, computes the Artifact via `write()`, and applies the
 * result to `outputDir`. `tools.claude` (target-private passthrough
 * settings, never part of Canonical) flows through separately as
 * `WriteContext.toolsConfig`.
 */
export async function generate(config: any, outputDir: string): Promise<void> {
  const canonical = toCanonicalDocument(config);
  const toolsConfig = config?.tools?.claude;

  const changes = await write(canonical, {
    projectRoot: outputDir,
    artifactKind: "project",
    toolsConfig: toolsConfig && Object.keys(toolsConfig).length > 0 ? toolsConfig : undefined,
  });

  applyChangesOrThrow(outputDir, changes);
}

const claudeCodeAdapter: Adapter = {
  id: "claude-code",
  supportedScopes,
  capabilities: {
    rules: "supported",
    commands: "supported",
    skills: "supported",
    agents: "supported",
    hooks: "supported",
    mcp: "supported",
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [claudeCodeAdapter] });
