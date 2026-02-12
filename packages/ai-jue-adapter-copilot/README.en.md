# ai-jue-adapter-copilot

<div align="center">

**Adapter for GitHub Copilot: Generating .github/copilot-instructions.md**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-copilot.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-copilot)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) monorepo.

</div>

---

## Features

This adapter transforms `ai-jue` configurations into GitHub Copilot format, supporting:

- **Custom Instructions**: Generating `.github/copilot-instructions.md`.
- **Explicit Degradation**: Mapping unsupported capabilities (`rules/mcp/agents`) into explicit textual guidance instead of silent drop.
- **Tool Settings**: `tools.copilot` -> `.github/copilot-settings.json`.

## Installation

```bash
npm install ai-jue-adapter-copilot
```

## Documentation

For usage, please refer to the main [ai-jue](https://github.com/zenHeart/ai-jue) documentation.

## License

[MIT](LICENSE)
