# Implementation Status

> Snapshot: 2026-08-18. Architecture and Reference are target contracts; this
> page records current facts.
>
> Current implementation path: R1 (Claude) and R2 (Scale Gate) are done; the
> R3 parallel migration (Codex, OpenClaw, Hermes) and R4's JUE-401 portable
> subset matrix are also done — see delivery-plan.md. RFC-0002: `jue apply
> --artifact` / `targets.*.artifact` are wired; OpenClaw `compatible-bundle`
> and Hermes thin `skill-plugin` have landed (see Agent profiles). Next up is
> the rest of R4 (starting with JUE-402 cross-conversion).
> RFC-0003 wires `jue apply --scope project|user` and `targets.*.scope`;
> Claude Code supports user scope and every other built-in Adapter explicitly
> remains project-only.

## CLI

| Target command | Status | Current fact | Next step |
| --- | --- | --- | --- |
| `jue init` | Partial | Interactive initialization exists | Align minimal config and no-overwrite behavior |
| `jue apply` | Partial | Core `--dry-run`/`--check`/apply follow the exit-code table; project/user scope, per-Adapter root authorization, and batch failure aggregation are implemented; Claude user-native paths are implemented and other built-ins are project-only | Finish `jue inspect` filters |
| `jue inspect` | Partial | `--extension <path> --diagnostics` is implemented: read-only report of the loaded Adapter's `id`/`capabilities`, plus a real apply-readiness check when a project config exists in cwd (JUE-203) | Implement `--capability`/`--preset`/`--target`/`--artifact` filters |
| `jue capability update` | Implemented | Updates one/all sources | Preserve lock and safety contracts |
| `jue preset create/validate/pack` | Partial | Historical commands are scattered | Converge under author namespace |
| `jue extension validate` | Partial | `--load` validates and loads an Extension (JUE-103); `--fixtures <dir>` runs `read()` + `CanonicalDocumentSchema` per subdirectory (JUE-203); the Claude Adapter now exports a real `confirm()` and is assembled as `defineExtension()` — the repo's first Extension that actually passes this check | Keep reusing it as each R3 Agent Extension lands |

Existing `format`, `validate`, `check`, `list`, and `create-preset` commands are
historical implementation to converge, not target architecture.

## Agent Adapters

| Adapter | project scope | user scope |
| --- | --- | --- |
| Claude Code | Implemented | Implemented |
| Codex / Cursor / OpenClaw / Hermes | Implemented | Undeclared; fails before writing |

| Agent | Read to Canonical DSL | Write Artifact | Native confirmation |
| --- | --- | --- | --- |
| Codex | Done | Done | Done (`packages/ai-jue-adapter-codex/`, JUE-301) — capability declaration honest about the three unsupported boundaries: `commands: "degraded"` (Codex's custom-commands mechanism deprecated per JUE-104/105/JUE-301 Phase 1), `mcp: "degraded"` (plugin writes a root `.mcp.json`; project keeps the `[mcp_servers.*]` TOML tables in `.codex/config.toml`), `rules: "degraded"` (no separate rules directory; rules fold into AGENTS.md via the `context` mapping). Native confirmation: Codex 0.145.0 has no `codex plugin validate`. `confirm()` immediately returns `unconfirmed` for non-plugin Artifacts; for plugin Artifacts it runs the real `codex plugin marketplace add <local>` + `codex plugin add <name> --marketplace <name>` + `codex plugin list --json` round-trip (isolated CODEX_HOME), asserting the Plugin is installed with `installed: true, enabled: true` — the strongest native confirmation Codex currently offers. `scripts/verify-codex-native.js` (replayable) calls `confirm()` with `artifactKind: "project"`, so it only exercises loading read/write/confirm and the project-scope `unconfirmed` path; it never invokes the real codex CLI. |
| Cursor | Done | Done | Done (`packages/ai-jue-adapter-cursor/`) — project and Plugin Artifacts; Skills/Subagents/Commands keep frontmatter; project hooks use `{ version: 1, hooks }`, plugin hooks use `{ hooks }`; command MCP servers get `type: "stdio"`; `variables` passthrough via `tools.cursor.pluginManifest`. `confirm()` returns `unconfirmed` for both kinds (plugin includes structural evidence) |
| OpenClaw | Done | Done | Done (`packages/ai-jue-adapter-openclaw/`, JUE-302) — `capabilities` honestly declares `rules/commands/agents/mcp: "degraded"` — the four real unsupported boundaries (OpenClaw has no per-workspace `commands/`/`agents/`/`rules/` directory; `openclaw agents add/list/delete` manages isolated workspaces under the user home, not as project files; MCP is global-only on `openclaw.json`). Only `skills`/`hooks` are `supported` (verified shape `~/.openclaw/workspace-jue-probe/skills/<name>/SKILL.md` + `hooks/<name>/HOOK.md+handler.js`). Native confirmation uses real `openclaw --profile jue-302-verify-<pid>-<ts> config validate --json` (isolated `--profile` to prevent global pollution, empirically passing). **One openclaw 0.145.0 quirk found and documented**: `spawnSync`/`execFileSync` from inside the vitest worker process produce empty stdout for `openclaw config validate --json` (works fine from a normal shell), so the contract suite **does not** call `confirmNatively` per the honest-degraded-stance principle; real native confirmation lives in the standalone `scripts/verify-openclaw-native.js`. `npm test` (285 passing, 5 new) |
| Hermes | Done | Done | Done (`packages/ai-jue-adapter-hermes/`, JUE-303) — `capabilities` honestly declares `rules: "unsupported"`, `hooks: "unsupported"` (the real install's `~/.hermes/hooks/` is empty — insufficient evidence), `commands: "degraded"`, `agents: "degraded"` (all no-op pass-throughs; the like-named block in `config.yaml` is global runtime policy), `skills: "supported"`, `mcp: "supported"`. Native confirmation uses the real `tirith config validate <projectRoot>` (the `tirith` binary, run against an isolated temp HOME); `scripts/verify-hermes-native.js` replays it but requires the real `tirith` binary on PATH. Fixed three real implementation bugs in the process: (1) `confirm.ts` previously concatenated the executable name and its arguments into one string passed to `execFileSync(cmd, options)` — `execFileSync` never tokenizes via a shell, so it would treat the whole spaced string as a literal executable name and always throw ENOENT regardless of whether `tirith` exists; now calls `execFileSync("tirith", ["config", "validate", projectRoot], options)`. (2) `capabilities/skills.ts`'s `write()` previously threw on any Canonical skill key without a `<category>/<name>` slash — but Canonical's `skills` schema is an unconstrained `record(string, SkillSchema)`, so any flat key coming from a Claude/Codex/OpenClaw-shaped Preset (all three use a one-level native skills directory) would make `jue apply --adapter hermes` crash outright; now falls back to a `general` category instead of rejecting, verified against the real `ai-assets` repository (27 agents, 9 skills). (3) In the same file, `references` attachment filenames previously required a single safe path segment and rejected nested paths (e.g. `references/nested/guide.md`, a shape Claude/Codex's `bundleKeys` mechanism supports); now reuses `ai-jue-core`'s already-exported `resolveSupportFilePath` (the same path-traversal-safe logic the other Adapters' `directoryPerItem` factory uses) to allow safe nested subdirectories. One open architecture question remains: the Adapter adds a `cron` field to `CanonicalDocumentSchema` (a full-file pass-through of `cron/jobs.json`) that is not one of the six atomic Capability types; whether to formally adopt it (as a seventh atomic Capability, or as a `tools.hermes` target-private field instead) has not been decided via an RFC — see "Not yet implemented" below |

