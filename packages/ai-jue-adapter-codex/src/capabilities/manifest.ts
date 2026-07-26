import path from "path";
import { createHash } from "crypto";
import { mergedJsonFile } from "ai-jue-core";
import type { ArtifactChange } from "ai-jue-core";

/**
 * Plugin manifest: `.codex-plugin/plugin.json` at the Plugin root, with
 * the same shape Claude's `capabilities/manifest.ts` produces, minus the
 * `interface` block (Codex doesn't render the same display metadata
 * surface; we omit it rather than fabricate one).
 */
export interface CodexPluginManifest {
  name: string;
  version: string;
  description: string;
  author?: { name?: string; url?: string };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export function writeCodexPluginManifest(
  root: string,
  manifest: CodexPluginManifest,
  target: string,
): ArtifactChange[] {
  const filePath = path.join(root, ".codex-plugin", "plugin.json");
  const raw = JSON.stringify(manifest, null, 2) + "\n";
  const existing = require("fs").existsSync(filePath)
    ? require("fs").readFileSync(filePath, "utf8")
    : undefined;
  if (existing === raw) return [];
  return [
    {
      target,
      kind: existing === undefined ? "create" : "update",
      ownership: "full",
      scope: "project",
      path: path.relative(root, filePath).split(path.sep).join("/"),
      beforeHash: existing === undefined ? null : sha256(existing),
      afterHash: sha256(raw),
      content: raw,
      risk: "low",
      requiresApproval: false,
      atomicState: "planned",
    },
  ];
}
