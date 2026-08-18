# Project Configuration Reference

> [!NOTE]
> `targets.<adapter>` `artifact`, `enabled`, and `scope` values participate in
> apply selection. `scope` is exactly `project | user`; CLI `--scope` wins over
> target configuration, and the default is `project`. An Adapter must
> explicitly declare `user` support before it can write under the user home.

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
    claude: { artifact: "project", scope: "user" },
    codex: { artifact: "auto", scope: "project" }
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
| `enabled` | `boolean` | `true` | `false` skips auto-discovery and `--all`; an explicit `--adapter` remains an explicit user selection |
| `artifact` | `string \| "auto"` | `"auto"` | Declared by the Adapter |
| `scope` | `"project" \| "user"` | `"project"` | Select the project or user Artifact root; fail before writing when unsupported by the Adapter |

`auto` selects the Adapter's stable default Artifact. Select a non-default
Artifact explicitly through `artifact` or `--artifact`; the selection stays in
the Artifact conversion environment and never enters Canonical DSL.

Config discovery and Artifact roots are independent. `scope: "user"` still
loads Presets, Capabilities, and the lock from the current project, while Core
authorizes the user home as the Artifact root. Plugin, compatible-bundle, and
skill-plugin kinds cannot be combined with user scope.

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
Extension APIs exit `1` and prevent partial apply.
