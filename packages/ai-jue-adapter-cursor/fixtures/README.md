# Cursor adapter fixtures

Neutral, offline fixtures for `packages/ai-jue-adapter-cursor` contract tests.

## Layouts

| Directory | Artifact kind | Purpose |
| --- | --- | --- |
| `project/` | project | Full `.cursor/*` tree + managed `AGENTS.md` |
| `plugin/` | plugin | Full plugin tree + `.cursor-plugin/plugin.json` + `variables` |
| `plugin-minimal/` | plugin | Manifest + one skill |

## Manual Plugin verification

Cursor has no headless `validate` CLI. To load a generated plugin locally:

```bash
mkdir -p ~/.cursor/plugins/local
ln -sf "$(pwd)/<output-dir>" ~/.cursor/plugins/local/my-plugin
```

Then run **Developer: Reload Window** in Cursor and verify rules, skills, and MCP
under **Customize**.
