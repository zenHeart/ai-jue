import { readCapabilities, toCanonicalDocument } from "ai-jue-core";
import type { CanonicalDocument, ReadContext as CoreReadContext } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { readCursorTools } from "./capabilities/cursor-tools";
import { hooks } from "./capabilities/hooks";
import { detectArtifactKind } from "./capabilities/layout";
import { mcp } from "./capabilities/mcp";
import { rules } from "./capabilities/rules";
import { skills } from "./capabilities/skills";

export type ReadContext = CoreReadContext;

export async function read({ artifactRoot }: ReadContext): Promise<CanonicalDocument> {
  // manifest 标记优先于 `.cursor/` 目录检测;两者都没有时回退 project(与 write 默认一致)。
  const artifactKind = detectArtifactKind(artifactRoot) ?? "project";

  const canonical = readCapabilities(
    {
      rules: rules(artifactKind),
      commands: commands(artifactKind),
      skills: skills(artifactKind),
      agents: agents(artifactKind),
      hooks: hooks(artifactKind),
      mcp: mcp(artifactKind),
    },
    artifactRoot,
  );

  if (artifactKind === "project") {
    const globalContext = context().read(artifactRoot);
    if (typeof globalContext === "string" && globalContext.trim()) {
      canonical.context = { global: globalContext };
    }
    const cursorTools = readCursorTools(artifactRoot);
    if (cursorTools) canonical.tools = { cursor: cursorTools };
  }

  return toCanonicalDocument(canonical as unknown as Record<string, unknown>);
}
