# Cross-Agent Migration

> [!WARNING]
> This page defines the target contract. Complete the headless Claude Code
> Reference Extension loop before opening other Agent migrations. See
> [Implementation Status](../developer/implementation-status.md).

Jue converts Agent-native config into the Canonical DSL and emits target-native
Artifacts. Every migration is previewed before writes.

## 1. User workflow

The intended workflow is:

```bash
jue apply --adapter codex --dry-run
jue apply --adapter codex
jue apply --adapter codex --check
```

Migration reuses Jue's single conversion pipeline rather than defining another
command namespace. Consult
[Agent support profiles](../agents/) until each command is implemented.

Detection identifies manifests, configuration directories, and target CLIs.
Ambiguous detection produces a preview only.

The preview includes source and target, read/write paths, selected Adapter,
Capability mapping, Artifact, per-capability diagnostic state, actions, rollback, and
verification.

## 2. Migration scenarios

### 2.1 Agent DSL → Canonical

```text
Agent-native config → Adapter → Canonical DSL
```

Portable assets enter `.ai/` or a Preset. The Adapter preserves unmanaged
target-private data on the original target without exporting it.

### 2.2 Canonical → Agent DSL

```text
Preset + project config → Canonical DSL → Adapter → Artifact
```

One Canonical document can target multiple Agents. The Adapter and user overrides select a
native configuration, Plugin, Bundle, or Extension Artifact.

### 2.3 Agent A → Agent B

```text
Agent A DSL → Canonical → Agent B DSL
```

Only the portable Canonical subset crosses targets. Runtime code, permissions,
and target-private settings are preserved, degraded, or blocked explicitly.

## 3. Preset and Plugin

Users select Presets rather than maintaining one Plugin per target:

```text
review Preset
├── Claude Code Adapter → Claude Plugin
├── Codex Adapter       → Codex Plugin
├── OpenClaw Adapter    → compatible bundle / native plugin
└── Hermes Adapter      → Hermes skill/config/plugin
```

This is the intended delivery model, not a claim that every target is implemented.

## 4. Idempotency and coexistence

- The first apply establishes the managed boundary.
- Later applies update only managed content.
- Reapplying the same input produces no diff.
- Conflicts fail or request a choice before writing.
- Unmanaged target fields remain on their original target only.

## 5. Completion criteria

A migration completes only when Canonical validation passes, actual writes match
the preview, all losses are explained, the target accepts the Artifact, a native
read path confirms availability, and no credential or user state is exposed.
