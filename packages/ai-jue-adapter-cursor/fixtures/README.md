# Cursor adapter fixtures

Neutral, offline fixtures for `packages/ai-jue-adapter-cursor` contract tests.

## Layouts

| Directory | Artifact kind | Purpose | Native manual verification |
| --- | --- | --- | --- |
| `project/` | project | Full `.cursor/*` tree + managed `AGENTS.md` | No headless validator; contract tests only |
| `plugin/` | plugin | Full plugin tree + `.cursor-plugin/plugin.json` + `variables` | Optional local load |
| `plugin-minimal/` | plugin | Manifest + one skill | Optional local load |

## Failure and security samples

| Directory | Expected behavior | Native manual verification |
| --- | --- | --- |
| `failures/sensitive-reference/` | `read()` rejects the explicitly synthetic literal MCP environment value through the shared credential contract; `write()` enforces the same contract | No |
| `failures/invalid-mcp-command/` | `read()` rejects a non-string MCP `command` through the Canonical schema | No |
| `failures/path-escape-skill-reference/` | `read()` preserves the skill data; `write()` rejects the support-file path before any Artifact changes are applied | No |
| `failures/path-escape-hook/` | `read()` keeps the command as opaque shell text; Jue does not reinterpret parent-directory segments as a structured file path | No |

Unknown hook event names remain opaque data until an official Cursor validation
contract can be replayed. These fixtures therefore encode only locally
deterministic schema and security outcomes.

## Manual Plugin verification

Cursor has no headless `validate` CLI. To load a generated plugin locally:

```bash
mkdir -p ~/.cursor/plugins/local
ln -sf "$(pwd)/<output-dir>" ~/.cursor/plugins/local/my-plugin
```

Then run **Developer: Reload Window** in Cursor and verify rules, skills, and MCP
under **Customize**.
