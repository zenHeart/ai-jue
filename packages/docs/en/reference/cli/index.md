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
| [`jue apply`](workflow.md#jue-apply) | Diff and produce Artifacts | Write changes |
| [`jue inspect`](workflow.md#jue-inspect) | Explain Presets, Capabilities, Adapters, and Artifacts | None |

`apply` performs validation, comparison, and writing:

- preview: `jue apply --dry-run`
- CI: `jue apply --check`
- diagnostics: `jue inspect --diagnostics`

## Author commands

| Namespace | Subcommands |
| --- | --- |
| [`jue capability`](capability.md) | `update` |
| [`jue preset`](preset.md) | Planned: `create`, `validate`, `pack` |
| [`jue extension`](extension.md) | `validate` |

Resource queries use `jue list [presets|prompts|skills|all]` (list Preset,
prompt, and skill inventories) and `jue inspect --extension <id>` (Extension
diagnostics).

## Global options

| Option | Meaning |
| --- | --- |
| `--lang` (alias `-l`) | Runtime language override (e.g. en, zh) |
| `--verbose` (alias `-v`) | Log Adapter decisions and detailed output |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success, or `--check` found no required change |
| `1` | Config validation failure, internal error, or apply rollback |
| `2` | Unsupported Artifact kind or scope |
| `3` | Drift, ownership, or write conflict |
| `4` | Required action not approved |

See [implementation status](../../developer/implementation-status.md) for gaps
between this target contract and current code.
