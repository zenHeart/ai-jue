import fs from "fs";
import path from "path";
import { assertNoLiteralCredentials, mergedJsonFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import type { CodexArtifactKind } from "./layout";

export interface CanonicalMcp {
  servers: Record<string, any>;
}

function toCanonicalMcp(native: any): CanonicalMcp {
  const servers: Record<string, any> =
    native.mcpServers && typeof native.mcpServers === "object" ? native.mcpServers : native;
  for (const [name, server] of Object.entries(servers)) {
    assertNoLiteralCredentials(server, `Codex MCP server "${name}"`);
  }
  return { servers };
}

function toNativeMcp(canonical: CanonicalMcp): { mcpServers: Record<string, any> } | undefined {
  const projectScoped: Record<string, any> = {};
  for (const [name, server] of Object.entries(canonical.servers ?? {})) {
    const scope = server.scope ?? "project";
    if (scope !== "project") {
      throw new Error(
        `Codex Plugin MCP server "${name}" uses scope "${scope}". ` +
          'Plugin Artifacts only support "project" scope; refusing to drop the server silently.',
      );
    }
    const { scope: _scope, ...rest } = server;
    projectScoped[name] = rest;
  }
  return Object.keys(projectScoped).length > 0 ? { mcpServers: projectScoped } : undefined;
}

/**
 * Codex MCP:
 * - project → still degraded (TOML `[mcp_servers.*]` in `.codex/config.toml`;
 *   no TOML writer — honest no-op, JUE-301)
 * - plugin → root `.mcp.json` (same portable shape as Claude plugins / OpenClaw
 *   compatible bundles; RFC-0002)
 */
export function mcp(artifactKind: CodexArtifactKind = "project"): CapabilityMapping<CanonicalMcp | Record<string, unknown>> {
  if (artifactKind === "plugin") {
    return mergedJsonFile<CanonicalMcp>({
      filePath: (root) => path.join(root, ".mcp.json"),
      toCanonical: toCanonicalMcp,
      toNative: toNativeMcp,
    });
  }

  return {
    read(root) {
      const filePath = path.join(root, ".codex", "config.toml");
      if (!fs.existsSync(filePath)) return undefined;
      const raw = fs.readFileSync(filePath, "utf8");
      let parsed: { mcpServers?: Record<string, unknown> };
      try {
        parsed = JSON.parse(raw) as { mcpServers?: Record<string, unknown> };
      } catch {
        return undefined;
      }
      const servers = parsed.mcpServers;
      if (servers) {
        for (const [name, server] of Object.entries(servers)) {
          assertNoLiteralCredentials(server, `codex-mcp-server-${name}`);
        }
      }
      return servers ? { servers } : undefined;
    },
    write(_root, value, _target) {
      if (!value || typeof value !== "object") return [];
      const servers =
        "servers" in value && value.servers && typeof value.servers === "object"
          ? (value as CanonicalMcp).servers
          : (value as Record<string, unknown>);
      if (!servers || Object.keys(servers).length === 0) return [];
      assertNoLiteralCredentials(JSON.stringify(servers), "codex-mcp");
      // Project TOML write remains out of scope.
      return [];
    },
  };
}
