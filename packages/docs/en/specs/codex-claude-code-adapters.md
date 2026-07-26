# Codex / Claude Code Adapter Target

> Status: **Partial** (legacy forward generation verified; complete Adapter contract pending)
>
> Priority: **P0 — Codex and Claude Code first**
>
> Scope owner: `ai-jue`
>
> Updated: 2026-07-25
>
> [!WARNING]
> This page defines the target contract. Delivery Plan fixes the implementation
> order: complete the headless Claude Code Reference Extension and Scale Gate,
> then migrate Codex without designing a second workflow.

## 1. Goal

`ai-jue` SHALL turn one resolved Canonical configuration into native,
project-scoped assets for **Codex** and **Claude Code**.

This specification covers two Targets in a fixed implementation order:

1. Claude Code is the first real Reference Extension.
2. Codex reuses the same skeleton and contract tests after the Scale Gate.

Cursor, Gemini, Copilot and future runtimes remain compatible, but extending or
redesigning them is out of scope.

The user model remains:

```text
Capability -> Preset -> Adapter
```

Codex and Claude Code are Adapter outputs. They do not introduce another asset
layer or runtime-specific source format.

## 1.1 Private repository boundary

Private Preset repositories are validated through a **local-only consumer
workflow**, not public distribution.

- Private Preset content MUST NOT be published, pushed, uploaded or copied to a
  public registry, public repository, external fixture service or other remote
  system.
- Public npm availability and remote GitHub access MUST NOT be acceptance
  prerequisites.
- Private Preset validation MUST consume the local repository through npm
  workspaces, `file:` dependencies or tarballs created by local `npm pack`.
- Local tarballs MUST be written only to a temporary directory and removed or
  moved to Trash after validation.
- `npm:` external Capability reference tests SHALL use local tarballs or neutral local
  fixtures.
- `github:` external Capability reference tests SHALL use a local mock/fixture. They MUST
  NOT clone, fetch or expose a real private repository.
- Tests and logs MUST NOT copy private asset bodies unnecessarily. Prefer path,
  count, checksum and generated-output assertions.
- Publishing, release and remote-private-repository verification are separate,
  explicitly authorized future stages.

The required local flow is:

```text
local private Preset workspaces
  -> local temporary npm pack/file dependency
  -> isolated local consumer project
  -> local ai-jue Canonical resolution
  -> Codex / Claude Code project outputs
```

## 2. Source of truth

Both adapters consume the same resolved Canonical fields:

- `context.global`
- `rules`
- `skills`
- `commands`
- `agents`
- `mcp.servers`
- `hooks`
- `tools.codex` / `tools.claude`

Runtime-native files are generated artifacts. Authors SHALL NOT maintain a
second Codex-only or Claude-only copy of Capability content.

## 3. Codex output contract

Package:

```text
packages/ai-jue-adapter-codex/
```

Required project outputs:

```text
AGENTS.md
.agents/
└── skills/
    └── <skill-or-command>/
        ├── SKILL.md
        ├── references/
        ├── scripts/
        └── assets/
.codex/
├── agents/
│   └── <agent>.toml
└── config.toml
```

### 3.1 Mapping

| Canonical input | Codex output | Requirement |
|---|---|---|
| `context.global` | root `AGENTS.md` | Write through the existing AI-JUE managed block and preserve user-authored text |
| `rules` | root `AGENTS.md` | Append non-empty rules as clearly named sections; include declared path/glob scope as text because Codex has no equivalent canonical per-glob rule file |
| `skills` | `.agents/skills/<name>/SKILL.md` | Preserve prompt/content, description and nested support files |
| `commands` | `.agents/skills/<name>/SKILL.md` | Commands become explicitly invocable skills; preserve description, prompt and trigger hints |
| `agents` | `.codex/agents/<name>.toml` | Emit required `name`, `description`, `developer_instructions`; map supported Codex overrides only |
| `mcp.servers` | `.codex/config.toml` | Emit project-scoped `[mcp_servers.<name>]` tables without copying secret values |
| `hooks` | `.codex/hooks.json` or `.codex/config.toml` | Choose exactly one project representation and document the mapping; do not emit both |
| `tools.codex` | `.codex/config.toml` | Merge only supported project-scoped Codex settings |

### 3.2 Codex safety and compatibility

- Existing non-managed `AGENTS.md` content MUST survive regeneration.
- Nested skill files MUST preserve relative paths and binary content.
- Asset names and support-file paths MUST stay inside their generated
  directories.
- Unsupported Canonical fields MUST be ignored explicitly or reported; they
  MUST NOT be silently translated into invented Codex keys.
