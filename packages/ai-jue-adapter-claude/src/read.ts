import { readCapabilities, toCanonicalDocument } from "ai-jue-core";
import type { CanonicalDocument, ReadContext as CoreReadContext } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { hooks } from "./capabilities/hooks";
import { isProjectLayout } from "./capabilities/layout";
import { mcp } from "./capabilities/mcp";
import { rules } from "./capabilities/rules";
import { skills } from "./capabilities/skills";

export type ReadContext = CoreReadContext;

/**
 * Reads a Claude Code project or Plugin directory into a `CanonicalDocument`.
 * Layout (project vs. Plugin) is auto-detected from `root` so the frozen
 * `ReadContext` shape does not need a new field for it. Each Capability's
 * native shape is declared in `./capabilities/*` and driven through the
 * shared capability-mapping engine; `context.global` is the one hand-written
 * case (see `./capabilities/context.ts`).
 */
export async function read(readContext: ReadContext): Promise<CanonicalDocument> {
  const root = readContext.artifactRoot;
  const scope = readContext.scope;
  const artifactKind = scope === "user" || isProjectLayout(root) ? "project" : "plugin";

  const canonical = readCapabilities(
    {
      rules: rules(artifactKind),
      commands: commands(artifactKind),
      agents: agents(artifactKind),
      skills: skills(artifactKind),
      hooks: hooks(artifactKind),
      mcp: mcp(scope),
    },
    root,
  );

  const global = artifactKind === "project" ? context(scope).read(root) : undefined;

  return toCanonicalDocument({
    context: global !== undefined ? { global } : undefined,
    ...canonical,
  });
}
