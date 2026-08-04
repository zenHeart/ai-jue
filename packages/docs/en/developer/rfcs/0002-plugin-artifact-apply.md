# RFC-0002: Plugin / Bundle Artifact apply contract

> Status: Proposed  
> Related: Epic [#5](https://github.com/zenHeart/ai-jue/issues/5); [#2](https://github.com/zenHeart/ai-jue/issues/2), [#3](https://github.com/zenHeart/ai-jue/issues/3), [#6](https://github.com/zenHeart/ai-jue/issues/6); R5 (ai-assets final consumer loop)  
> Consumer evidence: private composition entry `jue-preset-ai-assets` (ai-assets `presets/personal`)

## Background

RFC-0001 already treats Plugin, Bundle, and config as **Artifact shapes** produced
by Adapters. Claude Code / Codex `write()` already supports
`artifactKind: "plugin"`, but `jue apply`'s Core path hardcodes
`artifactKind: "project"` (`packages/ai-jue/src/core-apply.ts`). Documented
`targets.<adapter>.artifact` (`"plugin"` / `"compatible-bundle"` / `"auto"`)
is still a target contract, not wired.

Private final Presets (e.g. ai-assets `presets: ['ai-assets']`) therefore only
reliably land as **project/workspace configs**, not installable Plugin/Bundle
artifacts across four agents.

OpenClaw / Hermes currently declare workspace-only artifacts (OpenClaw explicitly
no-ops Plugin/Bundle). Their aggregate distribution shape must be defined
honestly — do not invent a Claude-style plugin API.

## Goals

1. Users can select Artifact shape via CLI and/or `ai.config.js#targets` for:
   - Claude Code: `project` | `plugin`
   - Codex: `project` | `plugin`
   - OpenClaw: `workspace` | `compatible-bundle` (name per this RFC)
   - Hermes: `workspace` | natively verified aggregate shape
2. Private / locally packed Presets work end-to-end without public publish.
3. `smoke:preset-local --entry ai-assets` (or equivalent) can assert the chosen
   Artifact shape, not only project files.

## Non-goals

- Marketplace / multi-plugin aggregate publishing (explicitly later).
- Changing Canonical DSL or adding a seventh public concept.
- Forcing all `degraded`/`unsupported` to zero in this RFC (R5 tracks that).
- Implementing any adapter compatibility layer inside ai-assets.

## Options

### A. CLI only: `--artifact-kind <kind>`

Small change; unlocks existing Claude/Codex plugin writers. Dual-track vs
documented `targets`; weak for `--all` per-adapter selection.

### B. Config only: `targets.<adapter>.artifact`

Matches Reference/Guide; good for multi-target. Worse for one-off debugging.

### C. Config first + CLI override (recommended)

Resolution order:

1. CLI `--artifact-kind` / `--artifact` overrides the current adapter;
2. else `targets.<adapter>.artifact`;
3. else `"auto"` / adapter default (today ≈ `project`/`workspace`).

On `--all`, resolve per adapter. Unsupported kinds must **fail before write**
with the adapter's declared kinds — never silently fall back to project.

## Decision (Proposed)

Adopt **option C**.

| Adapter | Stable kind names | Meaning |
| --- | --- | --- |
| `claude-code` | `project`, `plugin` | `plugin` → `.claude-plugin/plugin.json` + components at artifact root |
| `codex` | `project`, `plugin` | `plugin` → `.codex-plugin/plugin.json` + marketplace confirm path |
| `openclaw` | `workspace`, `compatible-bundle` | Distributable directory package; **do not** invent a missing official Plugin API |
| `hermes` | `workspace`, `plugin` (if native proof exists) or `compatible-bundle` | Must follow real Hermes/tirith surface; `~/.hermes/plugins` registry ≠ distributable Artifact |

This only adds selection of existing Artifact shapes. Kind strings must be
declared by the Adapter so `jue inspect` can list them.

## Contract details

### CLI

```bash
jue apply --adapter claude-code --artifact-kind plugin
jue apply --adapter openclaw --artifact-kind compatible-bundle
jue apply --all
```

Illegal kind: same exit behavior as other validation failures; no partial write.

### ProjectConfig

```js
export default {
  presets: ["ai-assets"],
  targets: {
    "claude-code": { artifact: "plugin" },
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" },
    hermes: { artifact: "auto" }
  }
};
```

### Core

`runCoreAdapter` must pass the resolved kind into `write` and `confirm` —
no hardcoded `"project"`.

### Adapters

- Claude/Codex: reuse existing `write`/`confirm`; wire CLI/config + integration tests.
- OpenClaw/Hermes: freeze minimal aggregate tree + honest capabilities + native
  confirm (or explicit `unsupported`) before implementing `write`.

### Private Presets

Local npm paths / `npm pack` + `smoke:preset-local` remain the dogfood path;
acceptance must not require registry publish.

## Security

No secrets/PII in plugin artifacts; keep confirm evidence redaction; user-scope
writes still require authorization. Default remains project/output directory.

## Compatibility

Default behavior unchanged when neither CLI nor `targets` selects a kind. After
wiring, clear the WARNING on configuration-guide / project-config that marks
`targets` as unimplemented.

## Acceptance

1. Claude Code plugin apply validates via existing confirm / `claude plugin validate`.
2. Codex plugin apply validates via existing marketplace confirm.
3. OpenClaw/Hermes: minimal verifiable aggregate + contract tests, or honest `unsupported` visible in inspect.
4. Per-adapter `targets` honored under `--all`; illegal kinds fail pre-write.
5. `smoke:preset-local` against ai-assets `presets` + entry `ai-assets` can assert plugin/bundle mode offline.
6. Second apply stays idempotent for the same plugin artifact.

## Open questions

1. Final OpenClaw `compatible-bundle` shape vs which CLI version?
2. Hermes aggregate kind name: `plugin` or `compatible-bundle`?
3. Extend `smoke-local-preset.js` vs new artifact-kind matrix flag?
4. Adapters still on `generate()` only (e.g. Cursor) stay out of scope?

## Implementation slices

1. CLI + Core wiring for Claude/Codex — #2  
2. OpenClaw / Hermes aggregate Artifact — #3  
3. ai-assets private final Preset dogfood — #6  
4. Tracking epic — #5  

Implementation issues must link this RFC; do not document examples as shipped
before Accepted + Implemented.