- Project config MUST NOT emit credential values, authentication state,
  provider overrides or other user-global-only settings.
- TOML output MUST be parseable and deterministic.
- Re-running generation with unchanged input MUST be idempotent.

## 4. Claude Code output contract

Existing package:

```text
packages/ai-jue-adapter-claude/
```

The package remains named `ai-jue-adapter-claude`; CLI aliases SHALL support
both `claude` and `claude-code`.

Required outputs remain:

```text
AGENTS.md
CLAUDE.md
.claude/
├── rules/
├── skills/
├── agents/
└── settings.json
.mcp.json
```

This iteration SHALL verify and close the existing implementation rather than
forking or renaming it:

- `context.global` -> managed `AGENTS.md`; `CLAUDE.md` references it.
- Rules, skills, commands, agents, hooks and MCP keep their existing native
  mappings.
- Nested support files and binary assets are preserved.
- Both CLI aliases select the same package.
- Regeneration preserves user-authored content where the shared writer promises
  managed-block coexistence.
- Existing behavior remains backward compatible.

## 5. CLI and discovery

The target CLI SHALL recognize:

```bash
jue apply --target codex
jue apply --target claude-code
jue apply --target codex --target claude-code
```

Requirements:

- Add `codex -> ai-jue-adapter-codex` to the alias map.
- Use `claude-code` as the Target ID; accept `claude` only as diagnosed legacy input.
- Add Codex to known Adapter discovery.
- Codex project footprints include `AGENTS.md`, `.agents/skills`, and `.codex`.
- `--all` includes Codex without removing existing Adapters.

## 6. Tests and acceptance

Implementation is complete only when all evidence below passes.

### 6.1 Adapter tests

- Codex unit tests cover every mapping in §3.1.
- Claude Code tests cover both CLI aliases and the contract in §4.
- Tests cover empty/missing optional collections.
- Tests cover nested UTF-8 and base64 support files.
- Tests cover invalid support-file traversal.
- Tests prove deterministic/idempotent generation.
- Tests parse generated TOML instead of checking strings alone.

### 6.2 Shared matrix

Extend the shared Adapter matrix with Codex and prove that one Canonical fixture
generates:

- managed `AGENTS.md`
- Codex skill and command-as-skill
- Codex custom agent TOML
- Codex MCP/config output
- Claude Code skill, agent, rule, hook and MCP output

Existing Cursor/Gemini/Copilot assertions MUST continue to pass.

### 6.3 Local Preset smoke

`scripts/smoke-local-preset.js` packs a user-supplied local Preset workspace
into an isolated consumer and verifies:

- a generated Codex Skill
- an unchanged nested Skill reference
- a generated Codex custom Agent
- root `AGENTS.md`
- existing Claude Code outputs

The smoke success message SHALL include Codex and Claude Code explicitly.

### 6.4 Required commands

```bash
npx vitest run packages/ai-jue-adapter-codex/test packages/ai-jue-adapter-claude/test packages/ai-jue/test/adapter-matrix.test.ts
npm test
npm run build
npm run check-consistency
npm run smoke:preset-local -- --packages-dir <local-presets-dir> --entry <preset>
git diff --check
```

All commands must pass. Warnings must be reported and classified; tests may not
be weakened merely to obtain green output.

## 7. Non-goals

- OpenClaw, Hermes, Pi Agent or any other new Adapter
- Renaming Canonical concepts
- Redesigning existing Cursor/Gemini/Copilot output
- Publishing packages, uploading private assets, committing, pushing or releasing
- Accessing a real private Preset repository through a remote GitHub URL
- Writing secrets or user-global Codex/Claude configuration

## 8. Definition of done

- [ ] The complete Adapter contract and implementation agree.
- [ ] Codex and Claude Code are independently selectable through target `--target`.
- [x] A locally packed Preset generates usable native project assets for both.
- [x] Existing Adapters and tests do not regress.
- [x] No unsupported runtime is added.
- [x] Human review remains the final approval gate.

Historical implementation evidence from 2026-07-25 (proves legacy Write and
project Artifact only, not Read, install actions, or native/runtime Confirm):

- targeted Codex / Claude Code / matrix tests: 22 passed
- real CLI: `--adapter codex` and `--adapter claude-code` passed independently
- full repository tests: 23 files, 144 tests passed
- build: 8 tasks passed
- package consistency: all packages passed
- isolated local packed-install smoke: passed for Codex and Claude Code
- generated runtimes: Codex, Claude Code, Cursor, Gemini and Copilot
- production dependency audit: 0 vulnerabilities
- `git diff --check`: passed
