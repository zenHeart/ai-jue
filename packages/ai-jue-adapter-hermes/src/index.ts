import { defineExtension } from "ai-jue-core";
import type { Adapter } from "ai-jue-core";
import { confirm } from "./confirm";
import { read } from "./read";
import { write } from "./write";

const hermesAdapter: Adapter = {
  id: "hermes",
  capabilities: {
    // `rules` → Hermes has no separate rules directory (uses config.yaml's
    // prefill_messages_file + toolsets instead); honestly `unsupported`.
    rules: "unsupported",
    // `commands` → Hermes has no per-workspace commands directory (the
    // `commands:` block in config.yaml is runtime policy, not user-
    // authored slash-commands); honestly `degraded` (no-op round-trip).
    commands: "degraded",
    // `skills` → real, 3-level skills/<cat>/<name>/SKILL.md shape;
    // supported via hand-written mapping.
    skills: "supported",
    // `agents` → no per-workspace agents directory; `agent:` block in
    // config.yaml is global; honestly `degraded`.
    agents: "degraded",
    // `hooks` → ~/.hermes/hooks/ is empty on the real install; the
    // `hooks_auto_accept:` block in config.yaml is session-level
    // policy. Honestly `unsupported`.
    hooks: "unsupported",
    // `mcp` → real `mcp.servers` block in config.yaml; supported
    // (hand-written YAML-aware mapping reusing computeMergedJson).
    mcp: "supported",
  },
  read,
  write,
  confirm,
};

export default defineExtension({ adapters: [hermesAdapter] });
