import { readCapabilities, toCanonicalDocument } from "ai-jue-core";
import type { CanonicalDocument, ReadContext as CoreReadContext } from "ai-jue-core";
import { context } from "./capabilities/context";
import { cron } from "./capabilities/cron";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export type ReadContext = CoreReadContext;

/**
 * Hermes Adapter's read: thin composition over a small subset of the
 * real `cwr:/d/devuser/.hermes` surface — per the JUE-303 honest-stance
 * principle, only the surfaces we have ground-truth evidence for:
 *   - `context.global`  ← workspace-root `MEMORY.md`
 *   - `hooks`            ← empty no-op (the real ~/.hermes/hooks/ is empty)
 *   - `mcp`              ← config.yaml's `mcp.servers` block
 *   - `commands`         ← no-op (Hermes has no per-workspace commands/)
 *   - `agents`           ← no-op (the single-agent runtime reads config.yaml)
 *   - `skills`           ← `skills/<cat>/<name>/SKILL.md` (3-level shape)
 *   - `cron`             ← `cron/jobs.json` (full-file pass-through)
 */
export async function read({ artifactRoot }: ReadContext): Promise<CanonicalDocument> {
  const canonical = readCapabilities(
    {
      context: context(),
      hooks: { read: () => undefined, write: () => [] },
      commands: { read: () => undefined, write: () => [] },
      agents: { read: () => undefined, write: () => [] },
      mcp: mcp(),
      skills: skills(),
      cron: cron(),
    },
    artifactRoot,
  );
  return toCanonicalDocument(canonical as unknown as Record<string, unknown>);
}
