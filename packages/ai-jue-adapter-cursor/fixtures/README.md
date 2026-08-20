# Cursor adapter fixtures

Neutral, offline fixtures for `packages/ai-jue-adapter-cursor` contract tests.

## Layouts

| Directory | Artifact kind | Purpose |
| --- | --- | --- |
| `project/` | project | Full `.cursor/*` tree + managed `AGENTS.md` |
| `plugin/` | plugin | Full plugin tree + `.cursor-plugin/plugin.json` + `variables` |
| `plugin-minimal/` | plugin | Manifest + one skill |
| `marketplace/` | target-private index | `.cursor-plugin/marketplace.json` + two independent Plugin roots |

The marketplace fixture follows the official Cursor `plugin-template` shape
verified on 2026-08-20. Its index is validated structurally; each local source
contains its own `.cursor-plugin/plugin.json` and remains a separate Plugin
Artifact.

## Manual Plugin verification

Cursor has no headless `validate` CLI. To load a generated plugin locally:

```bash
mkdir -p ~/.cursor/plugins/local
ln -sf "$(pwd)/<output-dir>" ~/.cursor/plugins/local/my-plugin
```

Then run **Developer: Reload Window** in Cursor and verify rules, skills, and MCP
under **Customize**.
