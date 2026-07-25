import path from "path";
import {
  generateMarkdownFile,
  getAssetText,
  renderMarkdownWithFrontmatter,
  writeSupportFiles,
  writeTextFile,
} from "ai-jue-core";
import * as yaml from "js-yaml";

type RecordValue = Record<string, any>;

const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const CODEX_PROJECT_SETTING_KEYS = new Set([
  "approval_policy",
  "model",
  "model_reasoning_effort",
  "sandbox_mode",
  "web_search",
]);
const CODEX_AGENT_OVERRIDE_KEYS = new Set([
  "model",
  "model_reasoning_effort",
  "sandbox_mode",
]);
const CODEX_MCP_KEYS = new Set([
  "args",
  "command",
  "cwd",
  "disabled_tools",
  "enabled",
  "enabled_tools",
  "required",
  "startup_timeout_sec",
  "tool_timeout_sec",
  "url",
]);

function assertSafeName(kind: string, name: string): void {
  if (!SAFE_NAME.test(name)) {
    throw new Error(`${kind} name must be a safe single path segment: ${name}`);
  }
}

function cleanRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function tomlKey(value: string): string {
  return SAFE_NAME.test(value) ? value : tomlString(value);
}

function tomlValue(value: unknown): string | undefined {
  if (typeof value === "string") return tomlString(value);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return `[${value.map((item) => tomlString(item)).join(", ")}]`;
  }
  return undefined;
}

function renderFlatToml(record: RecordValue): string[] {
  return Object.keys(record)
    .sort()
    .flatMap((key) => {
      const rendered = tomlValue(record[key]);
      return rendered === undefined ? [] : [`${tomlKey(key)} = ${rendered}`];
    });
}

function pickSupported(record: RecordValue, supported: Set<string>): RecordValue {
  return Object.fromEntries(
    Object.entries(record).filter(([key, value]) =>
      supported.has(key) && tomlValue(value) !== undefined,
    ),
  );
}

function assertNoEmbeddedMcpCredentials(name: string, server: RecordValue): void {
  const url = typeof server.url === "string" ? server.url : "";
  if (
    /:\/\/[^/@\s]+:[^/@\s]+@/.test(url) ||
    /[?&](?:access_?token|api_?key|auth|password|secret)=/i.test(url)
  ) {
    throw new Error(
      `MCP server ${name} contains credentials in its URL; use runtime environment configuration instead`,
    );
  }

  const args = Array.isArray(server.args) ? server.args : [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = String(args[index]);
    const sensitiveFlag =
      /^(?:--?(?:access-?token|api-?key|auth|bearer|password|secret))(?:=|$)/i;
    if (!sensitiveFlag.test(argument)) continue;
    const inlineValue = argument.includes("=") ? argument.split("=").slice(1).join("=") : "";
    const nextValue = inlineValue || String(args[index + 1] || "");
    if (nextValue && !/^\$\{?[A-Z_][A-Z0-9_]*\}?$/.test(nextValue)) {
      throw new Error(
        `MCP server ${name} contains a literal credential argument; use an environment variable reference instead`,
      );
    }
  }
}

function renderSkill(
  name: string,
  asset: RecordValue,
  command: boolean,
): string {
  const content = getAssetText(asset, ["content", "prompt"]);
  const frontmatter: RecordValue = {
    name: asset.name || name,
    description:
      asset.description || (command ? `Command: ${name}` : `Skill: ${name}`),
  };
  if (command) {
    frontmatter["user-invocable"] = true;
    if (Array.isArray(asset.triggers) && asset.triggers.length > 0) {
      frontmatter["trigger-hints"] = asset.triggers;
    }
  }
  return renderMarkdownWithFrontmatter(
    yaml.dump(frontmatter, { lineWidth: -1, noRefs: true }).trim(),
    content,
  );
}

function renderAgent(name: string, agent: RecordValue): string {
  const instructions = getAssetText(agent, ["developer_instructions", "prompt", "content"]);
  const lines = [
    `name = ${tomlString(agent.name || name)}`,
    `description = ${tomlString(agent.description || `Agent: ${name}`)}`,
    `developer_instructions = ${tomlString(instructions)}`,
  ];
  const overrides = pickSupported(
    cleanRecord(agent.codex || agent),
    CODEX_AGENT_OVERRIDE_KEYS,
  );
  lines.push(...renderFlatToml(overrides));
  return `${lines.join("\n")}\n`;
}

function renderConfig(config: RecordValue): string {
  const lines = renderFlatToml(
    pickSupported(cleanRecord(config.tools?.codex), CODEX_PROJECT_SETTING_KEYS),
  );
  const servers = cleanRecord(config.mcp?.servers);
  for (const name of Object.keys(servers).sort()) {
    assertSafeName("MCP server", name);
    const server = cleanRecord(servers[name]);
    if (server.scope && server.scope !== "project") continue;
    assertNoEmbeddedMcpCredentials(name, server);
    const safeServer = pickSupported(server, CODEX_MCP_KEYS);
    if (Object.keys(safeServer).length === 0) continue;
    if (lines.length > 0) lines.push("");
    lines.push(`[mcp_servers.${tomlKey(name)}]`, ...renderFlatToml(safeServer));
  }
  return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}

