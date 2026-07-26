# Core Workflow

## `jue init`

```bash
jue init [--preset <ref>...] [--target <id>...] [--yes]
```

Creates minimal `ai.config.js` and never silently overwrites existing config.
Existing package managers install Presets and Extensions.

## `jue apply`

```bash
jue apply \
  [--from <canonical|agent>] \
  [--target <agent>...] \
  [--all] \
  [--artifact <kind>] \
  [--scope <project|user>] \
  [--dry-run | --check] \
  [--approve <action>...] \
  [--watch]
```

One invocation reads and validates input, converts it to the Canonical DSL,
computes Artifact changes, shows risk, writes, and confirms through a
target-native read path.

| Mode | Writes | Purpose |
| --- | --- | --- |
| default | Yes | Apply changes and confirm |
| `--dry-run` | No | Preview changes, degradation, and approval |
| `--check` | No | CI check for validity, drift, and confirmation availability |

`--from <agent>` imports or migrates from an Agent; conversion still passes
through the Canonical DSL. Network access, dependency installation, processes,
and user-level writes require an exact visible action and approval.

## `jue inspect`

```bash
jue inspect \
  [--capability <id>] \
  [--preset <id>] \
  [--extension <id>] \
  [--target <agent>] \
  [--artifact <kind>] \
  [--diagnostics]
```

Without filters it summarizes configuration, Presets, Capabilities, target
Adapters, and Artifacts. `--diagnostics` also checks Extension API compatibility,
npm resolution, permission ceilings, target runtime, ownership conflicts, and
native confirmation paths. It never writes configuration, locks, or Artifacts.

## JSON output

`--json` writes one stable envelope to stdout and logs to stderr. Diagnostics
include stable `code`, `severity`, `message`, and actionable `remediation`, with
credentials and personal data removed.
