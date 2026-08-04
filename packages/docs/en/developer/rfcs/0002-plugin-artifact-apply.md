# RFC-0002: Plugin / Bundle Artifact apply contract

> Status: Implementing  
> Related: Epic [#5](https://github.com/zenHeart/ai-jue/issues/5); [#2](https://github.com/zenHeart/ai-jue/issues/2), [#3](https://github.com/zenHeart/ai-jue/issues/3), [#6](https://github.com/zenHeart/ai-jue/issues/6); R5  
> Consumer evidence: private composition entry `jue-preset-ai-assets` (ai-assets `presets/personal`)  
> Official sources (verified 2026-08):  
> - OpenClaw [Plugin bundles](https://docs.openclaw.ai/plugins/bundles) · [Plugins](https://docs.openclaw.ai/tools/plugin) · [Building plugins](https://docs.openclaw.ai/plugins/building-plugins)  
> - Hermes [Plugins](https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins) · [Build a Hermes Plugin](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin)

## Background

RFC-0001 treats Plugin, Bundle, and config as **Artifact shapes**. Claude/Codex
`write()` already supports `artifactKind: "plugin"`, but `jue apply` hardcodes
`"project"`. `targets.*.artifact` remains unwired.

JUE-302 concluded “OpenClaw has no Plugin/Bundle” for the **workspace project
tree**. Current OpenClaw docs add a second surface:

| OpenClaw surface | Meaning | Jue stance |
| --- | --- | --- |
| Workspace | In-project skills/hooks/AGENTS | Implemented today |
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

| Format | Marker | Mapped today (supported) |
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

## Decision (Proposed)

**Config-first + CLI override**, with these kinds:

| Adapter | Kind | Minimal implementation |
| --- | --- | --- |
| `claude-code` | `project`, `plugin` | Wire existing writer/confirm |
| `codex` | `project`, `plugin` | Same |
| `openclaw` | `workspace`, **`compatible-bundle`** | **Delegate** to Claude or Codex `write({ artifactKind: "plugin" })`; confirm with `openclaw plugins install` + `inspect` (`Format: bundle`) |
| `hermes` | `workspace`, optional **`skill-plugin`** | Phase A: `skill-plugin` unsupported. Phase B: generate `plugin.yaml` + stub `__init__.py` that only `register_skill`s + flat `skills/` |

### OpenClaw `compatible-bundle`

1. Default base format: **`claude`** (skills/commands-heavy presets).
2. If Canonical has hooks that must **run** in OpenClaw → base **`codex`**
   (only Codex-style hook packs execute; Claude `hooks.json` is detect-only).
3. `tools.openclaw.bundleFormat: "claude" | "codex" | "auto"`.
4. No duplicated layout code — call existing adapters/helpers.
5. Success criterion is compatible **bundle**, not native `openclaw.plugin.json`.

### Hermes `skill-plugin` (Phase B)

Pack **skills only**. MCP/context stay on workspace. Generated `__init__.py` may
only loop `register_skill` — never embed Canonical text as executable logic.

### Resolution order

CLI `--artifact-kind` → `targets.*.artifact` → default `project`/`workspace`.  
Unsupported kind fails **before write**.

## Capability honesty (aggregate kinds)

| Canonical | Via Claude bundle (OpenClaw) | Via Codex bundle (OpenClaw) | Hermes skill-plugin |
| --- | --- | --- | --- |
| skills | mapped | mapped | `register_skill` |
| commands | skill roots | degraded | not packed |
| agents | detect-only | Codex-dependent | not packed |
| hooks | detect-only | runnable OpenClaw layout | not packed |
| mcp | embedded merge | embedded merge | workspace only |
| context.global | usually omitted | usually omitted | workspace only |

Detect-only / not-packed must surface as degraded/unsupported or preflight
warnings — never silent drop.

## Security

No secrets/PII in artifacts. Prefer OpenClaw bundle trust boundary over native
plugins for Canonical packs. Hermes generated Python is fixed skill-registration
boilerplate only. Install confirms use isolated HOME/profile.

## Compatibility

Defaults unchanged. Fix agent docs that claimed OpenClaw has no bundle surface
at all — clarify workspace vs compatible bundle vs native plugin.
Keep the string `compatible-bundle` (already in Guides) with the frozen meaning
“Claude/Codex-compatible pack”.

## Acceptance

1. #2: Claude/Codex plugin apply + existing confirm.
2. OpenClaw: `compatible-bundle` installs as `Format: bundle`; hooks use Codex base when needed.
3. Hermes Phase A: clear unsupported for `skill-plugin`; workspace green. Phase B: thin skill-plugin + optional CLI evidence.
4. `--all` honors per-adapter targets; illegal kinds fail pre-write.
5. `smoke:preset-local --entry ai-assets` supports artifact mode offline.
6. Idempotent second apply.

## Open questions (narrowed)

1. Must OpenClaw confirm always run real `plugins install`, or structure assert + CLI version floor when CLI missing?
2. Is Hermes Phase B in R5 gate, or is workspace + three-agent plugin/bundle enough?
3. Cursor bundle as third base? Default **no** (no Cursor plugin writer yet).

## Implementation slices

| Order | Issue | Work | Cost |
| --- | --- | --- | --- |
| 1 | #2 | CLI/Core/`targets` | Small |
| 2 | #3 OpenClaw | Delegate to Claude/Codex writers + confirm | **Small** |
| 3 | #3 Hermes A | Honest unsupported + docs | Tiny |
| 4 | #3 Hermes B (optional) | Thin skill-plugin generator | Medium |
| 5 | #6 | Smoke matrix | Small–medium |
| — | Explicitly skip | OpenClaw native plugin; Hermes business Python tools | Avoid large cost |

Link this RFC from implementation issues; do not mark Guide examples as shipped
before Accepted + Implemented.
