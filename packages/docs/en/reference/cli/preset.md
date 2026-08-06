# Preset Author Commands

The CLI exposes `create-preset`, `validate`, and `format` for Preset authors:

```bash
jue create-preset <name>
jue validate
jue format
```

| Command | Behavior |
| --- | --- |
| `create-preset <name>` | Scaffolds an ordinary npm package (`jue-preset-<name>`) and minimal Canonical directories |
| `validate` | Validates the current project config: `presets` array, preset installation, and `extends` paths |
| `format` | Migrates AI tool configs to the `.ai` directory |

Query Preset inventories with `jue list presets`. Existing package managers own
installation, upgrades, version comparison, publishing, and removal.

## Planned author namespace

The target shape of these commands is a `jue preset` author namespace (planned,
not yet implemented; not to be treated as available):

```bash
jue preset create <name> [--dir <path>] [--extends <preset>...]
jue preset validate <path-or-package>
jue preset pack <path> [--out <dir>]
```

- `create`: scaffolds an ordinary npm package and minimal Canonical directories.
- `validate`: checks `package.json#ai`, paths, references, sensitive data, and
  packability.
- `pack`: follows npm pack semantics without running package scripts and emits
  content hashes.
