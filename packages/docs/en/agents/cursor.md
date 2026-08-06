# Cursor

> Jue status: Read, Write, Artifact (project and Plugin), and Confirm are all
> Implemented (`packages/ai-jue-adapter-cursor/`). Cursor has no headless Plugin
> validator; `confirm()` returns `unconfirmed` for both project and plugin, with
> structural evidence for plugin (honest downgrade, not a gap).
>
> Official references: [Cursor Rules](https://docs.cursor.com/context/rules),
> [Agent Skills](https://docs.cursor.com/context/skills),
> [Subagents](https://docs.cursor.com/context/subagents),
> [Hooks](https://docs.cursor.com/context/hooks),
> [MCP](https://docs.cursor.com/context/mcp),
> [Plugins](https://cursor.com/docs/plugins#creating-plugins)

## 1. Official surface

### 1.1 Project (workspace tree)

Root `AGENTS.md`, `.cursor/rules/*.mdc`, `.cursor/commands/*.md`,
`.cursor/skills/<name>/SKILL.md`, `.cursor/agents/<name>.md`,
`.cursor/hooks.json`, `.cursor/mcp.json`, plus `.cursor/settings.json`,
`.cursorignore`, and `.cursorindexingignore`.

### 1.2 Plugin (distributable bundle)

`.cursor-plugin/plugin.json` manifest plus root-level `rules/`, `skills/`,
`agents/`, `commands/`, `hooks/hooks.json`, and `mcp.json`. Local test path:
`~/.cursor/plugins/local/<name>` then Reload Window.

## 2. Intended Jue mapping

| Canonical / adapter duty | Project | Plugin |
| --- | --- | --- |
| manifest | — | `.cursor-plugin/plugin.json` |
| `context.global` | root `AGENTS.md` (managed block) | not mapped |
| `rules` | `.cursor/rules/*.mdc` | `rules/*.mdc` |
| `commands` | `.cursor/commands/*.md` | `commands/*.md` |
| `skills` | `.cursor/skills/*/SKILL.md` | `skills/*/SKILL.md` |
| `agents` | `.cursor/agents/*.md` | `agents/*.md` |
| `hooks` | `.cursor/hooks.json` | `hooks/hooks.json` |
| `mcp.servers` | `.cursor/mcp.json` | `mcp.json` |
| target-specific settings | `tools.cursor` | not mapped |
| `variables` | — | `plugin.json#variables` (passthrough) |
| Confirm | `unconfirmed` | `unconfirmed` (structural evidence) |

## 3. Conversion boundaries

- Skills, agents, and commands keep YAML frontmatter (`name`, `description`).
- Project hooks write `{ version: 1, hooks }`; plugin hooks write `{ hooks }` (no version).
- Hook events: Canonical PascalCase → Cursor camelCase.
- Command-based MCP servers get `type: "stdio"`.
- Empty hooks or MCP sets must not write files.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read | Implemented | auto-detect project vs plugin |
| Write | Implemented | `--artifact plugin` works |
| Artifact | Implemented | project and Plugin both implemented |
| Confirm | Implemented | no native CLI; returns `unconfirmed` |

## 5. Follow-up work (GitHub Issues)

[JUE-304](../developer/delivery-plan.md) delivered project/plugin round-trip. The items below are **out of MVP scope** and tracked separately — agents must read the full issue before implementing:

| Issue | Scope |
| --- | --- |
| [#8](https://github.com/zenHeart/ai-jue/issues/8) | `.cursor-plugin/marketplace.json` (Team marketplace index) |
| [#9](https://github.com/zenHeart/ai-jue/issues/9) | OpenClaw `compatible-bundle` with Cursor layout as third base ([RFC-0002](../developer/rfcs/0002-plugin-artifact-apply.md) known-boundary 3) |
| [#10](https://github.com/zenHeart/ai-jue/issues/10) | `adapter-creator` Cursor dual-layout patterns |
| [#11](https://github.com/zenHeart/ai-jue/issues/11) | failure fixtures + security contract samples (parity with Claude [JUE-105](../developer/delivery-plan.md)) |
