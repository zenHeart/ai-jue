# Claude Code

> Jue status: Read, Write, Artifact, and Confirm are all Implemented. Read and
> Write are Done (JUE-106/107); both project and Plugin Artifact kinds are
> implemented (a Marketplace aggregate index is explicitly excluded — see
> adapter-standardization.md); Core `apply`/`--dry-run`/`--check` is
> implemented (JUE-108); the full R1 loop (fixture → Canonical → Artifact →
> native confirmation, including a real headless invocation and a batch
> rollback) has been replayed end-to-end as one command (JUE-109/110);
> `confirm()` is exported and assembled into `defineExtension()`/`Adapter`
> (JUE-203): Plugin goes through real `claude plugin validate --strict`;
> project scope honestly reports `unconfirmed` (an honest degradation, not a
> gap) since it has no equivalent native validator
>
> Official sources: [Claude Code Plugins](https://code.claude.com/docs/en/plugins),
> [Plugins Reference](https://code.claude.com/docs/en/plugins-reference),
> [Skills](https://code.claude.com/docs/en/skills),
> [Sub-agents](https://code.claude.com/docs/en/sub-agents),
> [Hooks](https://code.claude.com/docs/en/hooks),
> [MCP](https://code.claude.com/docs/en/mcp),
> [Memory](https://code.claude.com/docs/en/memory),
> [Headless mode](https://code.claude.com/docs/en/headless)
>
> Probed against `claude` CLI `2.1.219` (2026-07-26).

## 1. Official surface

Claude Code supports project `.claude/` configuration and distributable
Plugins.

The Plugin manifest (`.claude-plugin/plugin.json`) is optional for
`--plugin-dir` runtime loading: when it is omitted, Claude Code auto-discovers
the default component directories by folder name and derives the Plugin name
from it (the separate `claude plugin validate` check path instead requires a
`plugin.json` or `marketplace.json` to exist — the two paths differ in
strictness). A Plugin can carry `skills/`, `commands/`, `agents/`, `hooks/`
(`hooks.json`, shaped as `{"hooks": {"<Event>": [...]}}`, or inline under the
manifest's `hooks` key), `.mcp.json`, `.lsp.json` (`lspServers`), `workflows/`,
`output-styles/`, `themes/`, `monitors/monitors.json`, `bin/`, `channels`, and
a declarative `userConfig` (each entry needs `type`/`title`/`description`,
injected via `${user_config.KEY}` and exported as
`CLAUDE_PLUGIN_OPTION_<KEY>`). The manifest can also declare `dependencies`
(an array of `"<name>@<range>"` strings — semver dependencies between
Plugins, pulling another Artifact at install time).

The CLI lifecycle spans `validate`, `install`, `enable`, `disable`, `update`,
`list`, `details`, `init`/`new`, `uninstall`/`remove`, `prune`/`autoremove`,
`tag`, `eval`, and `marketplace add/list/remove/update`.

`marketplace.json` is a separate distribution index that can carry fields
that would otherwise belong to a Plugin (for example, a Plugin without its
own `plugin.json` can have `lspServers` that only exist in its marketplace
entry). Reconstructing a Plugin's full fact surface on Read requires reading
its marketplace entry too.

Skill, Command, and Agent components share one set of frontmatter execution
fields: `context: fork`, `agent`, `background`, `hooks`, `model`, `effort`,
`disable-model-invocation`, `user-invocable`, `paths` (path-conditional
loading). These fields give a skill some agent- and hook-like behavior,
making the boundary finer-grained than Jue's six atomic Capability types.

## 2. Intended Jue mapping

| Canonical / Facet | Claude Code |
| --- | --- |
| `context.global` | `CLAUDE.md` (project root `CLAUDE.md`/`.claude/CLAUDE.md`/`CLAUDE.local.md`); Claude Code reads only `CLAUDE.md` — wiring in the root `AGENTS.md` requires a `@AGENTS.md` import inside `CLAUDE.md` |
| `rules` | `.claude/rules/*.md` (the `paths` frontmatter supports path-conditional loading; anything beyond Canonical's current unconditional semantics is preserved as a target-private field) |
| `skills` / `commands` | `.claude/skills/*/SKILL.md` and `.claude/commands/*.md` share one namespace: a later-loaded entry silently overrides an earlier same-named one, and `validate` does not flag it |
| `agents` | `.claude/agents/*.md` (project), `~/.claude/agents/*.md` (user); `agents/` inside a Plugin |
| `hooks` | the `hooks` key in `.claude/settings.json`, or a Plugin's `hooks/hooks.json` / inline manifest `hooks` |
| `mcp.servers` | project `.mcp.json`; both a flat `{"<name>": {...}}` shape and a wrapped `{"mcpServers": {...}}` shape pass official validation |
| target-specific settings | `tools.claude` (`lspServers`, `monitors`, `themes`, `output-styles`, `bin`, `workflows`, `channels`, `userConfig`, `dependencies`) |
| Artifact | project-native config, or a Claude Plugin (`.claude-plugin/plugin.json` plus component directories, manifest optional) |
| Confirm | `claude plugin validate <path> [--strict]`; headless `system/init` (see §3) |

## 3. Conversion boundary

- Read must distinguish three discovery paths: `.claude/` project
  configuration, an installed Plugin root, and in-place discovery via
  `<skills-dir>/<name>/.claude-plugin/plugin.json` (not cached, independent of
  `plugin install`).
- A Plugin's `lspServers`, `monitors`, `themes`, `output-styles`, `bin`,
  `workflows`, `channels`, `userConfig`, and `dependencies` are Claude
  Code-private fields; the Adapter preserves them as-is and they never enter
  Canonical.
- A Preset can materialize as a Plugin, but a Preset itself carries no Claude
  install state; a Plugin's `dependencies` (pulling another Artifact at
  install time) and Preset dependencies (merging assets at build time) are
  different semantics and are not mapped onto each other.
- The Plugin aggregate itself (`plugin.json` expressing identity, version,
  dependencies, and component-path redirection) corresponds to Jue's
  Artifact, not a Capability.
- Plugin scope, dependencies, cache, and permissions are Artifact install
  constraints, not Capability.
- Scope precedence: Skill/Agent is `managed/enterprise > user > project`;
  Rule is `project > user` (`CLAUDE.local.md` is a local override); Settings
  is `managed > CLI > local > project > user` (the `permissions` key merges
  rather than overrides). MCP's `local` scope is written to `~/.claude.json`,
  not `.claude/settings.local.json`; the only repository-local file Jue can
  write to is the `project`-scope `.mcp.json`.

### Headless native confirmation path

```bash
claude -p "<deterministic task>" --plugin-dir <path> \
  --output-format stream-json --verbose \
  --tools "" --setting-sources ""
```

The first `system/init` event reports the full `plugins`, `plugin_errors`,
`skills`, `slash_commands`, `agents`, and `mcp_servers` (with status)
inventory; this path is also the evidence that manifest-optional runtime
auto-discovery actually works (a manifest-less directory shows up in
`plugins` as `<dir>@inline`). **Do not add `--bare`**: it silently drops a
Plugin's `agents` and `mcp_servers` from the inventory, leaving only
built-ins. `claude plugin list`/`claude plugin details` only confirm
already-installed Plugins and do not accept `--plugin-dir`.

`--tools ""` does **not** guarantee zero cost: it only makes tools
unavailable for the turn, and if the prompt does not require a tool the model
still generates a normal reply and is billed for real (verified: the same
command above produced `total_cost_usd: 0.0394407`). Making a call actually
free requires a prompt that structurally depends on a now-unavailable tool;
`--tools ""` alone does not make the CLI short-circuit before invoking the
model. Confirm the prompt is genuinely free (or budget-approved) before using
this path for JUE-109 native verification.

JUE-109's findings from actually running this: `--bare` authentication
strictly requires `ANTHROPIC_API_KEY` or an `apiKeyHelper` via `--settings`
(it never reads OAuth/keychain), and does not isolate the Plugin surface from
whatever else is installed on the machine (the `plugins` inventory lists the
fixture alongside every other real Plugin already present). `plugin_errors`
is absent from `system/init` entirely when nothing failed to load — not an
empty array. Full evidence and a reproducible script live in
`packages/ai-jue-adapter-claude/fixtures/README.md`'s "JUE-109 native
usability verification" section and the repo-root
`scripts/verify-claude-native.js`. JUE-110 replays the same fixture →
Canonical → Artifact → native confirmation chain as one command runnable
from a clean environment, via `scripts/verify-claude-mvp-gate.js` — see that
README's "JUE-110 Claude MVP Gate" section.

## 4. Current gaps

| Level | Status | Gap |
| --- | --- | --- |
| Read | Implemented | JUE-106, see delivery-plan.md |
| Write | Implemented | JUE-107, see delivery-plan.md |
| Artifact | Implemented | Both project and Plugin are implemented; a Marketplace aggregate index is explicitly excluded (not a gap) |
| Confirm | Implemented | `confirm()` is exported and assembled into `defineExtension()`/`Adapter` (JUE-203); Plugin goes through real `plugin validate --strict` (JUE-109 headless evidence); project scope honestly reports `unconfirmed` (an honest degradation, not a gap) |
