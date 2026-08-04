# Hermes

> Jue status: Read, Write, and Confirm are Implemented for the **workspace**
> Artifact (JUE-303, `packages/ai-jue-adapter-hermes/`).  
> Official Hermes “plugins” are `plugin.yaml` + Python `register(ctx)` runtime
> extensions (optionally bundling skills via `ctx.register_skill`) — **not** a
> Claude-style `.xxx-plugin/plugin.json`. Canonical capability packs default to
> workspace; optional thin `skill-plugin` is RFC-0002 Phase B. Full Python
> tool/platform plugins are out of scope.  
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
`mcp.servers`, and `cron/jobs.json`. The real install's `~/.hermes/hooks/`
directory is empty — there is insufficient evidence for a hooks surface, and
`hooks_auto_accept` is a session-level policy rather than a per-workspace
hook; `agent:`/`commands:` only exist in the global `config.yaml`, not as
project-authorable files. Hermes also offers plugins, ACP, TUI Gateway
JSON-RPC, and an OpenAI-compatible HTTP API — these are runtime integration
protocols or unverified aggregate-Artifact surfaces that this Adapter does not
yet cover.

## 2. Intended Jue mapping

| Canonical / Facet | Hermes |
| --- | --- |
| `context.global` | `MEMORY.md` (managed block) |
| `skills` | `skills/<category>/<name>/SKILL.md` (three levels) |
| `mcp.servers` | `config.yaml`'s `mcp.servers` |
| `cron` (Hermes-specific extra field, not one of the six atomic Capability types) | Full-file pass-through of `cron/jobs.json` |
| `rules` / `hooks` | Honestly `unsupported`: no per-workspace surface |
| `commands` / `agents` | Honestly `degraded`: the like-named block in `config.yaml` is global runtime policy; read/write are no-ops |
| target-specific settings | `tools.hermes` |
| Artifact | `workspace` (primary); optional `skill-plugin` (RFC-0002 Phase B: yaml + register_skill-only `__init__.py` + flat skills/) |
| Confirm | Workspace: `tirith config validate`; skill-plugin: structure checks + optional isolated `hermes plugins list` (do not treat tirith as plugin-install proof) |

## 3. Conversion boundary

- Hermes general plugins may register Python tools/hooks/commands/platforms;
  Canonical text capabilities must not be auto-converted into full runtime
  plugins (high cost, wrong surface).
- To distribute skills only: Phase B `skill-plugin` generates `register_skill`
  boilerplate; mcp/context stay on workspace.
- ACP, Gateway, and HTTP are Transport/Runtime facets, not part of the
  Capability set.
- Self-learning, memory, profile, and session state do not enter a reusable
  Preset.
- `cron` is the only field this Adapter carries beyond the six atomic
  Capability types. Whether to formally adopt it (as a seventh atomic
  Capability, or as a `tools.hermes` target-private field instead) has not
  been decided via an RFC — the current implementation just honestly exposes
  a real native surface that exists, and should not be read as a settled
  architecture decision.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read | Implemented | JUE-303, `packages/ai-jue-adapter-hermes/src/read.ts` |
| Write | Implemented | JUE-303, driven by the Core executor |
| Artifact | Partial | Workspace done; `skill-plugin` planned in RFC-0002 (thin skill registration only) |
| Confirm | Implemented | Real `tirith config validate` (replayable via `scripts/verify-hermes-native.js`, requires the real `tirith` binary on PATH); honestly reports `unconfirmed` when there is no aggregate to confirm at project scope |
