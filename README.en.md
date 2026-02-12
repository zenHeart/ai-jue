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
npx jue apply --all
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
npx jue apply --all
```

On first run in a new project, if no `ai.config.js` / `jue.config.js` (or rc variants) is detected, `jue apply` starts an initialization flow first (similar to `eslint init`), then continues apply.
This guided flow does not create an empty `.ai` scaffold by default; `.ai` is created later only for progressive local asset enhancement.

Done! `ai-jue` generates tool files automatically:

```
✓ CLAUDE.md                          — Claude Code
✓ .cursor/rules/*.mdc                — Cursor (generated from rules/ when rules exist)
✓ .gemini/settings.json              — Gemini CLI
✓ .github/copilot-instructions.md    — GitHub Copilot
✓ AGENTS.md                          — Cursor native global context entry (project root)
```

---

## Core Features

### Minimal Knowledge Principle

`ai-jue` reuses mainstream tool conventions instead of inventing new concepts:

- Root `AGENTS.md`: auto-injected as global context when present
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

`AGENTS.md` merge behavior under nested presets:

- Layered append semantics (no replacement)
- Order: dependency presets -> current preset -> `.ai/AGENTS.md` -> root `AGENTS.md` -> `ai.config.js context.global`
- Structured capabilities (`rules/commands/...`) still use deep object merge where later values override earlier ones

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
npx jue apply --all --watch
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
npx jue apply --adapter cursor --adapter gemini --adapter claude  # Apply only selected adapters
npx jue apply -a          # Apply all discovered adapters (same as --all)
npx jue apply             # Auto-detect adapters from existing tool footprints
npx jue apply --all --watch  # Watch and re-apply with explicit adapters
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

## Release Flow

This repository uses a "local version/tag orchestration -> GitHub Actions publish" model.

```bash
npm run release
```

`npm run release` now triggers the `prerelease` hook first:

```bash
npm run release-gate:v1.1
```

The release gate checks:

1. Workspace build (`npm run build`)
2. Critical config test (`packages/ai-jue/test/config.test.ts`)
3. Docs build (`npm run docs:build`)
4. Package metadata consistency (`check-consistency`)
5. Base preset i18n structure (`check-base-i18n`)
6. Bootstrap smoke for base/internal (`smoke-apply`)
7. Required release files (`release-note.md`, `packages/ai-jue/CHANGELOG.md`)

After the gate passes, `release` continues to:

1. Detect changed packages from git diff/tag history
2. Let you choose versioning strategy (patch/minor/major)
3. Generate changelog, create tags, and push

Publish workflow is triggered when:

1. Changes are pushed/merged into `main`
2. The commit includes `release-note.md` changes (see `.github/workflows/release.yml`)

Then GitHub Actions performs npm publish via OIDC trusted publishing.

---

## License

[MIT](LICENSE)
