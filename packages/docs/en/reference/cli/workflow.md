# Core Workflow

## `jue init`

`jue init` takes no options. It prompts interactively: whether to create a config file, which preset to use (default `base`), whether to install the preset package via npm/pnpm/yarn, and whether to create the `.ai/` directory structure. It then writes a minimal `ai.config.js` (`ai.config.cjs` in ESM projects).

If a config already exists, `init` skips creation and prints a warning; it never silently overwrites.

```bash
jue init
```

## `jue apply`

```bash
jue apply [--watch] [--adapter <name>...] [--all] [--frozen] \
          [--dry-run | --check] [--scope <project|user>] \
          [--artifact <kind> | --artifact-kind <kind>]
```

| Option | Description |
| --- | --- |
| `--watch`, `-w` | Re-run apply whenever the config or `.ai/` files change |
| `--adapter <name>...` | Target specific adapters; repeatable. Accepts aliases like `codex`, `claude`, `claude-code`, `cursor`, `openclaw`, `hermes` |
| `--all`, `-a` | Apply to every available target in the config |
| `--frozen` | Require immutable Capability Source references |
| `--dry-run` | Preview changes without writing; always exits 0 |
| `--check` | Check configuration, drift, and confirmation availability without writing |
| `--scope <project\|user>` | Select the Artifact installation boundary; overrides `targets.<adapter>.scope`, default `project` |
| `--artifact <kind>`, `--artifact-kind <kind>` | Artifact kind: `project`, `workspace`, `plugin`, `compatible-bundle`, `skill-plugin`, depending on what the adapter supports |

One invocation reads and validates the config, converts it to the Canonical DSL, resolves the plugin manifest, computes changes through the adapter's `write()`, then handles the chosen mode. A failure in any stage must not report success.

| Mode | Writes | Purpose |
| --- | --- | --- |
| default | Yes | Apply changes atomically |
| `--dry-run` | No | Preview Artifact changes; always exits 0 |
| `--check` | No | CI check for configuration, drift, and confirmation availability; non-zero exit if anything is outstanding |

`apply` requires no interactive authorization; use `--dry-run` and `--check` for
previews and CI validation. User scope still resolves configuration from the
current project, but writes Artifacts to each target Agent's native user path.
User scope requires an explicit `--adapter`, `--all`, or `targets` selection;
project footprints are not user-home authorization. The misspelled `--adpater`
is still accepted and prints a warning.

Exit codes: no change or applied 0, pending or blocked by drift 3, unauthorized
4, rolled back 1. An unsupported scope or a user-scope Plugin-class Artifact
combination exits 2.

## `jue inspect`

```bash
jue inspect [--extension <id>] [--diagnostics]
```

`--extension <id>` selects the Extension package to inspect; `--diagnostics` appends diagnostics. Without `--extension`, it prints a warning and exits, with no summary.

`--diagnostics` reports the Extension's npm resolution issues, the capability-support levels of its declared Adapters, and the current project's apply readiness (pending changes, drift conflicts, unauthorized changes). The command never writes configuration, locks, or Artifacts.

## JSON output

There is no unified `--json` option. The only command with `--json` is `jue check` (checks installed preset versions), which prints a preset-list JSON to stdout:

```json
{
  "presets": [
    {
      "preset": "base",
      "packageName": "jue-preset-base",
      "installedVersion": "1.0.0",
      "latestVersion": "1.1.0",
      "hasUpdate": true
    }
  ]
}
```

Each entry carries `preset`, `packageName`, `installedVersion` (`"unknown"` when it cannot be resolved), `latestVersion`, and `hasUpdate`. Entries whose npm lookup failed carry no version fields, only `preset`, `packageName`, and `error`.
