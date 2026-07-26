# Project Configuration Reference

> [!WARNING]
> This page defines the target contract. `targets`, `extensions`, and complete
> Artifact selection are not fully implemented. See
> [Implementation Status](../developer/implementation-status.md).

The only project configuration file is root `ai.config.js`. It selects Presets,
Extensions, and Targets and supplies highest-priority project overrides.
Preset `package.json#ai` is a different container; see
[Preset Manifest](preset-manifest.md).

```js
export default {
  presets: ["base", "team"],
  capabilities: {},
  extensions: ["jue-extension-openclaw"],
  targets: {
    codex: { artifact: "auto" },
    openclaw: { artifact: "compatible-bundle" }
  },
  context: { global: "Project-specific constraints." },
  skills: {},
  agents: {},
  commands: {},
  rules: {},
  hooks: {},
  mcp: { servers: {} },
  tools: { codex: {}, openclaw: {} },
  language: "en"
};
```

## Top-level fields

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `presets` | `string[]` | `[]` | Ordered Preset references |
| `capabilities` | `Record<string, CapabilityRef>` | `{}` | External leaf Capabilities |
| `extensions` | `string[]` | `[]` | Explicitly trusted executable packages |
| `targets` | `Record<string, TargetSelection>` | `{}` | Targets and Artifact choices |
| `context.global` | `string` | `""` | Highest-priority project context |
| `skills` | `Record<string, Skill>` | `{}` | Inline skill overrides |
| `agents` | `Record<string, Agent>` | `{}` | Inline agent overrides |
| `commands` | `Record<string, Command>` | `{}` | Inline command overrides |
| `rules` | `Record<string, Rule>` | `{}` | Inline rule overrides |
| `hooks` | `Record<string, Hook>` | `{}` | Inline hook overrides |
| `mcp.servers` | `Record<string, McpServer>` | `{}` | MCP servers |
| `tools` | `Record<string, unknown>` | `{}` | target-specific settings |
| `language` | `"zh" \| "en"` | `"en"` | Generated-content language |

Unknown fields fail.

## `TargetSelection`

| Field | Type | Default | Rule |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Disabled Targets do not join `--all` |
| `artifact` | `string \| "auto"` | `"auto"` | Declared by the Adapter |
| `scope` | `"project" \| "local" \| "user"` | `"project"` | User writes require approval |

`auto` prefers an existing Jue-managed Artifact, then the Adapter's unique
default, and otherwise fails with candidates.

## Extension loading

Installing a dependency is not trust. Only packages explicitly listed in
`extensions` load executable entrypoints. Built-in Adapters need no duplicate
entry. `apply` shows and authorizes every actual side effect before execution.

## Merge order

Nested ordered Presets, project external Capability references, project `.ai/`,
root `AGENTS.md`, and inline Canonical fields form Canonical input.
`tools.<target>` is passed separately as current-target configuration. Context
appends; structured capabilities deep-merge by ID; type conflicts fail;
overrides record provenance. Target, Extension, Artifact selection, and
`tools.<target>` never enter the Canonical DSL.

## Discovery and errors

Core loads project configuration only from `--config` or `<cwd>/ai.config.js`.
Load failure, unknown fields, duplicate IDs, invalid Targets, or incompatible
Extension APIs exit `2` and prevent partial apply.
