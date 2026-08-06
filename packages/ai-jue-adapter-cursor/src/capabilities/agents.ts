import path from "path";
import { flatMarkdownDirectory } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type CursorArtifactKind } from "./layout";

function withNameDescription(
  base: CapabilityMapping<Record<string, unknown>>,
  label: string,
): CapabilityMapping<Record<string, unknown>> {
  return {
    read: base.read,
    write(root, value, target) {
      const enriched: Record<string, unknown> = {};
      for (const [name, entry] of Object.entries(value ?? {})) {
        const raw = entry as Record<string, unknown>;
        enriched[name] = {
          ...raw,
          name: typeof raw.name === "string" && raw.name ? raw.name : name,
          description:
            typeof raw.description === "string" && raw.description
              ? raw.description
              : `${label}: ${name}`,
        };
      }
      return base.write(root, enriched, target);
    },
  };
}

/** `<root>/agents/<name>.md` subagents (YAML frontmatter with required name/description). */
export function agents(artifactKind: CursorArtifactKind): CapabilityMapping<Record<string, unknown>> {
  return withNameDescription(
    flatMarkdownDirectory({
      dirPath: (root) => path.join(componentRoot(root, artifactKind), "agents"),
    }),
    "Agent",
  );
}
