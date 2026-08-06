import { writeCapabilities } from "ai-jue-core";
import type { ArtifactChange, CanonicalDocument } from "ai-jue-core";
import { agents } from "./capabilities/agents";
import { commands } from "./capabilities/commands";
import { context } from "./capabilities/context";
import { writeCursorTools, type CursorToolsConfig } from "./capabilities/cursor-tools";
import { hooks } from "./capabilities/hooks";
import type { CursorArtifactKind } from "./capabilities/layout";
import { writePluginManifest, type CursorPluginManifest } from "./capabilities/manifest";
import { mcp } from "./capabilities/mcp";
import { rules } from "./capabilities/rules";
import { skills } from "./capabilities/skills";

export interface WriteContext {
  projectRoot: string;
  artifactKind?: CursorArtifactKind;
  /** From `generate()` — same shape as `tools.cursor`. */
  cursorTools?: CursorToolsConfig;
  /** From Core `apply` — `tools.cursor` keyed by adapter short name. */
  toolsConfig?: CursorToolsConfig;
  /** Plugin identity; required for meaningful plugin Artifact output. */
  pluginManifest?: CursorPluginManifest;
}

const TARGET = "cursor";

export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const artifactKind: CursorArtifactKind = writeContext.artifactKind ?? "project";

  const changes = writeCapabilities(
    {
      rules: rules(artifactKind),
      commands: commands(artifactKind),
      skills: skills(artifactKind),
      agents: agents(artifactKind),
      hooks: hooks(artifactKind),
      mcp: mcp(artifactKind),
    },
    canonical as unknown as Record<string, unknown>,
    writeContext.projectRoot,
    TARGET,
  );

  if (artifactKind === "project") {
    if (canonical.context?.global) {
      changes.push(
        ...context().write(writeContext.projectRoot, canonical.context.global, TARGET),
      );
    }
    changes.push(
      ...writeCursorTools(
        writeContext.projectRoot,
        TARGET,
        writeContext.cursorTools ?? writeContext.toolsConfig,
      ),
    );
  }

  if (artifactKind === "plugin" && writeContext.pluginManifest) {
    changes.push(
      ...writePluginManifest(writeContext.projectRoot, writeContext.pluginManifest, TARGET),
    );
  }

  return changes;
}
