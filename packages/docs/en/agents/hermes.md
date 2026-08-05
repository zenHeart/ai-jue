# Hermes

> Jue status: Read, Write, and Confirm are Implemented (JUE-303,
> `packages/ai-jue-adapter-hermes/`). **workspace** ships; optional thin
> `skill-plugin` (RFC-0002 Phase B) also ships. Official Hermes “plugins” use
> `plugin.yaml` + Python `register(ctx)` runtime extensions, and the thin Artifact
> follows that official plugin.yaml surface.
> `capabilities` honestly declare `rules/hooks: "unsupported"`,
> `commands/agents: "degraded"`, `skills/mcp: "supported"`. Extra `cron`
> remains outside the six atomic types (see implementation-status).
>
> Official sources: [Plugins](https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins),
> [Build a Hermes Plugin](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin),
> [Hermes Agent](https://github.com/NousResearch/hermes-agent)

## 1. Official surface

Verified in JUE-303 against a real Hermes install (`~/.hermes/`): the
project-level surface is `MEMORY.md` (shared context, semantically similar to
Claude's `CLAUDE.md`), `skills/<category>/<name>/SKILL.md` (three levels deep,
deeper than the one level used by Claude/Codex/OpenClaw), `config.yaml`'s
`mcp.servers`, and `cron/jobs.json`. The installed `~/.hermes/hooks/` directory
is part of the observed runtime surface; `hooks_auto_accept` is a session-level
policy. `agent:`/`commands:` are global `config.yaml` runtime blocks. Hermes also
offers plugins, ACP, TUI Gateway JSON-RPC, and an OpenAI-compatible HTTP API;
these runtime integration surfaces are tracked as Agent-specific surfaces, with
implementation status recorded by the Adapter documentation.

## 2. Intended Jue mapping

| Canonical / Facet | Hermes |
| --- | --- |
| `context.global` | `MEMORY.md` (managed block) |
| `skills` | `skills/<category>/<name>/SKILL.md` (three levels) |
| `mcp.servers` | `config.yaml`'s `mcp.servers` |
| `cron` (Hermes-specific extra field alongside the six atomic Capability types) | Full-file pass-through of `cron/jobs.json` |
| `rules` / `hooks` | Honestly `unsupported`: no per-workspace surface |
| `commands` / `agents` | Honestly `degraded`: the like-named block in `config.yaml` is global runtime policy; read/write are no-ops |
| target-specific settings | `tools.hermes` |
| Artifact | `workspace` (skills+mcp); `skill-plugin` (`plugin.yaml` + register_skill-only `__init__.py` + flat `skills/`; mcp stays on workspace) |
| Confirm | Workspace: `tirith config validate`; skill-plugin: structural evidence from `plugin.yaml`, the `register_skill` initializer, and skill roots |

## 3. Conversion boundary

- Hermes general plugins may register Python tools/hooks/commands/platforms;
  `skill-plugin` selects the `register_skill` capability as a lightweight
  distribution surface for Canonical skills.
- To distribute skills: `skill-plugin` generates `register_skill` boilerplate
  plus flat `skills/`; mcp/context stay on workspace apply.
- ACP, Gateway, and HTTP are Transport/Runtime facets alongside the Capability set.
- Self-learning, memory, profile, and session state remain Agent runtime state;
  reusable Presets focus on portable Capability data.
- `cron` is the Adapter's Agent-specific pass-through field beyond the six atomic
  Capability types. The implementation-status page records its mapping boundary;
  a future RFC can freeze its long-term ownership.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read | Implemented | JUE-303, `packages/ai-jue-adapter-hermes/src/read.ts` |
| Write | Implemented | JUE-303, driven by the Core executor |
| Artifact | Implemented | `workspace` + thin `skill-plugin` (skills / `plugin.yaml` / `register_skill`; MCP stays on workspace); runtime extensions follow the official Hermes surface |
| Confirm | Implemented | Workspace: real `tirith config validate`; skill-plugin: structural evidence from the generated plugin surface |
