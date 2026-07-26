# Claude Code fixtures (JUE-105)

Minimal, neutral, offline-reproducible native fixtures for the Claude Code
Reference Extension (R1). Probed against `claude` CLI `2.1.219` on
2026-07-26. Every claim below was verified by actually running the listed
command against the fixture in this directory — not assumed from prior
documentation.

> These fixtures supersede a few claims from the JUE-104 discovery report
> that turned out to be imprecise once checked against the real CLI (see
> "Corrections found while building this fixture" below). Treat this README,
> not the JUE-104 chat report, as the source of truth for exact schema shapes.

## Coverage matrix

| Directory | Artifact kind | Canonical Capability covered | Purpose |
| --- | --- | --- | --- |
| `project/` | project-native `.claude/` config | `context.global` (via `CLAUDE.md` + `@AGENTS.md` import), `rules`, `commands`, `agents`, `skills`, `hooks`, `mcp.servers` (flat shape) | One positive sample per atomic Capability, outside any Plugin |
| `plugin/` | Plugin, manifest present | `skills`, `commands`, `agents`, `hooks`, `mcp.servers` (wrapped `mcpServers` shape) | Same six Capability types packaged as an installable Plugin; also carries every target-private field below |
| `plugin-auto-discovered/` | Plugin, **no** manifest | `skills` | Proves manifest-optional runtime auto-discovery (see finding below) |
| `marketplace/` | marketplace index | — | Shows a marketplace entry carrying a field (`lspServers`) that would otherwise live in a Plugin's own manifest |
| `conflicts/` | Plugin, manifest present | `skills` + `commands` sharing one name | Same-name skill/command collision; native `validate` does not flag it |
| `failures/empty-skill/` | bare skill component (no manifest; not meant to be validated as an installable Plugin) | `skills` | Empty skill body — exercises Jue's own `requireCapabilityBody` invariant, not a native Claude Code failure |
| `failures/invalid-hook-event/` | Plugin, manifest present | `hooks` | Native `claude plugin validate` failure: invalid hook event name. Jue's `read()` (JUE-106) does **not** re-validate event names — it passes `NotARealEvent` through as data, since Canonical's `HookSchema` does not enumerate valid Claude event names either; that enumeration is Claude's own job via `plugin validate` |
| `failures/unsafe-path-reference/` | Plugin, manifest present | `hooks` | Hook `command` referencing a path outside the Plugin boundary; neither native `validate` nor Jue's `read()` (JUE-106) flags it — hook `command` is an opaque shell string to both, not a structured path, so Jue does not attempt shell-string path sanitization |
| `failures/sensitive-reference/` | bare MCP component (no manifest) | `mcp.servers` | Literal-looking secret in an env value instead of a `${VAR}`/`${user_config.KEY}` reference — rejected by `assertNoLiteralCredentials` in `packages/ai-jue-core/src/security.ts`, shared by Capability Source resolution and every Adapter's `read()` |

Target-private fields (preserved as-is by the Adapter, never entering
Canonical) are covered inside `plugin/`: `dependencies`, `userConfig`,
`.lsp.json` (`lspServers`), `output-styles/`, `workflows/`, `themes/`, `bin/`.

## Native → Canonical (JUE-106)

