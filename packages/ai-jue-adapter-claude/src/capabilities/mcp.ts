import path from "path";
import { assertNoLiteralCredentials, mergedJsonFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

export interface CanonicalMcp {
  servers: Record<string, any>;
}

/** Accepts both native shapes confirmed in JUE-104/105: flat `{"<name>": {...}}` and wrapped `{"mcpServers": {...}}`. */
function toCanonicalMcp(native: any): CanonicalMcp {
  const servers: Record<string, any> =
    native.mcpServers && typeof native.mcpServers === "object" ? native.mcpServers : native;
  for (const [name, server] of Object.entries(servers)) {
    assertNoLiteralCredentials(server, `Claude Code MCP server "${name}"`);
  }
  return { servers };
}

/**
 * Only `project`-scope servers map to a safe, project-relative path
 * (`.mcp.json`). `user`/`local` scope map to `~/.claude.json`, outside the
 * project root and not expressible as a project-relative `ArtifactChange.path`
 * under the frozen JUE-102 contract — those servers are intentionally
 * skipped here rather than inventing an unreviewed path scheme.
 */
function toNativeMcp(canonical: CanonicalMcp): { mcpServers: Record<string, any> } | undefined {
  const projectScoped: Record<string, any> = {};
  for (const [name, server] of Object.entries(canonical.servers)) {
    const scope = server.scope ?? "project";
    if (scope !== "project") continue;
    const { scope: _scope, ...rest } = server;
    projectScoped[name] = rest;
  }
  return Object.keys(projectScoped).length > 0 ? { mcpServers: projectScoped } : undefined;
}

/** `.mcp.json` at the root, regardless of project vs. Plugin layout. */
export function mcp(): CapabilityMapping<CanonicalMcp> {
  return mergedJsonFile<CanonicalMcp>({
    filePath: (root) => path.join(root, ".mcp.json"),
    toCanonical: toCanonicalMcp,
    toNative: toNativeMcp,
  });
}
