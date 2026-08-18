import { defineExtension } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { confirm } from "./confirm";
import { read } from "./read";
import { write } from "./write";

const cursorAdapter: Adapter = {
  id: "cursor",
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

export default defineExtension({ adapters: [cursorAdapter] });