function renderAgentsMarkdown(config: RecordValue): string {
  const sections: string[] = [];
  const globalContext =
    typeof config.context?.global === "string" ? config.context.global.trim() : "";
  if (globalContext) sections.push(globalContext);

  for (const name of Object.keys(cleanRecord(config.rules)).sort()) {
    const rule = cleanRecord(config.rules[name]);
    const content = getAssetText(rule, ["content", "prompt"]).trim();
    if (!content) continue;
    assertSafeName("Rule", name);
    const scope = rule.globs
      ? `\n\nScope: ${Array.isArray(rule.globs) ? rule.globs.join(", ") : rule.globs}`
      : "";
    sections.push(`## Rule: ${name}${scope}\n\n${content}`);
  }
  return sections.join("\n\n");
}

function normalizeCodexHook(
  eventName: string,
  hook: unknown,
  index: number,
): RecordValue {
  const definition =
    typeof hook === "string" ? { script: hook } : cleanRecord(hook);
  const command =
    typeof definition.script === "string" ? definition.script.trim() : "";
  if (!command) {
    throw new Error(
      `Codex hook ${eventName}[${index}] must define a non-empty command script`,
    );
  }

  const handler: RecordValue = {
    type: "command",
    command,
  };
  if (
    typeof definition.timeout === "number" &&
    Number.isFinite(definition.timeout) &&
    definition.timeout > 0
  ) {
    handler.timeout = definition.timeout;
  }
  if (
    typeof definition.statusMessage === "string" &&
    definition.statusMessage.trim()
  ) {
    handler.statusMessage = definition.statusMessage.trim();
  }

  const matcher =
    typeof definition.matcher === "string" && definition.matcher.trim()
      ? definition.matcher.trim()
      : Array.isArray(definition.tools) && definition.tools.length > 0
        ? definition.tools.map(String).join("|")
        : undefined;
  return {
    ...(matcher ? { matcher } : {}),
    hooks: [handler],
  };
}

function renderCodexHooks(hooks: unknown): RecordValue {
  const canonicalHooks = cleanRecord(hooks);
  const nativeHooks: RecordValue = {};
  for (const eventName of Object.keys(canonicalHooks).sort()) {
    const definition = canonicalHooks[eventName];
    const definitions = Array.isArray(definition) ? definition : [definition];
    if (definitions.length === 0) {
      throw new Error(`Codex hook event ${eventName} must not be empty`);
    }
    nativeHooks[eventName] = definitions.map((hook, index) =>
      normalizeCodexHook(eventName, hook, index),
    );
  }
  return { hooks: nativeHooks };
}

function writeCapabilities(
  config: RecordValue,
  outputDir: string,
  field: "skills" | "commands",
): void {
  const assets = cleanRecord(config[field]);
  for (const name of Object.keys(assets).sort()) {
    assertSafeName(field === "skills" ? "Skill" : "Command", name);
    const asset = cleanRecord(assets[name]);
    const content = getAssetText(asset, ["content", "prompt"]);
    if (!asset.description && !content.trim()) continue;
    const skillDir = path.join(outputDir, ".agents", "skills", name);
    writeTextFile(
      path.join(skillDir, "SKILL.md"),
      renderSkill(name, asset, field === "commands"),
    );
    writeSupportFiles(path.join(skillDir, "references"), asset.references);
    writeSupportFiles(path.join(skillDir, "scripts"), asset.scripts);
    writeSupportFiles(path.join(skillDir, "assets"), asset.assets);
  }
}

/**
 * Generates only project-scoped Codex assets. Unsupported Canonical and Codex
 * fields are deliberately omitted instead of being translated into invented
 * runtime keys.
 */
export async function generate(config: RecordValue, outputDir: string): Promise<void> {
  const agentsMarkdown = renderAgentsMarkdown(config);
  if (agentsMarkdown) {
    generateMarkdownFile(path.join(outputDir, "AGENTS.md"), agentsMarkdown);
  }

  writeCapabilities(config, outputDir, "skills");
  writeCapabilities(config, outputDir, "commands");

  for (const name of Object.keys(cleanRecord(config.agents)).sort()) {
    assertSafeName("Agent", name);
    const agent = cleanRecord(config.agents[name]);
    if (!agent.description && !getAssetText(agent, ["developer_instructions", "prompt", "content"]).trim()) {
      continue;
    }
    writeTextFile(
      path.join(outputDir, ".codex", "agents", `${name}.toml`),
      renderAgent(name, agent),
    );
  }

  const codexConfig = renderConfig(config);
  writeTextFile(path.join(outputDir, ".codex", "config.toml"), codexConfig);

  if (Object.keys(cleanRecord(config.hooks)).length > 0) {
    writeTextFile(
      path.join(outputDir, ".codex", "hooks.json"),
      `${JSON.stringify(renderCodexHooks(config.hooks), null, 2)}\n`,
    );
  }
}
