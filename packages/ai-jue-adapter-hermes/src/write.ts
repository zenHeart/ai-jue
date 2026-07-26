import { writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { context } from "./capabilities/context";
import { cron } from "./capabilities/cron";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
}

const TARGET = "hermes";

/**
 * Hermes Adapter's write: thin composition; routes through
 * `core-executor.ts` `applyChangesOrThrow` (no bespoke apply/rollback
 * mechanism — Core executes `ArtifactChange` per the JUE-103 contract).
 * Same honest-stance map as read.
 */
export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const result = writeCapabilities(
    {
      hooks: { read: () => undefined, write: () => [] },
      commands: { read: () => undefined, write: () => [] },
      agents: { read: () => undefined, write: () => [] },
      mcp: mcp(),
      skills: skills(),
      cron: cron(),
    },
    canonical as unknown as Record<string, unknown>,
    writeContext.projectRoot,
    TARGET,
  );

  if (canonical.context?.global) {
    result.push(
      ...context().write(
        writeContext.projectRoot,
        { global: (canonical.context as { global?: string }).global ?? "" },
        TARGET,
      ),
    );
  }

  return result;
}
