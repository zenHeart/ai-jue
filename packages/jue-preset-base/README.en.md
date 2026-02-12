# jue-preset-base

<div align="center">

**Scenario-first preset for everyday agentic engineering workflows**

[![NPM version](https://img.shields.io/npm/v/jue-preset-base.svg?style=flat)](https://www.npmjs.com/package/jue-preset-base)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

</div>

## Core Idea

`jue-preset-base` is not a large prompt collection.
It is a minimal, high-frequency command preset focused on reducing rework in daily coding workflows.

Core scenarios:

1. Intent clarification before coding
2. New project bootstrap with shared constraints
3. Existing project development and refactor with verification

## Quick Start

```bash
npm install -D ai-jue jue-preset-base
```

```js
// ai.config.js
module.exports = {
  presets: ['base']
}
```

```bash
npx jue apply
```

## Capability Surface

- `AGENTS.md` as the global meta-rule entry
- Canonical 7-command interface:
  - `jue:impl`
  - `jue:fix`
  - `jue:rev`
  - `jue:ref`
  - `jue:exp`
  - `jue:test`
  - `jue:doc`
- Adapter-friendly output via `ai-jue` conversion

## Bilingual Notes

- Keep `AGENTS.md` and `AGENTS.en.md` semantically aligned.
- Keep command prompts aligned across `prompt.md` and `prompt.en.md`.
- Current command folder mapping:
  - `jue:exp -> commands/explain`
  - `jue:ref -> commands/refactor`
  - `jue:rev -> commands/review`
  - `jue:test -> commands/test`
  - `jue:doc -> commands/doc`
  - `jue:impl -> commands/impl`
  - `jue:fix -> commands/fix`

## Conventional Commits Alignment

To align with [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) without increasing user cognitive load:

- Keep user commands unchanged: `jue:impl`, `jue:fix`, `jue:rev`, `jue:ref`, `jue:exp`, `jue:test`, `jue:doc`.
- Add commit-type suggestion mapping in command outputs:
  - `jue:impl -> feat`
  - `jue:fix -> fix`
  - `jue:ref -> refactor`
  - `jue:test -> test`
  - `jue:doc -> docs`
  - `jue:rev -> chore` (only when code changes are produced)
  - `jue:exp -> docs` (only when documentation changes are produced)
- Suggested header format:
  - `<type>(<scope>): <description>`
  - Use `!` or `BREAKING CHANGE:` footer for breaking changes.

## Quality Target

"Zero-edit review" is a quality target, not a claim that every output already meets it.

## Naming Note

- Canonical term: `agents`

## License

[MIT](LICENSE)
