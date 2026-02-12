# ai-jue-adapter-cursor

<div align="center">

**Adapter for Cursor: capability mapping to native Cursor artifacts**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-cursor.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-cursor)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) monorepo.

</div>

---

## Features

This adapter maps canonical `ai-jue` capabilities into Cursor-native outputs:

- **Global Context**: `AGENTS.md/context.global` -> `.cursor/rules/agents.mdc`
- **Project Rules**: `rules/*` -> `.cursor/rules/*.mdc`
- **Commands**: `commands/*` -> `.cursor/commands/*.md`
- **Skills**: `skills/*` -> `.cursor/skills/*/SKILL.md`
- **Hooks**: `hooks/*` -> `.cursor/hooks.json`
- **MCP Servers**: `mcp.servers` -> `.cursor/mcp.json`

## Installation

```bash
npm install ai-jue-adapter-cursor
```

## Documentation

For usage, please refer to the main [ai-jue](https://github.com/zenHeart/ai-jue) documentation.

## License

[MIT](LICENSE)
