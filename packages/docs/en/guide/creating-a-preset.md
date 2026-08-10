# Creating a Preset

A Preset is a declarative Capability set without executable Extension code or
target lifecycle state.

## 1. Create the directory

Use only needed paths: `package.json`, `README.md`, `AGENTS.md`, `skills/`,
`commands/`, `rules/`, `agents/`, `hooks/`, `mcp.json`, and `tools/`.

## 2. Write the manifest

```json
{
  "name": "jue-preset-team",
  "version": "1.0.0",
  "ai": {
    "presets": ["base"],
    "capabilities": {}
  }
}
```

See [Preset Manifest Reference](../reference/preset-manifest.md).

## 3. Add capabilities

Place owned capabilities directly in their directories. Use `ai.capabilities`
for shared or third-party content. Put target-private configuration under
`tools/<target>/config.json`. Runtime code belongs in a separate Jue Extension.

## 4. Validate and package

`jue validate` checks the **consuming project's** `ai.config.js` (`presets`
array, preset installation, `extends` paths) — not the Preset itself. During
local development, wire the Preset into a consuming project with a local
path dependency first (see
[Developing a Preset Locally](./local-preset-development.md)), then run:

```bash
npx jue validate
```

Before publishing, use `npm pack` to preview the package contents:

```bash
npm pack --dry-run
```

Validation covers manifests, Canonical directories, dependency cycles, path
traversal, credentials, and sensitive data. Pack emits an explicit inventory.

## 5. Consume

```js
export default {
  presets: ["team"],
  targets: {
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" }
  }
};
```

The Adapter selects and produces the target Artifact without duplicating Presets.