Partial means local code or tests exist, not complete Agent support. See
[Agent support profiles](../agents/).

## Completed foundations (additions)

- Canonical Capability base structure and normalization.
- Recursive Preset composition with nested-resource preservation.
- Local and partial remote Capability input, lock, and update.
- Partial forward file generation for Claude Code/Codex.
- `CanonicalDocument` type/schema frozen (`context` plus the six atomic
  Capabilities); `toCanonicalDocument()` strips ProjectConfig-only fields
  (`presets`/`preset`/`extends`/`capabilities`/`tools`/`language`) so they
  never enter the Canonical output (JUE-101,
  `packages/ai-jue/src/config.ts`).
- `capabilities`' `CapabilityRef` migrated from the legacy `converter`
  (`agent-skill`/`mcp`/`jue-native`) to `type`
  (`rule`/`command`/`skill`/`agent`/`hook`/`mcp`); the directory-bundling
  `jue-native` converter was removed, so every reference now resolves exactly
  one leaf Capability (JUE-101,
  `packages/ai-jue/src/capability-source/index.ts`).
- `ArtifactChange`/`ArtifactResult`/`Confirmation` types frozen, with
  `assertArtifactChange`/`assertConfirmation` structural invariants: a safe
  relative path, hash presence matching `kind`, and `confirmed` requiring
  redacted `evidence` (JUE-102,
  `packages/ai-jue-core/src/artifact-change.ts`). `ownership`
  (`full`/`managed-block`/`merged-keys`) and `atomicState` are now documented
  in `packages/docs/reference/extension-api.md`.
- `Adapter`/`ExtensionDefinition`/`CapabilitySupport`/`defineExtension` frozen
  in `packages/ai-jue-core/src/extension-host.ts`: an Adapter exposes only
  `read`/`write`/`confirm`, and `capabilities` declares
  `supported`/`degraded`/`unsupported` per atomic Capability type (JUE-103).
- `resolveExtensionPackage`/`loadExtensionGuarded`
  (`packages/ai-jue/src/extension-loader.ts`) implement "npm trust and
  isolated loading": the default check validates npm `package.json`'s
  `exports`/`main`/`peerDependencies["ai-jue-core"]` without executing the
  entry; `--load` patches `fs` write methods, `child_process` methods,
  `process.exit`, and `fetch` during import so a disallowed call throws
  instead of running, with tests proving a malicious entry attempting a file
  write or child-process spawn is actually blocked and the file is never
  created (JUE-103).
- `jue extension validate <path-or-package> [--load]`
  (`packages/ai-jue/src/commands/extension.ts`) is wired into the CLI with
  exit codes matching `packages/docs/reference/cli/index.md` (metadata issues
  exit `2`, a thrown `--load` error exits `1`), verified against the real
  build via `node dist/cli.js extension validate`.
- Corrected a layering mistake left over from JUE-101: `CanonicalDocument` and
  its six atomic-Capability zod schemas moved from the CLI package `ai-jue` to
  `ai-jue-core` (`packages/ai-jue-core/src/canonical-document.ts`), since
  Adapters depend only on `ai-jue-core`, never the CLI package.
