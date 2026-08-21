import { writeCapabilities } from "ai-jue-core";
import type {
  ArtifactChange,
  CanonicalDocument,
  WriteContext as CoreWriteContext,
} from "ai-jue-core";
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

export type WriteContext = CoreWriteContext;

const TARGET = "cursor";

export async function write(
  canonical: CanonicalDocument,
  writeContext: WriteContext,
): Promise<ArtifactChange[]> {
  const artifactKind = (writeContext.artifactKind ?? "project") as CursorArtifactKind;
  const toolsConfig = writeContext.toolsConfig as CursorToolsConfig | undefined;

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
    writeContext.artifactRoot,
    TARGET,
  );

  if (artifactKind === "project") {
    if (canonical.context?.global) {
      changes.push(
        ...context().write(writeContext.artifactRoot, canonical.context.global, TARGET),
      );
    }
    changes.push(
      ...writeCursorTools(
        writeContext.artifactRoot,
        TARGET,
        toolsConfig,
      ),
    );
  } else {
    // 失败显式化:plugin 布局不产生 AGENTS.md / .cursorignore / settings.json,
    // 若 canonical 携带这些内容则显式警告,禁止静默丢弃。
    const dropped = [
      canonical.context?.global ? "context.global" : null,
      toolsConfig ? "tools.cursor" : null,
    ].filter((s): s is string => s !== null);
    if (dropped.length > 0) {
      console.warn(
        `[ai-jue] cursor plugin 布局不写入 ${dropped.join("、")};` +
          " 这些产物属于 project 布局(.cursor/),请在 project 布局下执行 apply。",
      );
    }
  }

  if (artifactKind === "plugin" && writeContext.pluginManifest) {
    changes.push(
      ...writePluginManifest(
        writeContext.artifactRoot,
        writeContext.pluginManifest as CursorPluginManifest,
        TARGET,
      ),
    );
  }

  return changes;
}
