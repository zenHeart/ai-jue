# Project Configuration Guide

> [!WARNING]
> This page defines the target contract. `targets`, Artifact selection, and the
> migration commands below are not fully implemented. See
> [Implementation Status](../developer/implementation-status.md).

Most projects select Presets and targets:

```js
export default {
  presets: ["base", "team"],
  targets: {
    "claude-code": { artifact: "plugin" },
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" },
    hermes: { artifact: "auto" }
  }
};
```

See [Project Configuration Reference](../reference/project-config.md).

Use `presets` for capability sets, `capabilities` for individual external
content, `targets` for delivery choice, `tools.<target>` for private overlays,
and inline Canonical fields for project-level public overrides.

Auto Artifact selection prefers an inspected existing Artifact, then the Target
default, and otherwise fails with candidates. Detection never performs an
implicit install, network, process, or user-level write.

Use `jue apply --dry-run`, `jue apply`, and `jue apply --check`; review all
degraded, unsupported, and blocked results before writing.