- Claude Code's official capability surface is verified and recorded in
  `packages/docs/{,en/}agents/claude-code.md`: a capability matrix, a scope
  precedence table, and a target-private field list, all cross-checked
  against `claude` CLI `2.1.219`'s `--help`, `plugin validate`, and headless
  `system/init` output plus official docs (JUE-104). A headless inventory
  path (`--plugin-dir` plus `--output-format stream-json`, never with
  `--bare`) is confirmed working and is reusable for JUE-109/110 native
  verification — but it does **not** guarantee zero cost (see JUE-105 below);
  confirm the prompt structurally cannot trigger a real model call before
  reusing it.
- Claude Code's minimal exhaustive fixture is built and checked against the
  real CLI (`packages/ai-jue-adapter-claude/fixtures/`, JUE-105):
  project-native config, two Plugins (with and without a manifest), a
  marketplace index, a naming-collision sample, three failure samples (empty
  skill body, invalid hook event name, a path-escaping hook command), and one
  sensitive-reference sample; every `claude plugin validate` outcome was
  re-verified against the real CLI and recorded in `fixtures/README.md`.
  Building it surfaced and corrected 5 inaccurate claims from the JUE-104
  report:
  - `hooks.json` needs an outer `"hooks"` key wrapping the event map (event
    names are not top-level);
  - `plugin.json`'s `dependencies` is an array of `"<name>@<range>"` strings,
    not an object;
  - `userConfig.<KEY>` entries require a `title` field;
  - `agent` and `subagentStatusLine` are not real `plugin.json` fields at all
    (`claude plugin validate` reports them as unknown-field warnings, and
    Claude Code ignores them at load time);
  - headless `--tools ""` does **not** guarantee zero cost: the same command
    produced a real charge of `total_cost_usd: 0.0394407`, because the model
    still generates a normal reply when the prompt does not require a tool.
    Making a call genuinely free requires a prompt that structurally depends
    on a now-unavailable tool.
  - Also confirmed: manifest-optional auto-discovery is a `--plugin-dir`
    **runtime** behavior; the separate `claude plugin validate` check path
    instead requires a `plugin.json` or `marketplace.json` to exist — the two
    must not be conflated.
