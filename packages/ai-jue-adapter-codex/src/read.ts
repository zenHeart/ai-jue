import { readCapabilities, toCanonicalDocument } from "ai-jue-core";
import type { CanonicalDocument, ReadContext as CoreReadContext } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { detectArtifactKind } from "./capabilities/layout";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export type ReadContext = CoreReadContext;

export async function read({ artifactRoot }: ReadContext): Promise<CanonicalDocument> {
  const artifactKind = detectArtifactKind(artifactRoot) ?? "project";
  const canonical = readCapabilities(
    {
      context: context(),
      commands: commands(),
      agents: agents(),
      skills: skills(artifactKind),
      hooks: hooks(),
      mcp: mcp(artifactKind),
    },
    artifactRoot,
  );
  return toCanonicalDocument(canonical as unknown as Record<string, unknown>);
}
