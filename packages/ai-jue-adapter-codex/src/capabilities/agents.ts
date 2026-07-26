import path from "path";
import { createHash } from "crypto";
import { parse as parseToml, stringify as stringifyToml } from "@iarna/toml";
import fs from "fs";
import type { ArtifactChange, CapabilityMapping } from "ai-jue-core";

/**
 * Codex custom agents live at `.codex/agents/<name>.toml` with required
 * `name`, `description`, `developer_instructions`, plus optional override
 * keys `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`,
 * `skills.config` (per JUE-104/105 / JUE-301 Phase 1). TOML is not the
 * Markdown+frontmatter shape any of the four capability-mapping factories
 * produce, so we hand-write the mapping.
 *
 * Per-agent file shape: one TOML file per agent name, exactly the keys
 * above. We pass through whatever is in `agent.codex` (canonical's
 * target-private Codex passthrough field) as additional TOML top-level
 * keys, after filtering through the verified override set.
 */
const AGENT_OVERRIDE_KEYS = new Set([
  "model",
  "model_reasoning_effort",
  "sandbox_mode",
  "mcp_servers",
  "skills",
]);

const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function assertSafeName(name: string): void {
  if (!SAFE_NAME.test(name)) {
    throw new Error(`Codex agent name must be a safe single path segment: ${name}`);
  }
}

function pickOverrides(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([k]) => AGENT_OVERRIDE_KEYS.has(k)),
  );
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export function agents(): CapabilityMapping<Record<string, unknown>> {
  return {
    read(root) {
      const dir = path.join(root, ".codex", "agents");
      if (!fs.existsSync(dir)) return undefined;
      const result: Record<string, unknown> = {};
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".toml")) continue;
        const name = entry.name.slice(0, -5);
        assertSafeName(name);
        const content = fs.readFileSync(path.join(dir, entry.name), "utf8");
        const parsed = parseToml(content) as Record<string, unknown>;
        const instructions = typeof parsed.developer_instructions === "string"
          ? parsed.developer_instructions
          : "";
        result[name] = {
          ...(typeof parsed.description === "string" ? { description: parsed.description } : {}),
          ...(typeof parsed.name === "string" && parsed.name !== name ? { name: parsed.name } : {}),
          content: instructions,
          prompt: instructions,
          ...pickOverrides(parsed),
        };
      }
      return Object.keys(result).length > 0 ? result : undefined;
    },
    write(root, value, target): ArtifactChange[] {
      const agents = (value ?? {}) as Record<string, unknown>;
      const dir = path.join(root, ".codex", "agents");
      const changes: ArtifactChange[] = [];
      for (const name of Object.keys(agents)) {
        assertSafeName(name);
        const agent = (agents[name] ?? {}) as Record<string, unknown>;
        const instructions = typeof agent.developer_instructions === "string"
          ? agent.developer_instructions
          : typeof agent.prompt === "string"
            ? agent.prompt
            : typeof agent.content === "string"
              ? agent.content
              : "";
        const nativeRecord: Record<string, unknown> = {
          name: typeof agent.name === "string" && agent.name ? agent.name : name,
          description: typeof agent.description === "string" ? agent.description : `Agent: ${name}`,
          developer_instructions: instructions,
          ...pickOverrides(agent),
        };
        // @iarna/toml's `stringify` accepts a `JsonMap` (a strictly-typed
        // recursive record); our `nativeRecord` is loosely `Record<string,
        // unknown>`. Round-trip through JSON to satisfy the type — every
        // value we store here is already JSON-serializable (strings,
        // numbers, booleans, arrays of those, or nested plain objects).
        const raw = stringifyToml(JSON.parse(JSON.stringify(nativeRecord)));
        const filePath = path.join(dir, `${name}.toml`);
        const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : undefined;
        if (existing === raw) continue;
        changes.push({
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
        });
      }
      return changes;
    },
  };
}
