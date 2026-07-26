import { readCapabilities } from "../../../src/capability-mapping";
import { toCanonicalDocument } from "../../../src/canonical-document";
import type { CanonicalDocument } from "../../../src/canonical-document";
import { agents, commands, context, hooks, mcp, rules, skills } from "./capabilities";

export interface ReadContext {
  projectRoot: string;
}

export async function read({ projectRoot }: ReadContext): Promise<CanonicalDocument> {
  const canonical = readCapabilities(
    {
      context: context(),
      rules: rules(),
      commands: commands(),
      agents: agents(),
      skills: skills(),
      hooks: hooks(),
      mcp: mcp(),
    },
    projectRoot,
  );
  return toCanonicalDocument(canonical);
}
