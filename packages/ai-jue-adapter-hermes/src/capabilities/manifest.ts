import path from "path";
import type { ArtifactChange } from "ai-jue-core";

/**
 * Hermes has no Plugin/Bundle aggregate Artifact kind analogous to
 * Codex's `marketplace add + plugin add` or Claude's `claude plugin
 * validate`. Hermes has a `~/.hermes/plugins/` directory on the real
 * install (verified via SSH) but it holds only `installs.json` (the
 * installed-plugin registry, not a project-scoped distribution shape).
 * The JUE-303 honest-stance principle says we don't invent a plugin
 * manifest for an Agent that doesn't have one.
 */
export function writeHermesPluginManifest(
  _root: string,
  _manifest: Record<string, unknown>,
  _target: string,
): ArtifactChange[] {
  // No-op: Hermes has no project-scoped Plugin/Bundle aggregate.
  return [];
}

// Keep `path` available for future implementations; reserve the symbol.
void path;
