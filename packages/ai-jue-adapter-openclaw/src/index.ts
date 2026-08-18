import { defineExtension } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { confirm } from "./confirm";
import { read } from "./read";
import { write } from "./write";

const openclawAdapter: Adapter = {
  id: "openclaw",
  capabilities: {
    rules: "degraded", // OpenClaw has no separate rules directory
    commands: "degraded", // OpenClaw has no per-workspace commands directory
    skills: "supported",
    agents: "degraded", // OpenClaw has no per-workspace agents directory
    hooks: "supported",
    mcp: "degraded", // OpenClaw MCP is global-only; we read but don't write the user-level openclaw.json
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [openclawAdapter] });
