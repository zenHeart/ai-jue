# Preset Author Commands

```bash
jue preset create <name> [--dir <path>] [--extends <preset>...]
jue preset validate <path-or-package>
jue preset pack <path> [--out <dir>]
```

`create` scaffolds an ordinary npm package and minimal Canonical directories.
`validate` checks `package.json#ai`, paths, references, sensitive data, and
packability. `pack` follows npm pack semantics without running package scripts
and emits content hashes.

Use `jue inspect --preset <ref>` for queries. Existing package managers own
installation, upgrades, version comparison, publishing, and removal.
