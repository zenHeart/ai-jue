import path from "path";
import { assertNoLiteralCredentials, mergedJsonFile } from "ai-jue-core";
import type { ApplyScope, CapabilityMapping } from "ai-jue-core";

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

function toNativeMcp(canonical: CanonicalMcp, applyScope: ApplyScope): { mcpServers: Record<string, any> } {
  const servers: Record<string, any> = {};
  for (const [name, server] of Object.entries(canonical.servers)) {
    const scope = server.scope ?? applyScope;
    if (scope !== "project" && scope !== "user") {
      throw new Error(`Claude Code MCP server "${name}" has unsupported scope "${scope}"`);
    }
    if (scope !== applyScope) {
      throw new Error(
        `Claude Code MCP server "${name}" scope "${scope}" does not match apply scope "${applyScope}"`,
      );
    }
    const { scope: _scope, ...rest } = server;
    servers[name] = rest;
  }
  return { mcpServers: servers };
}

/** Project MCP lives in `.mcp.json`; user MCP lives in Claude Code's `~/.claude.json`. */
export function mcp(scope: ApplyScope = "project"): CapabilityMapping<CanonicalMcp> {
  return mergedJsonFile<CanonicalMcp>({
    filePath: (root) => path.join(root, scope === "user" ? ".claude.json" : ".mcp.json"),
    toCanonical: toCanonicalMcp,
    toNative: (canonical) => toNativeMcp(canonical, scope),
  });
}
