# CLI Reference

The CLI exposes user tasks, not internal conversion stages. Most users need:

```bash
jue init
jue apply --all
```

## Core commands

| Command | Purpose | Default side effect |
| --- | --- | --- |
| [`jue init`](workflow.md#jue-init) | Create minimal project config | Write config |
| [`jue apply`](workflow.md#jue-apply) | Diff, produce Artifacts, and confirm results | Write approved changes |
| [`jue inspect`](workflow.md#jue-inspect) | Explain Presets, Capabilities, Adapters, and Artifacts | None |

`apply` performs validation, comparison, writing, and confirmation:

- preview: `jue apply --dry-run`
- CI: `jue apply --check`
- diagnostics: `jue inspect --diagnostics`

## Author commands

| Namespace | Subcommands |
| --- | --- |
| [`jue capability`](capability.md) | `update` |
| [`jue preset`](preset.md) | `create`, `validate`, `pack` |
| [`jue extension`](extension.md) | `validate` |

Queries use `jue inspect --capability|--preset|--extension|--target`; namespaces
do not repeat `list`, `inspect`, and `doctor`.

## Global options

`--cwd`, `--config`, `--json`, `--quiet`, `--verbose`, `--frozen`, and
`--offline` apply across commands.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success, or `--check` found no required change |
| `1` | Internal Jue or Extension failure |
| `2` | Invalid arguments, configuration, or Canonical DSL |
| `3` | Drift, ownership, or write conflict |
| `4` | Required action not approved |
| `5` | Target-native confirmation failed |
| `6` | `--frozen` or `--offline` could not be satisfied |

See [implementation status](../../developer/implementation-status.md) for gaps
between this target contract and current code.
