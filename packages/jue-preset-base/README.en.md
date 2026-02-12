# jue-preset-base

<div align="center">

**Core preset for ai-jue: Agentic SDLC meta-rules**

[![NPM version](https://img.shields.io/npm/v/jue-preset-base.svg?style=flat)](https://www.npmjs.com/package/jue-preset-base)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | [简体中文](README.md)

</div>

## Core Idea

`jue-preset-base` is not just a prompt bundle. It is a meta-rule layer for Agentic SDLC, aiming to reduce human review edits by enforcing quality constraints across the lifecycle.

Lifecycle focus:

1. Intent understanding
2. Implementation quality
3. Verification (tests/docs)
4. Reviewability
5. Feedback loop improvement

## Quick Start

```bash
npm install -D ai-jue jue-preset-base
```

```js
// ai.config.js
export default {
  presets: ['base']
}
```

```bash
npx jue apply
```

## Capability Surface

- `AGENTS.md` as global meta-rule entry
- Command assets for `/explain`, `/refactor`, `/optimize`, `/test`, `/doc`, `/review`, `/security`
- Compatible with downstream tool adapters through ai-jue transformation

## Naming Note

- Canonical term: `agents`

## License

[MIT](LICENSE)
