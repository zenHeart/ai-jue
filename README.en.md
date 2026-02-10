# ai-jue

<div align="center">

**Reshaping AI Collaboration Paradigm: Transforming fragmented development experience into standardized project assets**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml/badge.svg)](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml)

[English](README.en.md) | [简体中文](README.md)

Standardize project's AI capabilities (Prompts, Skills, MCP Servers), automatically adapting to editors like Claude Code / Cursor / Gemini / Copilot.

[**📖 Why the name ai-jue (AI 诀)?**](#why-the-name-ai-jue-ai-诀)

```bash
npm install -D ai-jue jue-preset-react
npx jue apply
```

</div>

---

<!-- TABLE OF CONTENTS -->
<details>
<summary>📖 Table of Contents</summary>

- [ai-jue](#ai-jue)
  - [Why the name ai-jue (AI 诀)?](#why-the-name-ai-jue-ai-诀)
  - [Why ai-jue?](#why-ai-jue)
  - [Quick Start](#quick-start)
    - [1. Installation](#1-installation)
    - [2. Create Configuration](#2-create-configuration)
    - [3. Generate Config Files](#3-generate-config-files)
  - [Core Features](#core-features)
    - [🎯 Multi-Preset Composition](#-multi-preset-composition)
    - [📁 Local Asset Extension](#-local-asset-extension)
    - [Plug MCP Server Distribution](#-mcp-server-distribution)
    - [👀 Watch Mode](#-watch-mode)
    - [🛡️ Intelligent Coexistence](#️-intelligent-coexistence)
  - [Official Presets](#official-presets)
  - [How it Works](#how-it-works)
  - [CLI Commands](#cli-commands)
  - [Creating Your Own Preset](#creating-your-own-preset)
  - [Release Workflow](#release-workflow)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)
  - [License](#license)

</details>

---

## Why the name ai-jue (AI 诀)?

**“诀” (jué)**, in Chinese culture, represents highly concentrated knowledge and extremely efficient operational guidance:

- **Mnemonic (口诀)**: Simplifying complex engineering instructions into something easy to remember and spread.
- **Secret Recipe (秘诀)**: Unique AI interaction strategies accumulated by top developers in specific fields (like React, Rust).
- **Knack (诀窍)**: The key assets that allow AI performance to jump from "mediocre" to "exceptional".

Named **ai-jue**, it is more than just a configuration tool; it is an **"AI Experience Filter"**. It distills fragmented inspirations into structured "AI Secret Recipes (Presets)", allowing high-quality collaboration strategies to flow seamlessly across different projects.

---

## Why ai-jue?

`ai-jue` was born to solve the core pain point in the AI-aided development era: the inability to effectively accumulate, reuse, and share developer experience.

1. **Configuration Fragmentation**
    - **Problem**: Every AI editor has its own independent config files (`.gemini/`, `CLAUDE.md`, `.cursor/rules/`, etc.). Maintaining these separately across projects is tedious and prone to synchronization issues.
    - **Solution**: Provides a unified entry `ai.config.js`. Configure once, and generate config files for all editors automatically.

2. **Experience Fragmentation**
    - **Problem**: High-value experiences (good Prompts, Skills, context instructions) are mostly scattered in personal notes, making them hard to formalize or share with teams.
    - **Solution**: The `.ai` directory creates a **self-reinforcing cycle**. Assets accumulated in a project naturally settle in the `.ai/` directory. Once mature, they can be packaged into an npm preset with a single `jue create-preset` command, drastically lowering the cost of turning "personal knacks" into "team standards".

**Summary: The mission of `ai-jue` is to standardize, engineer, and assetize high-value AI development capabilities, becoming the ESLint of the AI development field.**

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

Done! `ai-jue` will automatically generate config files for each editor based on your project's AI strategy:

```
✓ CLAUDE.md                          — Claude Code
✓ .cursor/rules/*.mdc                — Cursor
✓ .gemini/settings.json              — Gemini CLI
✓ .github/copilot-instructions.md    — GitHub Copilot
```

---

## Core Features

### 🎯 Multi-Preset Composition

```javascript
// ai.config.js
export default {
  presets: ['base', 'react', 'typescript']
}
```

### 📁 Local Asset Extension

Add team-specific Prompts and Skills via the `.ai` directory:

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

- **.md Files**: Updates only the blocks enclosed by `<!-- AI-JUE:START -->` and `<!-- AI-JUE:END -->`, preserving your manual edits.
- **.json Files**: Deeply merges, adding or updating only the managed fields.

---

## Official Presets

| Preset | Description | Install |
|------|------|------|
| **jue-preset-base** | General best practices (Code Review, Git, Error Handling) | `npm i -D jue-preset-base` |
| **jue-preset-react** | React Hooks, Component Design, Performance | `npm i -D jue-preset-react` |
| **jue-preset-typescript** | Type Safety, Generics, Utility Types | `npm i -D jue-preset-typescript` |

---

## How it Works

```
ai.config.js          →  Load Presets & Merge Config  →  Adapter Plugins Generate Files
┌──────────────┐       ┌───────────────────┐    ┌─────────────────────────┐
│ preset: 'react'│ →  │  ai-jue-core       │ → │ adapter-claude → CLAUDE.md      │
│ mcp: {...}    │      │  (Micro-kernel)    │    │ adapter-cursor → .cursor/rules/ │
│ commands: {}  │      │  Merge & Route     │    │ adapter-gemini → settings.json  │
└──────────────┘       └───────────────────┘    │ adapter-copilot→ instructions   │
                                                └─────────────────────────────────┘
```

> See [architecture.md](packages/docs/guide/architecture.md) for detailed architecture.

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
├── prompts/
│   └── agents.md        # General prompts
├── skills/
│   └── deploy.md        # Skill definitions
└── tools/
    └── meta.json        # Tool configs (MCP, etc.)
```

After blooming it to npm, team members just need to:

```bash
npm install -D jue-preset-my-team
# ai.config.js → preset: 'my-team'
npx jue apply
```

> See [creating-a-preset.md](packages/docs/guide/creating-a-preset.md) for details.

---

## Release Workflow

This project uses a "Local Versioning & Tags → GitHub Actions Auto-Publish" model.

```bash
npm run release
```

This command automatically:

1. Detects changed packages based on `git diff`.
2. Interactively selects version strategies (patch/minor/major).
3. Generates CHANGELOG, creates tags, and pushes them.

After pushing, GitHub Actions triggers [release.yml](.github/workflows/release.yml), using npm Trusted Publisher (OIDC) to publish all changed packages in parallel.

---

## Roadmap

- [x] **v0.1** — MVP: `apply` command + Self-bootstrapping
- [x] **v0.2** — `init` / `check` / `extends` / Official Presets
- [x] **v1.0** — `create-preset` command + Comprehensive Docs
- [x] **v2.0** — `--watch` mode + VS Code Extension
- [ ] **Future** — Visual Config Tool, Advanced Config Language, More Integrations

> See [TODO.md](TODO.md) for the full roadmap.

---

## Contributing

Contributions are welcome!

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

- 🐛 [Report Issues](https://github.com/zenHeart/ai-jue/issues)
- 💡 [Feature Requests](https://github.com/zenHeart/ai-jue/discussions)
- 📦 [Create Presets](packages/docs/guide/creating-a-preset.md)

---

## License

[MIT](LICENSE)

<div align="center">

**Defining the Engineering Paradigm of AI Development, Letting First-Class Experience Bridge the Gap Between Tools and Projects** 🚀

</div>
