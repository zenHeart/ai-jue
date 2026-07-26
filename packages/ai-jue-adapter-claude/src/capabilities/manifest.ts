import path from "path";
import { mergedJsonFile } from "ai-jue-core";
import type { ArtifactChange } from "ai-jue-core";

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: { name: string; email?: string; url?: string };
  dependencies?: string[];
  userConfig?: Record<string, unknown>;
}

/**
 * `.claude-plugin/plugin.json` — the Plugin's own identity. Not a Canonical
 * Capability (it carries no user-facing behavior, only Artifact metadata),
 * so it isn't part of the `capabilities/*` mapping table `read()`/`write()`
 * share; it's written only when a Plugin artifact is requested and the
 * caller supplies the identity (Jue cannot invent a name/version).
 * `claude plugin validate` requires this manifest to exist; `--plugin-dir`
 * runtime loading tolerates its absence (manifest-optional auto-discovery,
 * confirmed in JUE-105) — so omitting it is a valid, deliberate choice, not
 * an error.
 */
export function writePluginManifest(root: string, manifest: PluginManifest, target: string): ArtifactChange[] {
  const mapping = mergedJsonFile<PluginManifest>({
    filePath: (r) => path.join(r, ".claude-plugin", "plugin.json"),
  });
  return mapping.write(root, manifest, target);
}