- The Claude Code Adapter's `read()` (Native → Canonical) is implemented and
  passes against every JUE-105 fixture (JUE-106,
  `packages/ai-jue-adapter-claude/src/read.ts`): project vs. Plugin layout is
  auto-detected from whether `.claude/` exists; rules (`paths` frontmatter
  mapped to `globs`), commands, agents (flat `.md` files), skills (one
  directory with `SKILL.md` each), hooks (project reads `settings.json`,
  Plugin reads `hooks/hooks.json`, both normalized to the same Canonical hook
  shape), mcp.servers (both flat and wrapped native shapes normalized), and
  context.global (resolving `CLAUDE.md`'s one-level `@AGENTS.md` import).
  `packages/ai-jue-core/src/security.ts` (`assertNoLiteralCredentials`) and
  `packages/ai-jue-core/src/frontmatter.ts` (`splitFrontmatter`) are now
  shared capabilities that Capability Source and every Adapter reuse.
- The Claude Code Adapter's `write()` (Canonical → Artifact) is implemented
  (JUE-107, `packages/ai-jue-adapter-claude/src/write.ts`), sharing the same
  `packages/ai-jue-adapter-claude/src/capabilities/*.ts` declaration tables
  as `read()`, both driven through the generic engine in
  `packages/ai-jue-core/src/capability-mapping.ts`
  (`flatMarkdownDirectory`/`directoryPerItem`/`managedMarkdownFile`/
  `mergedJsonFile` covering the four native shapes, plus
  `readCapabilities`/`writeCapabilities`), so read and write for one
  Capability come from one declaration rather than two hand-written
  functions that merely happen to be inverses. `ArtifactChange` gained a
  `content` field (previously only hashes existed, leaving Core nothing to
  actually write — a JUE-102 gap this task found and fixed). Both equality
  contracts are verified with a test-only `applyChanges` scaffold
  (`normalize(read(write(C)))=normalize(C)` and
  `normalize(read(write(read(N))))=normalize(read(N))`, covering both
  project and Plugin Artifacts), plus dedicated tests for unmanaged-field
  preservation (unknown `settings.json` keys, user prose in `CLAUDE.md`) and
  zero-diff second apply. Along the way, a real bug was found and fixed:
  `context.global`'s `read()` never stripped the `AI-JUE:START/END` wrapper,
  breaking the round trip — fixed by adding `extractManagedContent` (the
  dual of `stripManagedBlock`) to `ai-jue-core`.
- `packages/ai-jue-core/src/index.ts` and the Claude Code Adapter's
  read/write implementation are both split into small domain files
  (`capability-mapping.ts`, `merge-strategies.ts`, `capability-ref.ts`,
  `file-io.ts`, `markdown-rendering.ts`, `core-executor.ts`;
  `capabilities/{rules,commands,agents,skills,hooks,mcp,context,layout,
  manifest}.ts`) instead of one file carrying multiple unrelated Capability
  responsibilities. `ai-jue-core`'s tests also moved from `src/*.test.ts` to
  a dedicated `test/` directory, matching every other package's convention
  (which also caught `tsconfig.json` failing to exclude the new test
  directory, so test files were leaking into the published `dist/`).
  Design recorded in
  `docs/superpowers/specs/2026-07-26-capability-mapping-engine-design.md`.
- The Claude Extension package entry exports only the `defineExtension()`
  default. Tests materialize Artifact changes through its `Adapter.write()` and
  the Core executor. The following mappings are verified in `index.test.ts` and
  the cross-adapter `adapter-matrix.test.ts`/`adapter-capability.snapshot.test.ts`:
  - `context.global` no longer writes a separate `AGENTS.md` rules digest
    ("## Rule: x") referenced from `CLAUDE.md` via `@AGENTS.md`; it writes
    directly into `CLAUDE.md`, since Claude Code never reads `AGENTS.md` on
    its own (verified in JUE-104). `AGENTS.md` still exists in the
    cross-adapter scenario — written by the Cursor adapter, no longer the
    Claude adapter's job.
  - `commands` no longer redirect into `.claude/skills/*/SKILL.md` (the old
    code's unverified "commands merge into skills" assumption); they write
    to their own `.claude/commands/*.md` directory, matching JUE-105's real
    CLI verification.
  - Previously hard-coded renames/defaults (`alwaysApply` → `auto-apply`,
    `disable-model-invocation` defaults) are removed — none were verified
    in JUE-104/105. rules/commands/skills/agents are now a generic
    passthrough of Canonical attributes, keeping only the one verified
    rename (`globs` → `paths`, rules only).
  - Added `WriteContext.toolsConfig` (`tools.claude` passthrough merged into
    `settings.json`) and `WriteContext.pluginManifest`
    (`packages/ai-jue-adapter-claude/src/capabilities/manifest.ts`,
    generating `.claude-plugin/plugin.json`). The latter is verified against
    real `claude plugin validate --strict`
    (`packages/ai-jue-adapter-claude/test/plugin-manifest.test.ts`), closing
    a gap where `artifactKind: 'plugin'` wrote only the six Capabilities and
    never a manifest, so it could pass `--plugin-dir`'s manifest-optional
    discovery but not `claude plugin validate` — required native-confirmation
    evidence for JUE-109/110, not an optional enhancement.
  - **Explicitly excluded from this round**: a Marketplace/aggregate-index
    Artifact (`marketplace.json` generation). No JUE-101 through JUE-110
    acceptance criterion requires it; building it without a Gate calling for
    it is speculative scope outside the current problem domain — see the
    "Artifact granularity trade-off" section in
    `packages/docs/architecture/adapter-standardization.md`.
- The Core executor (JUE-108,
  `packages/ai-jue-core/src/core-executor.ts`) implements
  `planExecution`/`applyExecution`/`checkExecution`:
  - **Drift detection**: re-reads the real on-disk hash before writing and
    compares it against `beforeHash`; a `create` colliding with a file that
    already exists, or an `update`/`delete` whose target is missing or has
    been changed, both classify as a conflict and block the whole batch with
    zero writes (`blocked-conflict`).
  - **Authorization**: a `requiresApproval` change not covered by
    `authorizedTargets` is classified separately as
    `blocked-unauthorized` — also zero-write, kept distinct from drift
    conflicts.
  - **Atomic execution with rollback**: each write is snapshotted (original
    bytes, or "did not exist") immediately before it happens; if any step in
    the batch fails, every change already applied this call is restored in
    reverse order, returning `rolled-back`. A test makes an existing plain
    file stand in for a directory segment to force a real write failure
    mid-batch and verifies every other change in that batch is fully
    restored (`core-executor.test.ts`, 17 assertions).
  - **Idempotency**: a change whose `afterHash` is already on disk is
    treated as `no-change`; a second apply is zero-write, and
    `checkExecution`/`--check` reuse the same classification.
  - `applyChangesOrThrow` is a test helper for materializing `write()` output;
    it replaces the placeholder
    `artifact-executor.ts` (a minimal filesystem primitive with no drift,
    authorization, or rollback), deleted outright per the "keep no legacy
    assets" rule rather than kept alongside as a parallel implementation.
  - CLI wiring (`packages/ai-jue/src/core-apply.ts`): `jue apply` validates the
    Extension default export and invokes its single Adapter's `write()` through
    the Core executor, with real exit codes for
    `--dry-run` (always zero-write, always exits `0`) and `--check`
    (read-only; `no-change` exits `0`, `pending`/`blocked-conflict` exit
    `3`, `blocked-unauthorized` exits `4`, `rolled-back` exits `1`).
    Package-level methods are outside the apply runtime contract.
    `scripts/smoke-apply.js` gained `runCoreExecutorSmoke()`, verifying
    against the real built `dist/cli.js`: `--dry-run` on an empty project is
    zero-write, `--check` exits `3`, apply exits `0` and writes, `--check`
    after a clean apply exits `0`, and a second apply leaves the file's
    mtime untouched (zero-diff). **Scope note**: real on-disk drift blocking
    (`blocked-conflict`) is verified in `core-executor.test.ts` against a
    directly constructed `ArtifactChange`; within a single `jue apply`
    invocation, `write()` and `applyExecution` run back-to-back with no real
    time gap between them, so there is no window in which an external
    concurrent edit could be reproduced at the CLI level — nor is one
    needed for this task's acceptance bar.
  - `npm test` (282 passing, including 17 new `core-executor.test.ts`
    assertions).
- Claude native usability verification (JUE-109,
  `scripts/verify-claude-native.js`, replayable from a clean worktree):
  builds a minimal Plugin with a single deterministic command through the
  real `write()`/`applyChangesOrThrow()` path in an isolated temp directory;
  `claude plugin validate --strict` passes; forces a real mid-batch write
  failure (a second change's parent path collides with an existing plain
  file), which `core-executor.ts`'s `applyExecution` fully rolls back, then
  re-confirms the fixture with the same real `claude plugin validate
  --strict` afterward; `claude --bare -p "/jue-109-verify:status"
  --plugin-dir <fixture> --output-format stream-json --verbose
  --allowedTools ""`'s `system/init` shows the generated Plugin in `plugins`,
  no entry for it in `plugin_errors`, the generated command in
  `slash_commands`, and a final `result` of
  `{is_error:false, result:"JUE-109-OK"}` (the deterministic marker text,
  proving the capability was really discovered *and* invoked); real cost
  $0.003–$0.005 per run. Three real facts found along the way: `--bare`
  authentication strictly requires `ANTHROPIC_API_KEY` or an `apiKeyHelper`
  via `--settings` (never OAuth/keychain — this machine's interactive login
  doesn't carry over to `--bare`; this run used an Anthropic-API-compatible
  third-party backend to satisfy that requirement); `--bare` does not isolate
  the Plugin surface from whatever else is installed on the machine (the
  fixture appears alongside every other real Plugin in `plugins`);
  `plugin_errors` is entirely absent from `system/init` when nothing failed,
  not an empty array. Full evidence in
  `packages/ai-jue-adapter-claude/fixtures/README.md`'s "JUE-109 native
  usability verification" section. Scope note: the fixture deliberately
  covers only `commands`, not `agents`/`mcp.servers` inventory under `--bare`
  headless (a known gap where `--bare` drops both — see JUE-104/105); their
  read()/write() round-trip equivalence is already covered by JUE-106/107's
  unit tests, just not through this `--bare` headless gate. `confirm()`
  itself and `defineExtension()` assembly are out of this task's acceptance
  scope and still haven't started.
- Claude MVP Gate (JUE-110, `scripts/verify-claude-mvp-gate.js`, one command,
  replayable from a clean temp directory): strings together the full R1
  chain using the real `project/` native fixture (the same one JUE-105/106/
  107's own tests use, not a separately built sample) — `read()` into
  Canonical, checked against `CanonicalDocumentSchema`; drops
  `context.global` before converting to a Plugin (Claude Code Plugins have
  no CLAUDE.md-equivalent mechanism, so `write()` never emits it for
  `artifactKind: "plugin"`, consistent with the `plugin/` fixture's own
  coverage matrix — a pre-existing Artifact-kind boundary this task
  surfaced explicitly, not a defect it introduced); adds one purpose-built
  deterministic verification-only command, writes into a fresh temp
  directory as a Plugin, applies through the Core executor;
  `claude plugin validate --strict` passes; `read()`s the result and
  `assert.deepStrictEqual`s it against the pre-write Canonical (the
  `normalize(read(write(read(N))))=normalize(read(N))` contract, verified
  end-to-end in one run); a second `write()` of the same Canonical yields
  zero changes (idempotent); `claude --bare -p
  "/jue-110-mvp-gate:mvpGateProbe" --plugin-dir <fixture> --output-format
  stream-json --verbose --allowedTools ""`'s `system/init` shows the Plugin
  loaded with no error entry and the probe command in `slash_commands`, and
  the final `result` is the deterministic marker text, proving real
  discovery and invocation — real cost around $0.005 per run; and confirms
  the fixture's own non-functional `mcp.servers` entry (pointing at a
  `node server.js` that doesn't exist) does not block or hang the
  invocation. Full evidence in
  `packages/ai-jue-adapter-claude/fixtures/README.md`'s "JUE-110 Claude MVP
  Gate" section. R1 (JUE-101 through JUE-110) is entirely `done`; the
  `delivery-plan.md` restriction against starting other Agent
  implementations before JUE-110 is lifted, and the next `ready` task is
  JUE-201.
- `agent-extension` Skill (JUE-201,
  `packages/jue-preset-internal/skills/adapter-creator/`, `SKILL.md`
  v6.0.0): the existing six-phase methodology now explicitly self-identifies
  as the `agent-extension` Skill delivery-plan.md's R2 refers to, and gained
  three updates that had fallen behind the real JUE-108/109/110
  implementation — Phase 4 now requires an Adapter's `write()` output to run
  through `core-executor.ts`'s (JUE-108) `planExecution`/`applyExecution`/
  `checkExecution` rather than each Adapter reinventing apply/rollback;
  Phase 5 now verifies the equivalence contracts with the real
  `applyChangesOrThrow`, no longer citing the deleted placeholder
  `applyChanges` scaffold; Phase 6 gained a "reusable script shape"
  subsection generalizing `scripts/verify-claude-native.js`/
  `verify-claude-mvp-gate.js`'s concrete technique (a deterministic marker
  command, a forced batch failure with native-tool rollback re-validation,
  auth and isolation checked as two separate empirical questions, and a
  broken external-process reference not necessarily blocking headless
  invocation) into a template for any target Agent. Phase 2 gained an
  "aggregate-Artifact investigation" step pointing at
  adapter-standardization.md's granularity trade-off test. This is a
  documentation/methodology asset change with no new test cases;
  `npm test` (282 passing, no regressions).
- Shared contract-test suite (JUE-202,
  `packages/ai-jue-core/src/adapter-contract-kit.ts`):
  `defineAdapterContractSuite(options)` registers all six contract-test
  categories in one call — both equivalence contracts, idempotency,
  unmanaged-field preservation, sensitive-reference rejection, and
  per-Artifact-kind native confirmation (via each fixture's optional
  `confirmNatively` callback) — materializing through the real
  `applyChangesOrThrow`/`core-executor.ts` apply path, not a separate
  test-only writer. Exported only from the `ai-jue-core/testkit` subpath
  (new `testkit.js`/`testkit.d.ts` at the package root; `vitest` declared
  as an optional `peerDependency`), deliberately kept out of `ai-jue-core`'s
  main `index.ts` entry point so the test framework never leaks into
  runtime consumers; `vitest.config.ts` gained a matching alias so it
  resolves to source, not `dist/`, inside this repo. Verified by actually
  migrating the Claude Adapter onto it: new `packages/ai-jue-adapter-claude/
  test/contract.test.ts` (8 assertions, including real `claude plugin
  validate --strict` native confirmation) replaces the hand-written
  `write.test.ts` (6 duplicate assertions, deleted), and the duplicate
  sensitive-credential-rejection test in `read.test.ts` moved into the
  shared suite's `securityRejectionCases` (removed from `read.test.ts`);
  `adapter-creator/SKILL.md` bumped to v6.1.0, Phase 5 now points at this
  shared suite. `npm test` (283 passing, net +1: 282 − 6 (deleted
  write.test.ts) + 8 (new contract.test.ts) − 1 (de-duplicated in
  read.test.ts) = 283).
- Author CLI support (JUE-203): found and fixed a real prerequisite gap —
  `jue extension validate ai-jue-adapter-claude` was previously guaranteed to
  fail, since the package only had `dependencies.ai-jue-core`, missing the
  `peerDependencies["ai-jue-core"]` JUE-103's validator requires, and never
  exported a `defineExtension()`-shaped default (only standalone `read`/
  `write`, never a `confirm()`). Fixed: new `packages/ai-jue-adapter-claude/
  src/confirm.ts` (Plugin Artifacts go through real `claude plugin validate
  --strict`; project-scope has no equivalent native validator, so it
  honestly reports `unconfirmed`); `index.ts` assembles an `Adapter` (all six
  `capabilities` `supported`) and `export default defineExtension(...)`;
  `package.json` gained `peerDependencies.ai-jue-core`. `node dist/cli.js
  extension validate ai-jue-adapter-claude --load` succeeds for the first
  time. On top of that, two new CLI entry points:
  (1) `jue extension validate --fixtures` (`runExtensionFixtureCheck` in
  `packages/ai-jue/src/commands/extension.ts`) runs the loaded Extension's
  first Adapter's `read()` against every immediate subdirectory of the given
  fixtures directory and checks the result against `CanonicalDocumentSchema`,
  reporting pass/fail per fixture, exit 2 on any failure — verified against
  the real Claude `project`/`plugin` fixtures, both passing.
  (2) `jue inspect --extension --diagnostics` (new
  `packages/ai-jue/src/commands/inspect.ts`):
  read-only report of the loaded Adapter's `id`/`capabilities`, plus (when a
  project config exists in cwd) a real apply-readiness check via
  `core-executor.ts`'s (JUE-108) `checkExecution` against that project —
  never writes; running it against this repo's own root found 17 real
  pending changes (a genuine result, not fabricated), with `git status`
  confirming zero writes. `--capability`/`--preset`/`--target`/`--artifact`
  filters are not implemented, marked as planned in this file's CLI table.
  `npm test` (293 passing: 3 new in `confirm.test.ts`, 4 in
  `extension-fixtures.test.ts`, 3 in `inspect.test.ts`).
- Neutral second Adapter verification (JUE-204): the neutral Adapter is
  built as an in-repo test fixture,
  `packages/ai-jue-core/test/fixtures/neutral-adapter/`, not a standalone
  `packages/ai-jue-adapter-*` package — `jue apply`'s `findAdapters()`
  discovers Adapters via a glob, so a real package would genuinely enter
  the `apply --all`/`smoke-apply.js` candidate list; a purely test-only
  construct with no real native tool to confirm against would pollute that
  namespace's public semantics. This also matches common practice in
  kernel-plus-plugin repos like Rollup/Vite/Webpack/Babel/ESLint: synthetic
  plugins built to stress-test framework generality live inline in the
  tested framework's own test suite, not as sibling published packages.
  Native shape: seven `mergedJsonFile` mappings, one JSON file per
  Capability *type* (`context.json`/`rules.json`/`commands.json`/
  `agents.json`/`skills.json`/`hooks.json`/`mcp.json`) — genuinely different
  from Claude's "one file/directory per Capability *item*"; `mcp`
  additionally does a `servers` ↔ `mcpServers` key-rename translation
  (reusing `assertNoLiteralCredentials`), proving the `toCanonical`/
  `toNative` mechanism generalizes too. `confirm()` honestly reports
  `unconfirmed` (this fictional Agent has no official tool to confirm
  against). Building it surfaced and avoided a real pitfall: sharing one
  file across all six Capabilities, each with its own independent
  `mergedJsonFile` mapping, would let `writeCapabilities()`'s naive
  concatenation produce changes that clobber each other once Core applied
  them in sequence (each mapping computes from its own pre-write disk
  snapshot); giving each Capability its own file avoids this entirely, no
  change to `capability-mapping.ts` needed.
  `packages/ai-jue-core/test/adapter-contract-kit.neutral.test.ts` calls
  JUE-202's `defineAdapterContractSuite` directly (6 assertions, zero
  Claude-specific code). Verified
  `canonical-document.ts`/`capability-mapping.ts`/`core-executor.ts`/
  `extension-host.ts` have identical md5 hashes before and after;
  `check-consistency`/`smoke-apply.js` both confirm no new real package was
  added and `jue apply` never discovers it. `npm test` (299 passing, 6 new).
