import path from "path";
import { flatMarkdownDirectory } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type CursorArtifactKind } from "./layout";

function withNameDescription(
  base: CapabilityMapping<Record<string, unknown>>,
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
              : `Command: ${name}`,
        };
      }
      return base.write(root, enriched, target);
    },
  };
}

/** `<root>/commands/<name>.md` slash commands. */
export function commands(artifactKind: CursorArtifactKind): CapabilityMapping<Record<string, unknown>> {
  return withNameDescription(
    flatMarkdownDirectory({
      dirPath: (root) => path.join(componentRoot(root, artifactKind), "commands"),
    }),
  );
}
