# OpenClaw

> Jue status: Read, Write, and Confirm are all Implemented (JUE-302,
> `packages/ai-jue-adapter-openclaw/`); Artifact only implements a single
> per-workspace directory form — OpenClaw has no installable Plugin/Bundle
> aggregate (see the empirically-verified "Official surface" below, which
> corrects this page's earlier assumption of a native-plugin/compatible-bundle
> dual form). `capabilities` honestly declares four degraded boundaries:
> `rules`/`commands`/`agents`/`mcp`
>
> Official sources: [Capabilities Overview](https://docs.openclaw.ai/tools),
> [Plugin Bundles](https://docs.openclaw.ai/plugins/bundles),
> [Plugin Manifest](https://docs.openclaw.ai/plugins/manifest)

## 1. Official surface

Verified in JUE-302 by directly reading a real
`~/.openclaw/workspace-jue-probe/` and `~/.openclaw/openclaw.json`: OpenClaw's
project-level (workspace) surface is limited to `AGENTS.md` (shared
instructions), `skills/<name>/SKILL.md` (one level, not nested), and
`hooks/<name>/HOOK.md` + `handler.js`. There is no per-workspace
`commands/`/`agents/` directory: the top-level `commands` key in
`openclaw.json` configures OpenClaw's own native shell-command behavior
(`commands.native`/`commands.restart`/etc.), not user-authored slash-commands;
`openclaw agents add/list/delete` manages isolated runtime environments under
the user home at `~/.openclaw/agents/<name>/`, not project files. MCP
configuration is global-only, living in `~/.openclaw/openclaw.json`'s
`mcp.servers` — there is no project-scoped file. OpenClaw has no Plugin or
Bundle-style installable aggregate — the project-level config is the only
native Artifact form.

## 2. Intended Jue mapping

| Canonical / Facet | OpenClaw |
| --- | --- |
| `context.global` | `AGENTS.md` (managed block) |
| `skills` | `skills/<name>/SKILL.md` (one level) |
| `hooks` | `hooks/<name>/HOOK.md` + `handler.js` |
| `commands` / `agents` / `mcp.servers` | All honestly `degraded`: no per-workspace surface, so read/write are no-ops (avoids mutating the operator's global `openclaw.json`) |
| target-specific settings | `tools.openclaw` |
| Artifact | project/workspace directory (no Plugin/Bundle aggregate) |
| Confirm | `openclaw --profile <isolated> config validate --json` |

## 3. Conversion boundary

- `commands`/`agents`/`mcp` all have no-op writes: OpenClaw has no
  per-workspace native surface for any of the three, and writing would risk
  mutating the operator's global config, so the Adapter chooses an honest
  `degraded` stance over fabricated support.
- Jue never infers executable code from an ordinary skill or rule; OpenClaw
  also exposes no such Plugin-loading mechanism for an Adapter to target.
- Hook `HOOK.md` frontmatter expresses trigger events via a
  `metadata.openclaw.events` array, a different shape from Claude/Codex's
  flat event-name field — hand-parsed to match the real native shape.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read | Implemented | JUE-302, `packages/ai-jue-adapter-openclaw/src/read.ts` |
| Write | Implemented | JUE-302, driven by the Core executor; `jue apply --adapter openclaw --dry-run/--check` verified working |
| Artifact | Partial | Workspace directory form only; OpenClaw itself has no Plugin/Bundle concept, so this is not an Adapter gap |
| Confirm | Implemented | Real `openclaw --profile <isolated> config validate --json` (replayable via `scripts/verify-openclaw-native.js`); an empirical quirk produces empty stdout when invoked from inside a vitest worker, so the contract suite does not call `confirmNatively` in-suite — native confirmation lives in the standalone script |
