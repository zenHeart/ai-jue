import path from "path";
import { createHash } from "crypto";
import { writeTextFile } from "ai-jue-core";
import type { ArtifactChange } from "ai-jue-core";

/**
 * OpenClaw has no Plugin/Bundle aggregate Artifact kind in the same
 * sense as Claude's Plugin (Codex's marketplace + plugin is closer
 * to a Bundle but lives in the user's CODEX_HOME, not a project-
 * scoped file). OpenClaw's `agents add` creates an isolated global
 * workspace under `~/.openclaw/agents/<name>/`, but that is a runtime
 * environment, not a project-scoped Artifact. JUE-302 declares
 * `degraded` for any Plugin/Bundle equivalent.
 *
 * This module is reserved for the placeholder no-op (the JUE-301
 * precedent: even though OpenClaw has nothing matching the Plugin
 * shape, we keep `manifest.ts` for symmetry with the other Adapters'
 * file layout — the absence of the feature is documented via the
 * `degraded` capability declaration, not by the missing file).
 */
export function writeOpenClawPluginManifest(
  _root: string,
  _manifest: Record<string, unknown>,
  _target: string,
): ArtifactChange[] {
  // No-op: OpenClaw has no project-scoped Plugin/Bundle aggregate.
  return [];
}

// Kept `writeTextFile` and `path` imported only to satisfy the
// no-implicit-any rules of the surrounding imports; using them would
// require inventing a new on-disk shape OpenClaw doesn't have.
void path;
void createHash;
void writeTextFile;