- R2 Scale Gate (JUE-205): full regression review (`npm test` 299 passing,
  `npm run build`, `npm run check-consistency`,
  `npm --prefix packages/docs run docs:build`, `git diff --check` all
  pass). Frozen the template (`adapter-creator/SKILL.md` v6.2.0), the input
  contract (capability matrix + minimal exhaustive fixture), the output
  contract (`packages/ai-jue-adapter-{agent}/`'s directory skeleton,
  `write()` routed through `core-executor.ts`), the completion-evidence
  contract (`claude-code-execution.md`'s "Handoff contract" expanded from 8
  to 12 fields: added `status`/`changes`/`security_results`/
  `next_ready_task`), and the namespace boundary barring synthetic test
  targets from becoming standalone packages (the JUE-204 precedent). See
  `claude-code-execution.md`'s "Scale Gate (JUE-205) frozen contents"
  section for detail. All three R3 tasks (JUE-301/302/303) are now
  unblocked and `ready`.
- All three R3 parallel Adapters (JUE-301 Codex, JUE-302 OpenClaw, JUE-303
  Hermes) are now built to the JUE-205 output contract: each has its own
  `capabilities/*.ts` declaration table plus `read.ts`/`write.ts`/
  `confirm.ts`/`index.ts` assembling an `Adapter` and `defineExtension()`,
  with `write()` driven by `core-executor.ts` — so
  `jue apply --adapter <codex|openclaw|hermes> --dry-run/--check` now works
  (no longer Claude-only). Each has a different native confirmation path:
  Codex uses the real `codex plugin marketplace add`+`plugin add`+
  `plugin list --json` round-trip; OpenClaw uses real
  `openclaw --profile <isolated> config validate --json` (an empirical
  quirk produces empty stdout inside a vitest worker, so the contract
  suite doesn't call `confirmNatively` in-suite; native confirmation lives
  in the standalone `scripts/verify-openclaw-native.js`); Hermes uses real
  `tirith config validate` (`scripts/verify-hermes-native.js`). `npm test`
  currently passes 292. JUE-401 (the four-Adapter portable subset matrix)
  is also done — see delivery-plan.md's R4 and
  `packages/ai-jue-adapter-hermes/audit/JUE-401-portable-canonical.md`.
