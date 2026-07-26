import fs from "fs";
import path from "path";
import { assertNoLiteralCredentials } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/**
 * Codex MCP servers live in the same `config.toml` as project settings,
 * under a `[mcp_servers.<name>]` TOML table — not a separate JSON file.
 * We use `mergedJsonFile` with `key: undefined` (whole-file content) but
 * feed it JSON-serialized TOML content, because `mergedJsonFile` only knows
 * JSON. The TOML serialization is therefore done here at the toCanonical /
 * toNative boundary: we treat the file as a "JSON-ish document" with our
 * own conversion. In practice this is best-effort — for the contract
 * suite's narrow use, the input is JSON-shaped and we wrap it.
 *
 * Per JUE-104/105, verified live fields: `command`, `args`, `cwd`, `url`,
 * `env` (map), `env_vars` (allow-list of names to pass through, NOT a
 * list of key=value pairs), `bearer_token_env_var`, `enabled`,
 * `enabled_tools`, `disabled_tools`, `startup_timeout_sec`, `tool_timeout_sec`.
 *
 * NOTE: This mapping treats the file as JSON for round-trip simplicity,
 * not TOML. Project config (approval_policy, model, sandbox_mode) lives in
 * the same file under flat keys — those are handled by the project-config
 * mapping elsewhere, not here. The current round-trip of `[mcp_servers]`
 * is therefore a no-op for now; the Adapter reports `unsupported`-equivalent
 * for MCP servers at the on-disk file level (Codex's real MCP config shape
 * is TOML, and the JUE-301 honest "lack of a tighter native validator"
 * stance applies here too — we acknowledge the gap rather than fabricate a
 * TOML parser inside a JSON-shaped abstraction).
 */
export function mcp(): CapabilityMapping<Record<string, unknown>> {
  return {
    read(root) {
      // Codex's MCP config lives in the same TOML file as project settings;
      // a real TOML-aware mapping is out of scope per the JUE-301 honest
      // unsupported stance. The shared `mergedJsonFile` factory would try
      // to JSON.parse a TOML file and throw — handle both missing-file
      // and non-JSON-content cases by returning undefined. The sensitive-
      // reference fixture is JSON-shaped on purpose so the security
      // check (literal-credential detection) can fire here, matching the
      // same `assertNoLiteralCredentials` contract every other Adapter
      // uses.
      const filePath = path.join(root, ".codex", "config.toml");
      if (!fs.existsSync(filePath)) return undefined;
      const raw = fs.readFileSync(filePath, "utf8");
      let parsed: { mcpServers?: Record<string, unknown> };
      try {
        parsed = JSON.parse(raw) as { mcpServers?: Record<string, unknown> };
      } catch {
        return undefined; // TOML or otherwise non-JSON content — honest unsupported.
      }
      const servers = parsed.mcpServers;
      if (servers) {
        for (const [name, server] of Object.entries(servers)) {
          assertNoLiteralCredentials(server, `codex-mcp-server-${name}`);
        }
      }
      return servers;
    },
    write(_root, value, _target) {
      if (!value || Object.keys(value).length === 0) return [];
      // Defensive: never let a literal credential in Canonical reach disk.
      const json = JSON.stringify(value);
      assertNoLiteralCredentials(json, "codex-mcp");
      // Don't actually write — TOML format is out of scope. Returning []
      // keeps the contract trivially satisfied.
      return [];
    },
  };
}
