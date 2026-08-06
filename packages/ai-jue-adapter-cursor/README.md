# ai-jue-adapter-cursor

> AI-Jue adapter for Cursor (project + Plugin Artifact)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) monorepo.

## Artifacts

| Kind | CLI | Output |
| --- | --- | --- |
| **project** (default) | `jue apply --adapter cursor` | `.cursor/*` + root `AGENTS.md` |
| **plugin** | `jue apply --adapter cursor --artifact plugin` | `.cursor-plugin/plugin.json` + root `rules/`, `skills/`, `commands/`, `agents/`, `hooks/hooks.json`, `mcp.json` |

Docs: [`packages/docs/agents/cursor.md`](../docs/agents/cursor.md) ·
[`canonical-model §5.2`](../docs/specs/canonical-model.md) ·
[`fixtures/README.md`](fixtures/README.md) (manual Plugin load steps)

## Installation

```bash
npm install ai-jue-adapter-cursor
```

## License

MIT
