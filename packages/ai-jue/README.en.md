# ai-jue

<div align="center">

**One engineering entry for AI tooling, with reusable collaboration assets**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

</div>

## Positioning

`ai-jue` addresses two core problems:

1. Configuration fragmentation across AI tools.
2. Experience fragmentation of prompts/skills/rules.

## Minimal Usage

```bash
npm install -D ai-jue jue-preset-react
npx jue apply
```

Typical outputs:

- `CLAUDE.md`
- `.cursor/rules/*.mdc`
- `.gemini/settings.json`
- `.github/copilot-instructions.md`
- `AGENTS.md` (Cursor native entry)

## Directory & Concepts (Minimal Knowledge Principle)

- Root `AGENTS.md`: auto-injected as global context when present
- `AGENTS.md`: global system context
- `skills/`: skill assets
- `commands/`: command assets
- `rules/`: rule assets
- `agents/`: agent assets (canonical term)
- `hooks/`: hook assets
- `tools/<tool>/`: tool-private config escape hatch
- `.ai/`: local asset workspace
- `ai.config.js`: unified config entry

## Preset Nesting

- A preset can declare dependent presets via `ai.presets` (or `jue.presets`) in its own `package.json`.
- Load order is dependencies first, then the current preset; current preset overrides on conflicts.
- Example: `internal` depends on `base`, so users can keep `preset: "internal"` only.
- `AGENTS.md` uses layered append semantics (not replacement): dependency presets -> current preset -> `.ai/AGENTS.md` -> root `AGENTS.md` -> `ai.config.js context.global`.

## CLI Commands

```bash
npx jue init
npx jue apply                                    # Auto-detect from .cursor/.gemini/.claude/.github footprints
npx jue apply --adapter cursor --adapter gemini # Run only selected adapters
npx jue apply -a                                 # Run all discovered adapters (same as --all)
npx jue apply --lang zh                          # Runtime language override (same as AI_JUE_LANG=zh)
npx jue apply --watch
npx jue list
npx jue check
npx jue validate
npx jue create-preset <name>
```

## Adapter Selection Rules for `apply`

- `jue apply`: auto-detect adapters from tool footprints in the current project
- If no footprint is detected, it enters interactive adapter selection
- `jue apply --adapter ...`: run only explicitly selected adapters
- `jue apply -a` / `jue apply --all`: run all discovered adapters
- If no adapter is passed and no footprint is detected, it will not run all adapters implicitly; it prompts for explicit selection

## First-Run Initialization UX

- On first run in a new project, if no `ai/jue` config file is detected, `jue apply` starts an initialization guide first.
- After initialization, apply continues automatically to reduce first-time setup friction.
- This guided flow does not create an empty `.ai` scaffold by default; `.ai` is created later only when progressive asset customization is needed.

## License

[MIT](LICENSE)
