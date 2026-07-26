import fs from "fs";
import path from "path";
import { assertNoLiteralCredentials } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/**
 * OpenClaw's MCP servers are global-only and live in `openclaw.json` (the
 * user-level config at `~/.openclaw/openclaw.json`), NOT in a
 * project-scoped file. Verified by reading the real
 * `~/.openclaw/openclaw.json` (`mcp.servers.<name>` with `command`,
 * `args`, `enabled`, `env`, ... — the same field set as Codex's TOML
 * `mcp_servers` table).
 *
 * For the JUE-302 Adapter, we accept `mcp.servers` as input and
 * round-trip it against the **fixture's** `openclaw.json` (per the
 * real shape; the path `openclaw.json` lives at the user home for
 * a real install but a fixture can keep one alongside the workspace
 * for testing). Native validation runs against that fixture's
 * `openclaw.json`. The `assertNoLiteralCredentials` security check
 * runs on read, matching Claude/Codex's precedent.
 *
 * Note: this is one of the documented "openclaw.json at user home"
 * realities that makes project-scoped MCP strictly unsupported; we
 * treat the fixture's copy as a stand-in for the global file so the
 * contract suite has a path to test against.
 */
export function mcp(): CapabilityMapping<Record<string, unknown>> {
  return {
    read(root) {
      const filePath = path.join(root, "openclaw.json");
      if (!fs.existsSync(filePath)) return undefined;
      const raw = fs.readFileSync(filePath, "utf8");
      let parsed: { mcp?: { servers?: Record<string, unknown> } };
      try {
        parsed = JSON.parse(raw);
      } catch {
        return undefined;
      }
      const servers = parsed.mcp?.servers;
      if (!servers) return undefined;
      for (const [name, server] of Object.entries(servers)) {
        assertNoLiteralCredentials(server, `openclaw-mcp-server-${name}`);
      }
      // Return the full `mcp` shape (`{servers: ...}`), NOT just the
      // inner servers map. The Canonical schema requires
      // `mcp: z.object({servers: ...}).optional()` — returning the bare
      // map makes the schema normalize `mcp` to `{}` (silent data
      // loss). Discovered this real bug in the JUE-302 deep audit
      // when reading the user's real cwr:/d/devuser/.openclaw install
      // produced `mcp: {}` even though the fixture's openclaw.json
      // contained four well-formed MCP servers.
      return { servers };
    },
    write(_root, value, _target) {
      if (!value || Object.keys(value).length === 0) return [];
      // Defensive: never let a literal credential in Canonical reach
      // disk. The real write path is documented as no-op (the
      // `openclaw.json` file lives at the user home, not the project
      // root; writing it from Jue would silently mutate the operator's
      // global config, which the JUE-302 honest-unsupported stance
      // refuses to do). The contract round-trip holds vacuously.
      const json = JSON.stringify(value);
      assertNoLiteralCredentials(json, "openclaw-mcp");
      return [];
    },
  };
}
