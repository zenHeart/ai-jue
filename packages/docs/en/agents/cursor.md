# Cursor

> Jue status: Read, Write, Artifact (project and Plugin), Marketplace index,
> and Confirm are all
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

### 1.3 Marketplace (multi-plugin repository index)

`tools.cursor.marketplace` generates the repository-root
`.cursor-plugin/marketplace.json`. Fields verified on 2026-08-20 against the
[Cursor Plugins Reference](https://cursor.com/docs/reference/plugins) and
[official plugin-template](https://github.com/cursor/plugin-template):

- `name`: lowercase kebab-case marketplace name;
- `owner.name`: required display name, with optional `owner.email`;
- `metadata.description`, `metadata.version`, and `metadata.pluginRoot`:
  optional metadata;
- `plugins[]`: 1–500 entries; Jue's portable subset requires a unique `name`
  and local relative string `source`;
- optional `plugins[]` metadata: `description`, semantic `version`, `author`,
  `homepage`, `repository`, `license`, `keywords`, `logo` (relative path or
  HTTP(S) URL), `category`, and `tags`;
- `plugins[]` component fields: `skills`, `rules`, `agents`, and `commands`
  accept relative paths or relative-path arrays; `hooks` and `mcpServers`
  accept a relative path or JSON object; `variables` accepts a JSON object.
  Credential values use `${VAR}` placeholders.

Before writing, Jue validates every local source directory, its
`.cursor-plugin/plugin.json`, and the index-to-manifest name relation. Each
child Plugin's Capabilities are read through that child's own Artifact.

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

The Marketplace index sits at the repository root above both layouts.
`tools.cursor.marketplace` writes `.cursor-plugin/marketplace.json` without
changing project or Plugin Capability paths.

## 3. Conversion boundaries

- Skills, agents, and commands keep YAML frontmatter (`name`, `description`).
- Project hooks write `{ version: 1, hooks }`; plugin hooks write `{ hooks }` (no version).
- Hook events: Canonical PascalCase → Cursor camelCase.
- Command-based MCP servers get `type: "stdio"`.
- Empty hooks or MCP sets must not write files.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read | Implemented | project/plugin auto-detection plus marketplace index and source-manifest validation |
| Write | Implemented | `--artifact plugin` and `tools.cursor.marketplace` work |
| Artifact | Implemented | project and Plugin both implemented |
| Confirm | Implemented | no native CLI; returns `unconfirmed` |

## 5. Follow-up work (GitHub Issues)

[JUE-304](../developer/delivery-plan.md) delivered project/plugin round-trip. The items below are **out of MVP scope** and tracked separately — agents must read the full issue before implementing:

| Issue | Scope |
| --- | --- |
| [#9](https://github.com/zenHeart/ai-jue/issues/9) | OpenClaw `compatible-bundle` with Cursor layout as third base ([RFC-0002](../developer/rfcs/0002-plugin-artifact-apply.md) known-boundary 3) |
| [#10](https://github.com/zenHeart/ai-jue/issues/10) | `adapter-creator` Cursor dual-layout patterns |
| [#11](https://github.com/zenHeart/ai-jue/issues/11) | failure fixtures + security contract samples (parity with Claude [JUE-105](../developer/delivery-plan.md)) |
