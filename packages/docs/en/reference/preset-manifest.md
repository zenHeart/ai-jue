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

At least one local Capability, Preset, or Capability reference is required.

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

## Capability inventory

| Path | Canonical |
| --- | --- |
| `AGENTS.md` | `context.global` |
| `skills/<id>/SKILL.md` | `skills.<id>` |
| `commands/<id>.md` or `commands/<id>/prompt.md` | `commands.<id>` |
| `rules/<id>.md` or `rules/<id>/prompt.md` | `rules.<id>` |
| `agents/<id>.md` or `agents/<id>/prompt.md` | `agents.<id>` |
| `hooks/<id>.md`, `hooks/<id>/prompt.md`, or `hooks/<id>/index.json` | `hooks.<id>` |
| `mcp.json` | `mcp` |
| `tools/<target>/config.json` | non-Canonical configuration for that target |

Use one Markdown file for a simple Capability and a same-name directory when
directory structure is needed. One `<id>` within a Capability type uses exactly
one mode. Markdown frontmatter becomes Canonical metadata and the body becomes
Capability content; a hook body becomes `script`. Pair a language variant named
`<id>.<language>.md` with `<id>.md`.

Presets contain no Extension entrypoint, install state, credential, user state,
or target Plugin runtime code.

Presets reuse npm packages and add no standalone manifest. Keep declarative
Preset data and executable Extension code in separate npm packages.
