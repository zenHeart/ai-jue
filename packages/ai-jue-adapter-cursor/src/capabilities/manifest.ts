import path from "path";
import { mergedJsonFile } from "ai-jue-core";
import type { ArtifactChange } from "ai-jue-core";

export interface CursorPluginManifest {
  name: string;
  version?: string;
  description?: string;
  author?: { name: string; email?: string };
  variables?: Record<string, unknown>;
}

/**
 * `.cursor-plugin/plugin.json` — Plugin identity and optional variables schema.
 * Not a Canonical Capability; written only for plugin Artifact when identity is supplied.
 */
export function writePluginManifest(
  root: string,
  manifest: CursorPluginManifest,
  target: string,
): ArtifactChange[] {
  const mapping = mergedJsonFile<CursorPluginManifest>({
    filePath: (r) => path.join(r, ".cursor-plugin", "plugin.json"),
  });
  return mapping.write(root, manifest, target);
}
