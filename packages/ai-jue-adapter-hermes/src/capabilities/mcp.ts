import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { assertNoLiteralCredentials, computeMergedJson, hashArtifactContent } from "ai-jue-core";
import type { ArtifactChange, CapabilityMapping } from "ai-jue-core";

export interface CanonicalMcp {
  servers: Record<string, any>;
}

/** Verified against a live `config.yaml`'s `mcp.servers.<name>.env` values, e.g. `${MINIMAX_COMPANY_API_KEY}`. */
function toCanonicalMcp(native: Record<string, any>): CanonicalMcp {
  for (const [name, server] of Object.entries(native)) {
    assertNoLiteralCredentials(server, `Hermes MCP server "${name}"`);
  }
  return { servers: native };
}

function toNativeMcp(canonical: CanonicalMcp): Record<string, any> {
  return canonical.servers;
}

/**
 * Hermes's only verified MCP surface: the `mcp.servers` key of `config.yaml`
 * (root of `HERMES_HOME`), e.g. `mcp.servers.chrome-devtools` /
 * `mcp.servers.minimax` on a live installation. `config.yaml` is YAML, not
 * JSON, so the shared `mergedJsonFile` factory in `ai-jue-core` (JSON-only)
 * doesn't fit — this hand-writes the same "deep-merge one key, preserve
 * everything else in the file" semantics for YAML, reusing
 * `computeMergedJson` for the merge itself so the policy stays identical to
 * every JSON-based Capability mapping.
 */
export function mcp(): CapabilityMapping<CanonicalMcp> {
  return {
    read(root) {
      const filePath = path.join(root, "config.yaml");
      if (!fs.existsSync(filePath)) return undefined;
      const parsed = (yaml.load(fs.readFileSync(filePath, "utf8")) ?? {}) as Record<string, any>;
      const servers = parsed?.mcp?.servers;
      if (!servers || typeof servers !== "object") return undefined;
      return toCanonicalMcp(servers);
    },
    write(root, value, target) {
      const filePath = path.join(root, "config.yaml");
      const exists = fs.existsSync(filePath);
      const existingRaw = exists ? fs.readFileSync(filePath, "utf8") : undefined;
      const existingParsed = existingRaw !== undefined ? ((yaml.load(existingRaw) ?? {}) as Record<string, any>) : undefined;
      const merged = computeMergedJson(existingParsed, { mcp: { servers: toNativeMcp(value) } });
      const finalRaw = yaml.dump(merged, { lineWidth: -1, noRefs: true });
      if (existingRaw !== undefined && existingRaw.trim() === finalRaw.trim()) return [];
      const change: ArtifactChange = {
        target,
        kind: exists ? "update" : "create",
        ownership: "merged-keys",
        scope: "project",
        path: "config.yaml",
        beforeHash: exists ? hashArtifactContent(existingRaw as string) : null,
        afterHash: hashArtifactContent(finalRaw),
        content: finalRaw,
        risk: "low",
        requiresApproval: false,
        atomicState: "planned",
      };
      return [change];
    },
  };
}
