import { defineExtension } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { confirm } from "./confirm";
import { read } from "./read";
import { write } from "./write";

const claudeCodeAdapter: Adapter = {
  id: "claude-code",
  supportedScopes: ["project", "user"],
  capabilities: {
    rules: "supported",
    commands: "supported",
    skills: "supported",
    agents: "supported",
    hooks: "supported",
    mcp: "supported",
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [claudeCodeAdapter] });
