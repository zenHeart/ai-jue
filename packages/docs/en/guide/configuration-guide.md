# Project Configuration Guide

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

Each `presets` entry is an npm package name; which source it resolves to is
decided by the dependency declared in the consuming project's `package.json`.
For developing an unpublished Preset locally, see
[Developing a Preset Locally](local-preset-development.md).

Auto Artifact selection uses the Adapter's stable default. Select Plugin,
compatible-bundle, skill-plugin, or another non-default shape explicitly with
`artifact` or `--artifact`. Selection performs no implicit install, network,
process, or user-level write.

Use `jue apply --adapter codex --dry-run`, `jue apply --adapter codex`, and
`jue apply --adapter codex --check`; review all degraded, unsupported, and
blocked results before writing. See [Cross-Agent Migration](migration.md).
