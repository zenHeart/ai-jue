# ai-jue-adapter-openclaw

OpenClaw-shaped Adapter for the `ai-jue` framework (JUE-302). Built off
the real `openclaw 2026.5.5` native shape discovered on this machine:

- **Workspace skills** at `<workspace>/skills/<name>/SKILL.md` with
  `name` / `description` frontmatter (verified by reading
  `~/.openclaw/workspace-jue-probe/skills/jue-probe-skill/SKILL.md` and
  `~/.openclaw/skills/lark-im/SKILL.md`).
- **Workspace hooks** at `<workspace>/hooks/<name>/HOOK.md` +
  `handler.js` (CommonJS `module.exports = async function handler(event)`,
  `metadata.openclaw.events` is an array like `["command:new"]`).
- **Workspace context** at `<workspace>/AGENTS.md`.
- **Global MCP** at `~/.openclaw/openclaw.json` top-level `mcp.servers`
  (no project-scoped MCP file — JUE-104/105/JUE-302 Phase 1 confirmed).

`commands` and `agents` top-level keys in `openclaw.json` are NOT
project-scoped; they're the same global `openclaw.json` file. We treat
both as honestly `degraded` (canonical `commands` is a separate directory
in Claude/Codex surface shape; canonical `agents` is a per-file TOML in
Codex — neither has a per-workspace file in OpenClaw). `rules` is
`degraded` for the same reason as Codex: OpenClaw has no separate rules
directory.

Native confirmation: real `openclaw --profile <isolated> config validate --json`
round-trip (the strongest native validator OpenClaw 2026.5.5 offers
without starting the gateway). Mirrors the Claude and Codex approaches.

## Build / test

```bash
npm run build
npm test
node scripts/verify-openclaw-native.js
```

See `packages/docs/developer/delivery-plan.md` R3 / JUE-302 for the full
handoff evidence.
