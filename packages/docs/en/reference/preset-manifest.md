# Preset npm Package Convention

A Preset is a declarative Capability package, conventionally named
`jue-preset-<id>`, with Jue metadata at `package.json#ai`.

```json
{
  "name": "jue-preset-team",
  "version": "1.0.0",
  "ai": {
    "presets": ["base"],
    "capabilities": {
      "review": {
        "source": "file:../../capabilities/review",
        "type": "skill"
      }
    }
  }
}
```

## `package.json#ai`

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `presets` | No | `string[]` | Recursive dependencies |
| `capabilities` | No | `Record<string, CapabilityRef>` | External leaf references |

At least one directory Capability, Preset, or Capability reference is required.

## `CapabilityRef`

| Field | Required | Type |
| --- | --- | --- |
| `source` | Yes | `file:` / `npm:` / `github:` |
| `type` | Yes | `skill` / `agent` / `command` / `rule` / `hook` / `mcp` |
| `ref` | Conditional | Git ref |
| `path` | No | Relative path inside the source |
| `integrity` | No | Subresource Integrity hash |

Each reference is one Capability leaf. It neither expands Presets nor returns a
Capability collection.

## Directory inventory

| Path | Canonical |
| --- | --- |
| `AGENTS.md` | `context.global` |
| `skills/<id>/SKILL.md` | `skills.<id>` |
| `commands/<id>/prompt.md` | `commands.<id>` |
| `rules/<id>/prompt.md` | `rules.<id>` |
| `agents/<id>/prompt.md` | `agents.<id>` |
| `hooks/<id>/index.json` | `hooks.<id>` |
| `mcp.json` | `mcp` |
| `tools/<target>/config.json` | non-Canonical configuration for that target |

Presets contain no Extension entrypoint, install state, credential, user state,
or target Plugin runtime code.

Presets reuse npm packages and add no standalone manifest. Keep declarative
Preset data and executable Extension code in separate npm packages.
