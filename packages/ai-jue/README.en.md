# ai-jue

<div align="center">

**Reshaping AI Collaboration Paradigm: Transforming fragmented development experience into standardized project assets**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

Standardize project's AI capabilities (Prompts, Skills, MCP Servers), automatically adapting to editors like Claude Code / Cursor / Gemini / Copilot.

[**📖 Why the name ai-jue (AI 诀)?**](#why-the-name-ai-jue-ai-诀)

```bash
npm install -D ai-jue jue-preset-react
npx jue apply
```

</div>

---

## Why the name ai-jue (AI 诀)?

**“诀” (jué)**, in Chinese culture, represents highly concentrated knowledge and extremely efficient operational guidance:

- **Mnemonic (口诀)**: Simplifying complex engineering instructions into something easy to remember and spread.
- **Secret Recipe (秘诀)**: Unique AI interaction strategies accumulated by top developers in specific fields.
- **Knack (诀窍)**: The key assets that allow AI performance to jump from "mediocre" to "exceptional".

Named **ai-jue**, it is more than just a configuration tool; it is an **"AI Experience Filter"**. It distills fragmented inspirations into structured "AI Secret Recipes (Presets)", allowing high-quality collaboration strategies to flow seamlessly across different projects.

---

## Why ai-jue?

1. **Configuration Fragmentation**
    - **Problem**: Every AI editor has independent config files (`.gemini/`, `CLAUDE.md`, `.cursor/rules/`, etc.). Maintaining these separately is tedious.
    - **Solution**: Provides a unified entry `ai.config.js`. Configure once, generate all.

2. **Experience Fragmentation**
    - **Problem**: High-value AI experiences (good prompts/skills) are usually scattered and hard to formalize.
    - **Solution**: The `.ai` directory creates a **self-reinforcing cycle**. Assets accumulated in a project settle in `.ai/`, and can be packaged into a preset via `jue create-preset`.

---

## Quick Start

### 1. Installation

```bash
npm install -D ai-jue jue-preset-react
```

### 2. Create Configuration

```javascript
// ai.config.js
export default {
  preset: 'react'
}
```

### 3. Apply Configuration

```bash
npx jue apply
```

Done! `ai-jue` automatically generates config files for each editor:

- ✓ `CLAUDE.md` — Claude Code
- ✓ `.cursor/rules/*.mdc` — Cursor
- ✓ `.gemini/settings.json` — Gemini CLI

---

## Core Features

- 🎯 **Multi-Preset Composition**: Supports `presets: ['base', 'react', 'typescript']`.
- 📁 **Local Asset Extension**: Add project-specific prompts and skills via the `.ai` directory.
- 🔌 **MCP Server Distribution**: One-click configuration sync for global/project-level MCP nodes.
- 👀 **Watch Mode**: Real-time auto-generation upon config changes.
- 🛡️ **Intelligent Coexistence**: Updates only marked blocks, preserving manual edits.

---

## CLI Commands

```bash
npx jue init              # Interactive configuration initialization
npx jue apply             # Apply configuration and generate files
npx jue apply --watch     # Watch for changes and re-apply
npx jue create-preset <n> # Initialize a new preset project
npx jue list              # List active presets and assets
```

---

## License

[MIT](LICENSE)
