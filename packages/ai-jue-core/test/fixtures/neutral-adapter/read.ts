import { readCapabilities } from "../../../src/capability-mapping";
import { toCanonicalDocument } from "../../../src/canonical-document";
import type { CanonicalDocument } from "../../../src/canonical-document";
import type { ReadContext } from "../../../src/extension-host";
import { agents, commands, context, hooks, mcp, rules, skills } from "./capabilities";

export async function read({ artifactRoot }: ReadContext): Promise<CanonicalDocument> {
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
    artifactRoot,
  );
  return toCanonicalDocument(canonical);
}