`packages/ai-jue-adapter-claude/src/read.ts` implements `read()` against
every fixture above; see `test/read.test.ts` for the exact expected
`CanonicalDocument` shape per fixture. One additional finding surfaced while
implementing it — not caught by the CLI-only JUE-105 pass, since it only
shows up once you actually parse the JSON programmatically and reuse Jue's
own credential guard against it: `${user_config.KEY}` (Claude Code's Plugin
`userConfig` injection syntax, used by `plugin/.mcp.json`'s `GREETING` value)
is a legitimate non-literal placeholder, distinct from a `${ENV_VAR}` runtime
reference. `assertNoLiteralCredentials` initially rejected it as a literal
credential; it now accepts both forms.

## Reproduce (safe, no API calls)

```bash
cd packages/ai-jue-adapter-claude/fixtures

# Well-formed Plugin: passes, including --strict
claude plugin validate ./plugin --strict

# Auto-discovered Plugin (no plugin.json): validate REQUIRES a manifest and fails
claude plugin validate ./plugin-auto-discovered

# Skill/command name collision: validate passes — the collision is silent
claude plugin validate ./conflicts

# Invalid hook event name: real, reproducible failure
claude plugin validate ./failures/invalid-hook-event
# -> "hooks.NotARealEvent: Invalid key in record", exit 1

# Unsafe path reference in a hook command: validate passes — Claude Code does
# not evaluate command strings, so this is a Jue Read-side concern only
claude plugin validate ./failures/unsafe-path-reference
```

`claude plugin validate` makes no network/model call; every command above is
free and deterministic.

> ⚠️ Headless `claude -p ... --plugin-dir <path> --output-format stream-json`
> **is a real, billed model call** even with `--tools ""` — see "Corrections"
> below. Do not run it repeatedly while iterating on a fixture; reserve it for
> the JUE-109 native-usability gate where a single deliberate run is
> budgeted.

## Corrections found while building this fixture

The JUE-104 discovery report (produced by a separate read-only research
agent) got most of the capability surface right, but a few specifics were
wrong or imprecise once checked against the real CLI:

1. **`hooks.json` needs an outer `"hooks"` key.** The file is
   `{"hooks": {"<Event>": [...]}}`, not `{"<Event>": [...]}` at the top
   level — the same shape as the `hooks` key inside `settings.json`, not a
   bare event map.
2. **`dependencies` in `plugin.json` is an array of `"name@range"` strings**,
   not an object map (`claude plugin validate` rejects the object form with
   `Invalid input: expected array, received object`).
3. **`userConfig.<KEY>` requires a `title` string field**, not just
   `type`/`description`/`default`.
4. **`agent` and `subagentStatusLine` are not real `plugin.json` fields.**
   `claude plugin validate` reports them as unknown/unrecognized (a warning,
   not an error) and states Claude Code ignores them at load time. The
   JUE-104 report's claim that these are legitimate default-setting keys is
   wrong; drop them from any fixture or Adapter mapping.
5. **`claude plugin validate` requires a manifest** (`plugin.json` or
   `marketplace.json`) and fails a manifest-less directory with `No manifest
   found in directory`. However, **`--plugin-dir` at runtime does perform
   manifest-optional auto-discovery** — a real headless run against
   `plugin-auto-discovered/` (no `.claude-plugin/` at all) reported it in
   `system/init` as `{"name":"plugin-auto-discovered", "source":
   "plugin-auto-discovered@inline"}` with `auto-skill` listed under both
   `skills` and `slash_commands`. So: manifest-optional discovery is a
   `--plugin-dir`/runtime-loading behavior, not something `claude plugin
   validate` itself performs — JUE-106/109 must not conflate the two paths.
6. **The "zero-cost headless" pattern from JUE-104 does not hold in
   general.** Running
   `claude -p "hi" --plugin-dir ./plugin-auto-discovered --output-format
   stream-json --verbose --tools "" --setting-sources ""` produced a normal
   assistant reply and a real charge (`total_cost_usd: 0.0394407`), because a
   prompt that does not require a tool still gets a real model turn even
   with `--tools ""`. `--tools ""` only removes tool availability; it does
   not by itself make the CLI short-circuit before calling the model. JUE-109
   must pick (and budget for) a prompt that is guaranteed to need a
   now-unavailable tool, and must not assume any `--tools ""` invocation is
   free.

## JUE-109 native usability verification

`scripts/verify-claude-native.js` (repo root) is the reproducible script for
this gate. It builds a dedicated, minimal Plugin fixture through the real
`write()`/`applyChangesOrThrow()` path (one deterministic command, no
skills/agents/hooks/MCP — kept deliberately narrow so `--bare`'s known
`agents`/`mcp_servers` inventory gap, below, cannot mask a real failure),
then runs three checks. The first two need no auth or network call; the
third needs Claude Code to authenticate in `--bare` mode:

1. `claude plugin validate --strict` passes.
2. A forced mid-batch write failure (a second change's parent path collides
   with an existing plain file) is rolled back by
   `packages/ai-jue-core/src/core-executor.ts`'s `applyExecution`, and the
   fixture is re-validated with the same real `claude plugin validate
   --strict` afterward to prove it was left uncorrupted — not just an
   internal assertion.
3. `claude --bare -p "/jue-109-verify:status" --plugin-dir <fixture>
   --output-format stream-json --verbose --allowedTools ""`: the `system/init`
   event's `plugins` array contains `jue-109-verify` at the fixture's path,
   `plugin_errors` carries no entry for it, `slash_commands` contains
   `jue-109-verify:status`, and the final `result` event is
   `{"is_error": false, "result": "JUE-109-OK", ...}` — the deterministic
   marker text, proving the generated command was actually discovered *and*
   invoked, not merely present as a file. Real cost for this run:
   `total_cost_usd` in the $0.003–$0.005 range per invocation (see "Corrections
   found while building this fixture" above — no `--tools`/`--allowedTools`
   value guarantees a free call).

### Corrections found while building this verification

1. **`--bare` requires an explicit key/token; OAuth and the OS keychain are
   never read in `--bare` mode.** `claude --help` states this plainly (`--bare
   ... strictly ANTHROPIC_API_KEY or apiKeyHelper via --settings`). A machine
   with working interactive/keychain-based `claude` auth still gets
   `"Not logged in · Please run /login"` (`total_cost_usd: 0`, no charge) from
   `--bare -p` without one of those set. This session's run set
   `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN` for an Anthropic-API-compatible
   third-party backend (Moonshot Kimi, via the operator's own local
   `cc-switch`-style profile switcher — not part of this repo) to get past
   this; any backend reachable through those two variables (or a plain
   `ANTHROPIC_API_KEY`) verifies the same thing, since this gate exercises
   Claude Code's own Plugin/Extension loading and slash-command dispatch, not
   which model answers the deterministic prompt.
2. **`--bare` does not isolate the Plugin surface from the operator's real
   environment.** The same `system/init` `plugins` array also listed every
   other real Plugin installed under `~/.claude/plugins/` on the machine that
   ran this verification, alongside the fixture. `--bare`'s own `--help` text
   ("skip hooks, LSP, plugin sync, attribution, auto-memory, background
   prefetches, keychain reads") does not claim to isolate the Plugin cache
   either — this fixture's own `--plugin-dir` entry is what's isolated
   (a fresh, disposable directory), not the rest of the session's Plugin
   surface. Treat any `system/init` inventory captured this way as "this
   fixture's entry plus noise from whatever else is installed," and match on
   the fixture's own `name`/path rather than asserting an exact `plugins`
   list length.
3. **`plugin_errors` is absent from `system/init` (not an empty array) when
   nothing failed to load**, at least on `claude` CLI `2.1.219`. Code
   consuming this event should check for a non-empty array/absence of
   entries for the target Plugin, not assume the key is always present.

### Not exercised here (deferred beyond R1)

The known `--bare` gap from the "Headless 原生确认路径" section above
(`agents`/`mcp_servers` silently drop out of `system/init` under `--bare`)
means this run does not verify a Plugin's `agents`/`mcp.servers` surviving
headless inventory — only `commands` (structurally identical to `rules`/
`agents`/flat-file capabilities already covered by the read()/write()
equivalence tests). Monitor, Theme, and Channel runtime behavior, `claude
plugin eval`, private/enterprise marketplace distribution, and
managed/enterprise scope remain unverified, as documented above for JUE-104/
105 — this fixture does not claim otherwise.

## JUE-110 Claude MVP Gate: one-command full-loop replay

`scripts/verify-claude-mvp-gate.js` (repo root) replays the entire R1 loop —
native fixture → Canonical → Artifact → native confirmation — as one command
from a clean, disposable output directory:

1. `read()` the real `project/` native fixture above (not a purpose-built
   minimal one — this is the same fixture JUE-105/106/107's own tests use) →
   Canonical, checked against `CanonicalDocumentSchema`.
2. Drop `context.global` before converting to a Plugin: Claude Code Plugins
   have no CLAUDE.md-equivalent mechanism, so `write()` never emits
   `context.global` for `artifactKind: "plugin"` (consistent with `plugin/`'s
   own coverage matrix above, which never claims context coverage either).
   This is a documented Artifact-kind boundary, not a bug uncovered by this
   script — the `project/` fixture used here happens to carry `context.global`
   since it is a project fixture, so building this replay is what surfaced
   the need to state the boundary explicitly.
3. Add one purpose-built, tool-free, deterministic command (same precedent
   as JUE-109) alongside the fixture's own six-capability content, so the
   live-invocation step has something safe and unambiguous to check without
   altering any of the real fixture content used for the equivalence check.
4. `write()` the result into a fresh temp directory as a Plugin;
   `applyChangesOrThrow` (Core apply).
5. `claude plugin validate --strict` passes.
6. `read()` the result again; `assert.deepStrictEqual` against the
   pre-write Canonical (the `normalize(read(write(read(N))))=normalize(read(N))`
   contract, exercised end-to-end in this one run rather than split across
   separate unit tests).
7. A second `write()` call against the same Canonical produces zero changes
   (idempotent).
8. `claude --bare -p "/jue-110-mvp-gate:mvpGateProbe" --plugin-dir <fixture>
   --output-format stream-json --verbose --allowedTools ""`: `system/init`
   shows the Plugin loaded with no `plugin_errors` entry for it and the probe
   command in `slash_commands`; the final `result` is the deterministic
   marker text, proving real discovery and invocation. Real cost around
   $0.005 per run — same auth requirement and `--bare` caveats as JUE-109
   (see above); the fixture's real (non-functional) `mcp.servers` entry
   (`neutral-fixture-server`, referencing a `node server.js` that does not
   exist) was confirmed **not** to block or hang this invocation — Claude
   Code does not eagerly connect to a Plugin's MCP servers merely from
   `--plugin-dir` loading them.

Steps 1–7 need no auth or network call and always run; step 8 is skipped
(not failed) without `ANTHROPIC_API_KEY` or `ANTHROPIC_BASE_URL` +
`ANTHROPIC_AUTH_TOKEN` set, same as `verify-claude-native.js`.
