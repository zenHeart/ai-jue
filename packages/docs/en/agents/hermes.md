# Hermes

> Jue status: Read, Write, and Confirm are all Implemented (JUE-303,
> `packages/ai-jue-adapter-hermes/`); Artifact only implements a single
> workspace directory form and does not cover the Hermes Plugin. `capabilities`
> honestly declares `rules/hooks: "unsupported"` (no equivalent per-workspace
> surface), `commands/agents: "degraded"` (no-op pass-through), and
> `skills/mcp: "supported"`. The Adapter also carries an extra `cron` field
> (a full-file pass-through of `cron/jobs.json`) that is not one of the six
> atomic Capability types — it is a Hermes-specific optional field newly added
> to `CanonicalDocumentSchema`, and whether it should be formally adopted (or
> handled some other way) is still an open architecture question pending an
> RFC (see the "Not yet implemented" section of implementation-status.md)
>
> Official sources: [Hermes Agent](https://github.com/NousResearch/hermes-agent),
> [Hermes example plugins](https://github.com/NousResearch/hermes-example-plugins),
> [Programmatic Integration](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/developer-guide/programmatic-integration.md)

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
| Artifact | Single workspace directory form; the Hermes Plugin is not yet covered |
| Confirm | Real `tirith config validate <projectRoot>` (the `tirith` binary, run against an isolated temp HOME) |

## 3. Conversion boundary

- Hermes Plugin runtime code, tools, platform adapters, and UI cannot be
  converted automatically across Agents; this Adapter also does not yet
  generate a Plugin-form Artifact.
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
| Artifact | Partial | Workspace directory form only; the Hermes Plugin aggregate is not yet implemented |
| Confirm | Implemented | Real `tirith config validate` (replayable via `scripts/verify-hermes-native.js`, requires the real `tirith` binary on PATH); honestly reports `unconfirmed` when there is no aggregate to confirm at project scope |