- Real ai-assets four-Agent acceptance: `scripts/smoke-local-preset.js`
  (previously only exercised Codex/Claude Code) was extended to also run
  `apply` for OpenClaw/Hermes and check each one's required native output.
  Verified via `npm run smoke:preset-local` against both the built-in
  `local-preset-monorepo` fixture and the real `~/code/github/ai-assets`
  repository (six workspace packages under `presets/{mcp,meta,coding,
  content,agent-os,personal}`, with `personal` composing the other five —
  27 agents, 9 skills): all four Adapters complete `apply` with zero errors
  and the real files land correctly (including Hermes's category fallback
  and nested `references`). Found and fixed two blocking issues along the
  way that are unrelated to this repository's own code but blocked the
  acceptance run: this repo's own `node_modules` symlinks were stale
  (still pointing at the deleted `ai-jue-adapter-copilot`/
  `ai-jue-adapter-gemini`, missing the newly-added
  `ai-jue-adapter-openclaw`/`ai-jue-adapter-hermes`) — fixed with
  `npm install`; and the ai-assets repository's
  `presets/mcp/package.json` still used the deprecated `converter` field
  name for `ai.capabilities.filesystem` (JUE-101 migrated this field to
  `type`) — fixed on the ai-assets side to `"type": "mcp"` so it passes
  `CapabilityRefSchema`.
