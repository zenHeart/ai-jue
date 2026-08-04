# OpenClaw

> Jue status: Read, Write, and Confirm are Implemented (JUE-302,
> `packages/ai-jue-adapter-openclaw/`). **workspace** and
> **`compatible-bundle`** (RFC-0002) both ship — the latter **delegates** to
> Claude/Codex plugin writers and does not invent a third directory dialect.  
> Native OpenClaw plugins (`openclaw.plugin.json` + in-process runtime) are out
> of scope for Canonical capability packs.  
> Workspace `capabilities` honestly declare
> `rules`/`commands`/`agents`/`mcp: "degraded"`.
>
> Official sources: [Plugin bundles](https://docs.openclaw.ai/plugins/bundles),
> [Plugins](https://docs.openclaw.ai/tools/plugin),
> [Building plugins](https://docs.openclaw.ai/plugins/building-plugins),
> [Plugin Manifest](https://docs.openclaw.ai/plugins/manifest)

## 1. Official surfaces (two layers)

### 1.1 Workspace (project tree — JUE-302 verified)

`AGENTS.md`, `skills/<name>/SKILL.md`, `hooks/<name>/HOOK.md`+`handler.js`.  
No per-workspace `commands/`/`agents/`; `openclaw agents *` manages
`~/.openclaw/agents/<name>/`; MCP lives in global `openclaw.json`.

### 1.2 Installable plugins (current docs)

| Format | Marker | Role |
| --- | --- | --- |
| Compatible bundle | `.claude-plugin/` / `.codex-plugin/` / `.cursor-plugin/` (or default Claude layout) | Content packs; mapped skills/hooks/MCP; **narrow trust boundary** |
| Native plugin | `openclaw.plugin.json` + `package.json#openclaw.extensions` | In-process tools/channels/providers |

```bash
openclaw plugins install ./my-bundle
openclaw plugins list    # bundles show Format: bundle + Bundle format
openclaw plugins inspect <id>
```

Detection precedence: native markers win over bundle markers when both exist.

Bundle mapping highlights:

- skills: all formats  
- Claude/Cursor `commands/` → skill roots  
- hooks: only OpenClaw-style `HOOK.md`+handler execute (mainly Codex-compatible packs); Claude `hooks/hooks.json` is detect-only  
- agents: often detect-only for Claude/Cursor  
- MCP: merged into embedded settings

## 2. Intended Jue mapping

| Canonical / Adapter duty | OpenClaw |
| --- | --- |
| `context.global` | Workspace: `AGENTS.md` (managed block) |
| `skills` | Workspace: `skills/<name>/`; Bundle: Claude/Codex plugin layout |
| `hooks` | Workspace: `HOOK.md`+`handler.js`; Bundle: prefer Codex base to execute |
| `commands` / `agents` / `mcp.servers` | Workspace: honest `degraded`; Bundle: per official mapping / detect-only |
| Artifact | `workspace` \| `compatible-bundle` (RFC-0002) |
| Confirm | Workspace: `openclaw --profile … config validate`; Bundle: `plugins install` + `inspect` (`Format: bundle`) |

## 3. Conversion boundary

- Workspace path must not write global `openclaw.json` MCP.
- `compatible-bundle` must not invent a new tree; delegate to Claude/Codex
  `artifactKind: "plugin"`.
- Do not generate native `openclaw.plugin.json` runtimes for Canonical packs
  (wrong trust model and high cost).
- If hooks must run under OpenClaw, choose the Codex bundle base.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read / Write / Confirm (workspace) | Implemented | JUE-302 |
| Artifact `compatible-bundle` | Implemented | Delegates to Claude/Codex `artifactKind: "plugin"`; install confirm needs local `openclaw` CLI (often skipped in CI) |
| Native plugin Artifact | Out of scope | Not a Canonical pack path |
