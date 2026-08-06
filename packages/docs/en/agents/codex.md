# Codex

> Jue status: Read, Write, Artifact (both project and Plugin), and Confirm are
> all Implemented (`packages/ai-jue-adapter-codex/`). `capabilities` honestly
> declares three degraded boundaries: `commands: "degraded"` (the
> custom-commands mechanism is deprecated), `mcp: "degraded"` (MCP lives in
> `[mcp_servers.*]` TOML tables, outside the JSON factory's scope), and
> `rules: "degraded"` (no separate rules directory; folded into AGENTS.md)
>
> Official sources: [Codex Customization](https://developers.openai.com/codex/concepts/customization),
> [Codex Plugins](https://developers.openai.com/codex/plugins/build)

## 1. Official surface

Codex uses `AGENTS.md`, skills, custom agents, MCP, hooks, and project
`.codex/config.toml`. A Codex Plugin is an installable bundle that can combine
skills, commands, tools, MCP config, hooks, assets, apps, and marketplace metadata.

## 2. Intended Jue mapping

| Canonical / Facet | Codex |
| --- | --- |
| `context.global` / `rules` | `AGENTS.md` |
| `skills` / `commands` | `.agents/skills/*/SKILL.md` |
| `agents` | `.codex/agents/*.toml` |
| `hooks` | `.codex/hooks.json` or one canonical config form |
| `mcp.servers` | `.codex/config.toml` |
| target-specific settings | `tools.codex` |
| Artifact | project-native config or Codex Plugin (`.codex-plugin/plugin.json`) |
| Confirm | Plugin: real `codex plugin marketplace add`+`plugin add`+`plugin list --json` (isolated `CODEX_HOME`); project: no equivalent native validator, honestly reports `unconfirmed` |

## 3. Conversion boundary

`AGENTS.md` scope must survive conversion. App/runtime tools, marketplace
metadata and authorization are preserved by the Adapter or handled as Artifact install
facets. Jue manages one hook representation per layer.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read | Implemented | `packages/ai-jue-adapter-codex/src/read.ts` |
| Write | Implemented | `packages/ai-jue-adapter-codex/src/write.ts`, driven by the Core executor; `jue apply --adapter codex --dry-run/--check` verified working |
| Artifact | Implemented | Both project and Plugin (`.codex-plugin/plugin.json`) are implemented |
| Confirm | Implemented | Plugin goes through real `codex plugin marketplace add`/`plugin add`/`plugin list --json` (replayable via `scripts/verify-codex-native.js`); project scope honestly reports `unconfirmed` (an honest degradation, not a gap) |