- Fixed a real Capability Source cache-isolation bug
  (`packages/ai-jue/src/capability-source/index.ts`): `resolveSource`'s
  default cache root is a fixed `~/.cache/ai-jue`, keyed purely by
  `sha256(source+ref+path)` with no per-consumer scoping; but
  `AI_JUE_SOURCE_MIRROR_DIR` (used by test scenarios like
  `scripts/smoke-local-preset.js --offline-mirror` to substitute synthetic
  stub content for a real fetch) had no matching cache-root isolation knob —
  a single test run using `--offline-mirror` would write fabricated content
  (e.g. `neutral-filesystem`) into this globally-shared cache, after which
  any project's real resolution of the exact same `source`/`ref`/`path`
  would silently reuse that fabricated content instead of actually fetching.
  This masked a real, pre-existing bug while running the ai-assets
  acceptance pass in this task: ai-assets' own `presets/mcp/package.json`
  referenced `npm:@modelcontextprotocol/server-filesystem@1.2.0`, a version
  that was never published (a real fetch fails with `ETARGET`), but a prior
  `--offline-mirror` test run had already poisoned the cache entry for that
  exact locator, so it looked like it "succeeded." Added an `AI_JUE_CACHE_DIR`
  environment variable (symmetric with `AI_JUE_SOURCE_MIRROR_DIR`) to
  override the cache root; `smoke-local-preset.js` now also points it at a
  temp directory whenever `--offline-mirror true` is used, so it never
  touches the real cache. Cleaned up this machine's poisoned
  `~/.cache/ai-jue` and fixed the ai-assets version to the real, published
  `2026.7.10`; re-verified `.mcp.json` now points at the real package name,
  not the synthetic stub. Added a regression test in
  `packages/ai-jue/test/capability-source.test.ts` ("honors AI_JUE_CACHE_DIR
  when options.cacheDir is not supplied") — `npm test` now passes 293 (net
  +1).
