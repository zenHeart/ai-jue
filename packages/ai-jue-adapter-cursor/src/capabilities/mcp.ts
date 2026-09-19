import path from "path";
import type { CapabilityMapping } from "ai-jue-core";
import { assertNoLiteralCredentials, mergedJsonFile } from "ai-jue-core";
import { componentRoot, type CursorArtifactKind } from "./layout";

function enrichStdioServer(server: Record<string, unknown>): Record<string, unknown> {
  const next = { ...server };
  if (typeof next.command === "string" && next.command.trim() && next.type === undefined) {
    next.type = "stdio";
  }
  return next;
}

/** Project: `.cursor/mcp.json`; Plugin: root `mcp.json`. */
export function mcp(artifactKind: CursorArtifactKind): CapabilityMapping<{ servers?: Record<string, unknown> }> {
  return mergedJsonFile<{ servers?: Record<string, unknown> }>({
    filePath: (root) =>
      artifactKind === "project"
        ? path.join(componentRoot(root, artifactKind), "mcp.json")
        : path.join(root, "mcp.json"),
    toCanonical: (native) => {
      const servers = (native as { mcpServers?: Record<string, unknown> }).mcpServers;
      for (const [name, server] of Object.entries(servers ?? {})) {
        assertNoLiteralCredentials(server, `Cursor MCP server "${name}"`);
      }
      return servers && Object.keys(servers).length > 0 ? { servers } : undefined;
    },
    toNative: (canonical) => {
      const servers: Record<string, unknown> = {};
      for (const [name, server] of Object.entries(canonical.servers ?? {})) {
        if (!server || typeof server !== "object") continue;
        assertNoLiteralCredentials(server, `Cursor MCP server "${name}"`);
        const enriched = enrichStdioServer(server as Record<string, unknown>);
        if (typeof enriched.command === "string" || typeof enriched.url === "string") {
          servers[name] = enriched;
        }
      }
      return Object.keys(servers).length > 0 ? { mcpServers: servers } : undefined;
    },
  });
}
