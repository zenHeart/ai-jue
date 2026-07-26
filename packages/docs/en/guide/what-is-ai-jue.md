# What is Jue?

Jue is an AI capability standardization and Agent adaptation layer.

It organizes `skills`, `agents`, `commands`, `rules`, `hooks`, and MCP
configuration scattered across different tools into one stable, general
capability model, then converts it via Adapters into the native format of
target Agents such as Claude, Cursor, and Codex.

## The Capability → Preset → Adapter model

- **Capability**: the smallest asset an Agent can use.
- **Preset**: a versionable, composable, distributable collection of
  capabilities. A target Agent may present it as a plugin, extension, or
  native configuration.
- **Adapter**: the boundary layer that converts the unified capability model
  into a target Agent's native format.

```text
Preset / .ai / ai.config.js
             ↓
     Jue Canonical Model
             ↓
          Adapter
             ↓
   Native output per Agent
```

This abstraction decouples capability definitions from any single Agent.
A team or individual maintains one capability set; Adapters absorb
per-Agent differences, and configuration that truly cannot be shared stays
in the `tools.<tool>` escape hatch.

See [Jue MVP: AI Capability Standard and Agent Adaptation](../specs/jue-mvp.md)
for the full MVP definition and acceptance boundary, and the
[Glossary](../reference/glossary.md) for one-line definitions of every term with links to
their authoritative specs.
