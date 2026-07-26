import { writeCapabilities } from "../../../src/capability-mapping";
import type { ArtifactChange } from "../../../src/artifact-change";
import type { CanonicalDocument } from "../../../src/canonical-document";
import { agents, commands, context, hooks, mcp, rules, skills } from "./capabilities";

export interface WriteContext {
  projectRoot: string;
}

const TARGET = "neutral-agent";

export async function write(canonical: CanonicalDocument, { projectRoot }: WriteContext): Promise<ArtifactChange[]> {
  return writeCapabilities(
    {
      context: context(),
      rules: rules(),
      commands: commands(),
      agents: agents(),
      skills: skills(),
      hooks: hooks(),
      mcp: mcp(),
    },
    canonical as Record<string, unknown>,
    projectRoot,
    TARGET,
  );
}