- Fixed two real short-name-resolution bugs in
  `packages/ai-jue/src/commands/apply.ts` for OpenClaw/Hermes: (1)
  `ADAPTER_ALIAS_MAP` previously had no `openclaw`/`hermes` entries, so
  `jue apply --adapter openclaw` treated the short name as a literal npm
  package name to install — verified in a fresh project that this really
  installed and loaded an unrelated third-party package of the same name
  from the public npm registry (`openclaw@2026.7.1-2`, a messaging
  gateway), crashing on an ESM/CJS conflict; the alias map now has both
  entries. (2) `ADAPTER_INDICATORS`'s Hermes footprint file was originally
  a bare `config.yaml` — a filename common to many unrelated tools
  (Docusaurus, mkdocs, Ansible, Serverless, etc.) that would
  false-positive-detect Hermes on unrelated projects and silently trigger
  `npm install -D ai-jue-adapter-hermes` plus an incorrect apply run when
  `jue apply` is invoked without an explicit `--adapter`; changed to
  `MEMORY.md`, matching the specificity of the other Adapters' indicator
  files (e.g. `CLAUDE.md`).

## Cursor follow-up

[JUE-304](delivery-plan.md) delivered Cursor project/plugin round-trip. These GitHub Issues are **separate follow-ups** — agents must read the full issue (Acceptance criteria + Implementation notes) before starting:

| Issue | Task |
| --- | --- |
| [#8](https://github.com/zenHeart/ai-jue/issues/8) | `.cursor-plugin/marketplace.json` generation |
| [#9](https://github.com/zenHeart/ai-jue/issues/9) | OpenClaw compatible-bundle third base: Cursor layout |
| [#10](https://github.com/zenHeart/ai-jue/issues/10) | adapter-creator dual-layout documentation |
| [#11](https://github.com/zenHeart/ai-jue/issues/11) | failure fixtures + security contract samples |

See [`agents/cursor.md` §5](../agents/cursor.md#5-follow-up-work-github-issues).

## Critical gaps

`resolveFinalConfig` still returns a `MergedConfig` mixing ProjectConfig
fields, not a `CanonicalDocument`; each Core-executor entry point calls
`toCanonicalDocument(config)` on its own rather than `resolveFinalConfig`
itself producing a `CanonicalDocument` every Adapter shares. Claude, Codex,
Cursor, OpenClaw, and Hermes all provide Adapter `write()` through their default Extension and route through the Core
executor (Cursor project + plugin, [JUE-304](delivery-plan.md)). The Hermes Adapter ([JUE-303](delivery-plan.md)) adds a `cron`
field to `CanonicalDocumentSchema` (`packages/ai-jue-core/src/
canonical-document.ts`, a full-file pass-through of `cron/jobs.json`) that is
not one of the six atomic Capability types this document elsewhere repeatedly
calls "frozen" (`rule`/`command`/`skill`/`agent`/`hook`/`mcp`). This honestly
exposes a real Hermes-native surface, but its architecture status has not
been settled via an RFC: whether it should be formally adopted as a seventh
atomic Capability, moved to a `tools.hermes` target-private field, or left
as-is is an open public-contract question, not a default acceptance. `jue
apply` now invokes `write()` through the Adapter object from the
`defineExtension()` default export. Post-write native `confirm()` is not yet
wired into the apply lifecycle. A
Marketplace/aggregate-index Artifact (packaging several Plugins for
distribution) is not implemented and not in scope for the current Gate; it
becomes relevant only if R5's ai-assets migration actually needs to ship
several Presets as one distributable unit — see the trade-off recorded in
`packages/docs/architecture/adapter-standardization.md`. The
`capabilities` `integrity` field can be supplied but is not yet enforced for
remote sources. Of Preset, Extension, Adapter, and Artifact, Extension/Adapter
now have dedicated `ExtensionDefinition`/`Adapter` public types; Preset and
Artifact still have none. `loadExtensionGuarded`'s isolation
is in-process API guarding (it intercepts and blocks fs/child-process/network/
`process.exit` calls made directly through the require chain), not an OS or VM
sandbox: it cannot stop a native addon from bypassing these modules, cannot
bound CPU/memory exhaustion, and cannot time out a synchronous infinite loop.
A real process/VM isolation boundary remains open work. Four-Agent
round-trip/idempotency/preservation tests remain open. Within the Claude Code
capability discovery, Monitor, Theme, Channel, `bin/`, and `userConfig`
runtime behavior, `claude plugin eval`, private/enterprise marketplace
distribution, and managed/enterprise scope remain unverified (no managed
settings on this machine, and no full interactive session installing a real
Plugin); the JUE-105 fixture is built around that boundary, and its
`themes/`/`workflows/` samples are documentation-sourced preservation
samples only, with no runtime check behind them. Later native confirmation
(JUE-109) and other Agent migrations must use the field shapes verified in
`packages/ai-jue-adapter-claude/fixtures/README.md` (the outer `hooks` key,
the `dependencies` array shape, required `userConfig.title`, etc.), not the
original unreviewed JUE-104 report claims.
