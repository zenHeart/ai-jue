import { writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { hooks } from "./capabilities/hooks";
import { mcp } from "./capabilities/mcp";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
}

const TARGET = "openclaw";

/**
 * Computes the `ArtifactChange[]` needed to make an OpenClaw workspace
 * match `canonical`, without performing I/O itself — Core executes
 * approved changes (per the Adapter/Core split frozen in JUE-103).
 *
 * `commands`/`agents`/`mcp` are honest no-op round-trips (each
 * documented in its own capabilities/*.ts): OpenClaw has no per-
 * workspace `commands/` or `agents/` directory, and MCP is global-
 * only (`openclaw.json` lives at the user home, not a project file —
 * writing it from Jue would silently mutate the operator's global
 * config, which the JUE-302 honest-unsupported stance refuses to
 * do).
 */
export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  let changes = writeCapabilities(
    {
      commands: commands(),
      agents: agents(),
      skills: skills(),
      hooks: hooks(),
      mcp: mcp(),
    },
    canonical as unknown as Record<string, unknown>,
    writeContext.projectRoot,
    TARGET,
  );

  if (canonical.context?.global) {
    changes.push(
      ...context().write(writeContext.projectRoot, { global: canonical.context.global }, TARGET),
    );
  }

  return changes;
}
