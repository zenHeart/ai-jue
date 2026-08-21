import { defineExtension } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { confirm } from "./confirm";
import { read } from "./read";
import { write } from "./write";

const codexAdapter: Adapter = {
  id: "codex",
  capabilities: {
    rules: "degraded", // Codex has no separate Rules directory; rules fold into AGENTS.md via context
    commands: "degraded", // Codex's custom-commands was deprecated; this is documented honestly
    skills: "supported",
    agents: "supported",
    hooks: "supported",
    // Project MCP stays TOML-degraded; Plugin Artifacts write portable `.mcp.json`.
    mcp: "degraded",
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [codexAdapter] });
