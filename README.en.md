# ai-jue

<div align="center">

**Reshaping AI Collaboration Paradigm: Transforming fragmented development experience into standardized project assets**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml/badge.svg)](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml)

[English](README.en.md) | [简体中文](README.md)

Standardize project AI capabilities (Prompts, Skills, MCP Servers), automatically adapting to Claude Code / Cursor / Gemini / Copilot.

[**📖 Why the name ai-jue (AI 诀)?**](#why-the-name-ai-jue-ai-诀)

```bash
npm install -D ai-jue jue-preset-react
npx jue apply
```

</div>

---

## Why the name ai-jue (AI 诀)?

**“诀” (jué)**, in Chinese culture, represents highly concentrated knowledge and efficient guidance:

- **Mnemonic (口诀)**: Simplifying complex engineering instructions into easy, reusable guidance.
- **Secret Recipe (秘诀)**: AI collaboration strategies accumulated by top developers in a specific domain.
- **Knack (诀窍)**: The key assets that move AI output from mediocre to excellent.

`ai-jue` is not just a config conversion tool. It acts as an **AI experience filter** that turns fragmented ideas into structured presets for repeatable, shareable collaboration quality.

---

## Why ai-jue?

1. **Configuration Fragmentation**
   - **Problem**: Every AI editor has separate config surfaces (`.gemini/`, `CLAUDE.md`, `.cursor/rules/`, etc.). Maintaining them manually across projects is costly.
   - **Solution**: Use one entry file `ai.config.js`; generate multi-tool configs automatically.

2. **Experience Fragmentation**
   - **Problem**: Valuable prompts/skills/context are often scattered in notes and hard to reuse.
   - **Solution**: Use `.ai/` as a structured asset workspace. Once mature, package assets into npm presets via `jue create-preset`.

**Mission**: Make AI development capability standardized, engineered, and reusable - like ESLint for AI collaboration.

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

### 3. Generate Config Files

```bash
npx jue apply
```

Done! `ai-jue` generates tool files automatically:

```
✓ CLAUDE.md                          — Claude Code
✓ .cursor/rules/*.mdc                — Cursor (Project Rules)
✓ .gemini/settings.json              — Gemini CLI
✓ .github/copilot-instructions.md    — GitHub Copilot
```

---

## Core Features

### Minimal Knowledge Principle

`ai-jue` reuses mainstream tool conventions instead of inventing new concepts:

- `skills/`: skill assets
- `AGENTS.md`: global system context and constraints
- `commands/`: custom commands
- `rules/`: project rules
- `agents/`: custom agents (canonical term)
- `hooks/`: lifecycle hooks
- `tools/<tool>/`: tool-specific escape hatch config
- `ai.config.js`: unified runtime/config entry
- `.ai/`: local asset workspace for later preset publishing

Terminology policy:

- Canonical name is `agents`.

### 🎯 Multi-Preset Composition

```javascript
// ai.config.js
export default {
  presets: ['base', 'react', 'typescript']
}
```

### 📁 Local Asset Extension

```javascript
// ai.config.js
export default {
  preset: 'react',
  extends: {
    prompts: './prompts/custom-rules.md',
    skills: ['./skills/deploy.md']
  }
}
```

### 🔌 MCP Server Distribution

```javascript
// ai.config.js
export default {
  preset: 'react',
  mcp: {
    servers: {
      'my-db': { command: 'npx', args: ['@myteam/mcp-server-db'] }
    }
  }
}
```

### 👀 Watch Mode

```bash
npx jue apply --watch
```

### 🛡️ Intelligent Coexistence

- `.md`: update only `<!-- AI-JUE:START -->` ... `<!-- AI-JUE:END -->` blocks.
- `.json`: deep-merge managed fields without clobbering user fields.

---

## How it Works

```
ai.config.js          →  Load Presets & Merge Config  →  Adapter Plugins Generate Files
┌──────────────┐       ┌───────────────────┐    ┌─────────────────────────┐
│ preset: 'react'│ →  │  ai-jue-core       │ → │ adapter-claude → CLAUDE.md      │
│ mcp: {...}    │      │  (Micro-kernel)    │    │ adapter-cursor → .cursor/rules/*.mdc │
│ commands: {}  │      │  Merge & Route     │    │ adapter-gemini → settings.json  │
└──────────────┘       └───────────────────┘    │ adapter-copilot→ instructions   │
                                                └─────────────────────────────────┘
```

---

## CLI Commands

```bash
npx jue init              # Interactive configuration initialization
npx jue apply             # Apply configuration and generate files
npx jue apply --watch     # Watch for changes and re-apply automatically
npx jue check             # Check if presets have new versions
npx jue validate          # Validate configuration legality
npx jue list              # List all loaded presets and assets
npx jue create-preset <n> # Create a new preset project structure
```

---

## Creating Your Own Preset

```bash
npx jue create-preset my-team-preset
```

Generated preset structure:

```
my-team-preset/
├── package.json
├── AGENTS.md
├── skills/
├── commands/
├── rules/
├── agents/
├── hooks/
└── tools/
    ├── gemini/
    └── cursor/
```

---

## License

[MIT](LICENSE)
