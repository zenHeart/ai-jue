# ai-jue-adapter-gemini

<div align="center">

**Adapter for Gemini CLI: Generating Gemini-native outputs**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-gemini.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-gemini)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) monorepo.

</div>

---

## Features

This adapter transforms `ai-jue` configs into Gemini CLI outputs:

- **System Settings**: `.gemini/settings.json` from `tools.gemini` plus hooks/agents/mcp mapping.
- **Custom Commands**: `commands/*` are converted to `.gemini/commands/**/*.toml` (Gemini CLI native command format).
  - YAML frontmatter `description` in `prompt.md` maps to TOML `description`
  - markdown body in `prompt.md` maps to TOML `prompt`
- **System Prompt**: `GEMINI.md` (references global context via `@AGENTS.md`, then layers `prompts.gemini`).
- **Rules Degradation**: canonical `rules` are explicitly written to `GEMINI.md` to avoid silent dropping.

## Installation

```bash
npm install ai-jue-adapter-gemini
```

## Documentation

For usage, please refer to the main [ai-jue](https://github.com/zenHeart/ai-jue) documentation.

## License

[MIT](LICENSE)
