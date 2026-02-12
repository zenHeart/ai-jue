# ai-jue-adapter-claude

<div align="center">

**Adapter for Claude Code: CLAUDE.md + MCP + Claude settings**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-claude.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-claude)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) monorepo.

</div>

---

## Features

This adapter maps canonical `ai-jue` capabilities into Claude outputs:

- **Context/rules/commands/skills/hooks/agents** -> `CLAUDE.md` (global context is referenced via `@AGENTS.md`; `rules` are explicit degradation mapping).
- **MCP**: `mcp.servers` -> `.mcp.json`.
- **Tool config**: `tools.claude` -> `.claude/settings.json`.

## Installation

```bash
npm install ai-jue-adapter-claude
```

## Documentation

For usage, please refer to the main [ai-jue](https://github.com/zenHeart/ai-jue) documentation.

## License

[MIT](LICENSE)
