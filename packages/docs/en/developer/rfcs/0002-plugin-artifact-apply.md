# RFC-0002: Plugin / Bundle Artifact apply contract

> Status: Implemented
> Related: Epic [#5](https://github.com/zenHeart/ai-jue/issues/5); [#2](https://github.com/zenHeart/ai-jue/issues/2), [#3](https://github.com/zenHeart/ai-jue/issues/3), [#6](https://github.com/zenHeart/ai-jue/issues/6); R5  
> Consumer evidence: private composition entry `jue-preset-ai-assets` (ai-assets `presets/personal`)  
> Official sources (verified 2026-08):  
> - OpenClaw [Plugin bundles](https://docs.openclaw.ai/plugins/bundles) · [Plugins](https://docs.openclaw.ai/tools/plugin) · [Building plugins](https://docs.openclaw.ai/plugins/building-plugins)  
> - Hermes [Plugins](https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins) · [Build a Hermes Plugin](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin)

## Background

RFC-0001 treats Plugin, Bundle, and config as **Artifact shapes**. Claude/Codex
`write()` already supports `artifactKind: "plugin"`; this RFC wires Artifact
selection, Adapter-owned layout detection, and the Core execution path together.
`targets.*.artifact`, `enabled`, and `scope` remain conversion-environment inputs.

JUE-302 measured the **workspace project tree** (`AGENTS.md` / `skills/` /
`hooks/`). Current OpenClaw docs (verified 2026-08) define a separate
installable surface, Compatible bundle:

| OpenClaw surface | Meaning | Jue stance |
| --- | --- | --- |
| Workspace | In-project skills/hooks/AGENTS | Implemented |
| **Compatible bundle** | Install Claude/Codex/Cursor layouts | **Reuse existing plugin writers — no new tree** |
| Native plugin | `openclaw.plugin.json` + in-process TS | Out of scope for Canonical packs |

Hermes “plugin” is a different product:

| Hermes surface | Meaning | Jue stance |
| --- | --- | --- |
| Workspace | Categorized skills, MCP in `config.yaml`, MEMORY | Primary path for capability packs |
| General plugin | `plugin.yaml` + Python `register(ctx)` | Runtime extension — not default for Canonical text packs |
| Plugin-bundled skills | Flat `skills/<name>/` + `ctx.register_skill` | Optional thin wrapper |
| `~/.hermes/plugins` registry | Install index | Not a distributable Artifact by itself |

## Goals

1. Select Artifact shape via CLI / `targets` (defaults unchanged).
2. Private / `npm pack` Presets work without registry publish.
3. **Minimal cost:** reuse Claude/Codex plugin writers; do not invent an OpenClaw
   directory dialect; do not generate full Hermes Python tool plugins by default.
4. Smoke can natively confirm the chosen shape (or honest `unsupported`).

## Non-goals

- OpenClaw **native** plugins (`openclaw.plugin.json` + `definePluginEntry`).
- Full Hermes Python tool / platform / memory / provider plugins.
- Marketplace / ClawHub / pip publish pipelines.
- Canonical DSL changes; zeroing all `degraded`; adapters inside ai-assets.

## Official mapping

### OpenClaw compatible bundles

```bash
openclaw plugins install ./my-bundle
openclaw plugins list          # Format: bundle; Bundle format: claude|codex|cursor
openclaw plugins inspect <id>
```

| Format | Marker | Mapped (supported) |
| --- | --- | --- |
| Codex | `.codex-plugin/plugin.json` | skills; hooks (`HOOK.md`+handler); MCP |
| Claude | `.claude-plugin/plugin.json` or default layout | skills; `commands/` as skill roots; MCP; agents/hooks.json detect-only |
| Cursor | `.cursor-plugin/plugin.json` | skills; commands as skills; much detect-only |

Bundles intentionally do **not** load arbitrary in-process modules — ideal for
Jue content packs.

### Hermes plugins

```text
~/.hermes/plugins/<name>/
├── plugin.yaml
├── __init__.py
└── skills/<name>/SKILL.md   # optional via ctx.register_skill
```

Project-local `./.hermes/plugins/` requires `HERMES_ENABLE_PROJECT_PLUGINS=true`.
Default delivery for Canonical skill packs remains **workspace**.

## Alternatives

### A. Each agent invents its own aggregate directory

High cost; OpenClaw already ships Claude/Codex entry points — reinventing
them duplicates work. **Rejected.**

### B. Wire Claude/Codex via CLI only; OpenClaw/Hermes never aggregate

Cheapest in the short term, but it wastes OpenClaw's existing `plugins install`
bundle capability and leaves R5's four-agent aggregation unclosed.
**Phase 0, not the endpoint.**

### C. Config-first + CLI override; OpenClaw delegates to existing plugin writers; Hermes layered (recommended)

See decision.

## Decision (Accepted)

**Config-first + CLI override**, with these kinds:

| Adapter | Kind | Minimal implementation |
| --- | --- | --- |
| `claude-code` | `project`, `plugin` | Wire existing writer/confirm |
| `codex` | `project`, `plugin` | Same |
| `openclaw` | `workspace`, **`compatible-bundle`** | **Delegate** to Claude or Codex `write({ artifactKind: "plugin" })`; confirm with `openclaw plugins install` + `inspect` (`Format: bundle`) |
| `hermes` | `workspace`, **`skill-plugin`** | Generate `plugin.yaml` + stub `__init__.py` that only `register_skill`s + flat `skills/` |

### OpenClaw `compatible-bundle`

1. Default base format: **`claude`** (skills/commands-heavy presets).
2. If Canonical has hooks that must **run** in OpenClaw → base **`codex`**
   (only Codex-style hook packs execute; Claude `hooks.json` is detect-only).
3. `tools.openclaw.bundleFormat: "claude" | "codex" | "auto"`.
4. No duplicated layout code — call existing adapters/helpers.
5. Success criterion is compatible **bundle**, not native `openclaw.plugin.json`.

### Hermes `skill-plugin`

Pack **skills only**. MCP/context stay on workspace. Generated `__init__.py` may
only loop `register_skill` — never embed Canonical text as executable logic.

### Resolution order

CLI `--artifact-kind` → `targets.*.artifact` → Adapter-owned detection for `auto` → default `project`/`workspace`.
Unsupported kind fails **before write**.

## Contract

### CLI / ProjectConfig

```bash
jue apply --adapter claude-code --artifact-kind plugin
jue apply --adapter openclaw --artifact-kind compatible-bundle
jue apply --adapter hermes --artifact-kind skill-plugin
jue apply --all
```

```js
export default {
  presets: ["ai-assets"],
  targets: {
    "claude-code": { artifact: "plugin" },
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" },
    hermes: { artifact: "workspace" } // or "skill-plugin"
  },
  tools: {
    openclaw: { bundleFormat: "auto" } // "claude" | "codex" | "auto"
  }
};
```

`hermes: { artifact: "auto" }` — Hermes only offers `workspace` (plus optional
`skill-plugin`), so `auto` resolves to a managed artifact, otherwise the single
default `workspace`.

### Core

`runCoreAdapter` receives the resolved kind; hardcoding `"project"` is
forbidden.

### Capability honesty matrix (plugin / skill-plugin)

| Canonical | Claude plugin | Codex plugin | OpenClaw via Claude bundle | OpenClaw via Codex bundle | Hermes skill-plugin |
| --- | --- | --- | --- | --- | --- |
| skills | supported | supported | mapped as skills | mapped as skills | `register_skill` |
| commands | supported | degraded | **skill roots** | degraded/not mapped | not packed |
| agents | supported | supported (TOML) | **detect-only** | per Codex mapping | not packed |
| hooks | hooks.json | `.codex/hooks.json` | detect-only | **runnable** (OpenClaw layout) | not packed (Hermes hooks elsewhere) |
| mcp | .mcp.json | .mcp.json | merged into embedded | merged into embedded | not packed (workspace) |
| context.global | project-only | project-only | usually omitted | usually omitted | not packed |

Detect-only / not-packed items must surface as `degraded`/`unsupported` or
apply preflight warnings before export — never a silent drop.

## Security

No secrets/PII in artifacts. Prefer OpenClaw bundle trust boundary over native
plugins for Canonical packs. Hermes generated Python is fixed skill-registration
boilerplate only. Install confirms use isolated HOME/profile.

## Compatibility

Defaults unchanged. Agent docs describe OpenClaw's compatible-bundle surface
accurately — distinguishing workspace vs compatible bundle vs native plugin.
Keep the string `compatible-bundle` (already in Guides) with the frozen meaning
“Claude/Codex-compatible pack”.

## Acceptance

1. #2: Claude/Codex plugin apply; native confirmation is probed via `--check` (the Core path does not invoke confirm).
2. OpenClaw: `compatible-bundle` installs as `Format: bundle`; hooks use Codex base when needed.
3. Hermes: thin skill-plugin structure plus structural confirmation evidence; workspace green.
4. `--all` honors per-adapter `enabled`, `artifact`, and `scope`; illegal kinds and unsupported scopes fail pre-write.
5. `smoke:preset-local --entry ai-assets` supports artifact mode offline.
6. Idempotent second apply.

## Known boundaries (post-implementation)

1. OpenClaw CLI availability across CI; the contract uses install+inspect when present and returns structured `unconfirmed` evidence when absent.
2. Whether Hermes skill-plugin should add real `hermes plugins install/list` headless evidence.
3. Cursor bundle as third base; OpenClaw can discover it while Jue's current Cursor Artifact kind remains project.

## Implementation slices

| Order | Issue | Work | Cost |
| --- | --- | --- | --- |
| 1 | #2 | CLI/Core/`targets` | Small |
| 2 | #3 OpenClaw | Delegate to Claude/Codex writers + confirm | **Small** |
| 3 | #3 Hermes | Thin skill-plugin generator + structural confirmation | Medium |
| 4 | #6 | Smoke matrix | Small–medium |
| — | Explicitly skip | OpenClaw native plugin; Hermes business Python tools | Avoid large cost |

Link this RFC from implementation issues.
