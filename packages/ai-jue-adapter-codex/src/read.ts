import { readCapabilities, toCanonicalDocument } from "ai-jue-core";
import type { CanonicalDocument } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { detectArtifactKind } from "./capabilities/layout";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export interface ReadContext {
  projectRoot: string;
}

export async function read({ projectRoot }: ReadContext): Promise<CanonicalDocument> {
  const artifactKind = detectArtifactKind(projectRoot);
  const canonical = readCapabilities(
    {
      context: context(),
      commands: commands(),
      agents: agents(),
      skills: skills(artifactKind),
      hooks: hooks(),
      mcp: mcp(artifactKind),
    },
    projectRoot,
  );
  return toCanonicalDocument(canonical as unknown as Record<string, unknown>);
}
