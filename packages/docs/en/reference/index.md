# Reference Overview

Reference is the source of truth for fields, commands, and interfaces:

| Reader | Start with | Then if needed |
| --- | --- | --- |
| User | [CLI](cli/), [project config](project-config.md) | [Glossary](glossary.md) |
| Preset author | [Preset npm package](preset-manifest.md) | CLI author commands |
| Extension author | [Extension API](extension-api.md) | [Adapter standard](../architecture/adapter-standardization.md) |

## Complete user surface

`jue init` initializes; `jue apply --dry-run` previews; `jue apply` writes and
confirms; `jue apply --check` performs CI checks; `jue inspect` explains and
diagnoses Presets, Capabilities, Adapters, and Artifacts.

Presets and Extensions use npm for installation, upgrades, and publishing. See
[implementation status](../developer/implementation-status.md) for current gaps.
