# ai-jue-adapter-gemini

<div align="center">

**Adapter for Gemini CLI: Transforming ai-jue configs into Gemini-native format**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-gemini.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-gemini)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**English** | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo.

</div>

---

## Overview

This adapter transforms `ai-jue` specification capabilities into native configuration formats for the Gemini CLI (`gemini`).

## Capability Mapping Matrix

> **Developer Note**: The "Gemini Native Feature" column below includes **verified** Markdown links to the official documentation.

| Priority | ai-jue Capability | Gemini Native Feature (Verified Links) | Status | User Instructions | Implementation Strategy |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | [Project Context](https://geminicli.com/docs/) | 🟢 Native | Place `AGENTS.md` in root | Generate `AGENTS.md` and reference via `@AGENTS.md` in `GEMINI.md` |
| ⭐⭐⭐⭐⭐ | **Rules** | [System Instructions](https://geminicli.com/docs/) | 🟡 Degraded | No support for file globs | Rules are written as Markdown blocks into `GEMINI.md` |
| ⭐⭐⭐ | **Commands** | [Custom Commands](https://geminicli.com/docs/) | 🟢 Native | Invoke via `/command-name` | Convert to Gemini native TOML command format |
| ⭐⭐⭐ | **Skills** | [Agent Skills](https://agentskills.io/specification) | 🟢 Native | Automatically activated expertise | Convert to skill directory with `SKILL.md` and resources |
| ⭐⭐⭐ | **MCP** | [MCP Servers](https://geminicli.com/docs/) | 🟢 Native | `mcpServers` in `settings.json` | Inject MCP config into `.gemini/settings.json` |
| ⭐⭐⭐ | **Hooks** | [Hooks](https://geminicli.com/docs/hooks/) | 🟢 Native | Triggered on specific CLI events | Inject hook scripts into `.gemini/settings.json` |
| ⭐⭐ | **Agents** | [Sub-Agents](https://geminicli.com/docs/) | 🟢 Native | Distinct prompts for different roles | Map to the `agents` field in `.gemini/settings.json` |
| ⭐⭐ | **Configuration** | [Settings](https://geminicli.com/docs/) | 🟢 Native | Configure model params, permissions | Merge items and generate `.gemini/settings.json` |

## Detailed Implementation

### 1. AGENTS.md (Global Context)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Generates a physical `AGENTS.md` file and references it at the top of `GEMINI.md` using the `@AGENTS.md` syntax.
- **User Action**: Gemini will automatically load the project context during session initialization after running `jue apply`.
- **Technical Details**: Leverages Gemini's native file reference mechanism to ensure large contexts are loaded efficiently.

### 2. Rules (Path-specific Rules / Project Rules)

- **Compatibility**: Partial (Degraded)
- **Mapping Strategy**:
  - `globs` → ❌ Not supported (Gemini cannot currently trigger rules based on file paths)
  - `alwaysApply` → 🟢 Written to `GEMINI.md` by default
  - `description` → 🟢 Written as Markdown headers
- **File Output**: All rules are merged into the `## Rules (Degraded)` section of `GEMINI.md`.

### 3. Commands (Custom slash commands)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Converts Markdown files in `commands/` into `.gemini/commands/**/*.toml` files.
- **Usage**: Users invoke generated prompts via `/command-name` in the CLI.

### 4. Skills (Reusable agent expertise)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Generates a directory structure following the Agent Skills spec, including `SKILL.md` (with YAML frontmatter) and `references/` assets.

### 5. MCP (External tool integration)

- **Compatibility**: Fully Compatible
- **Config Format**: Maps `mcp.servers` directly to the `mcpServers` object in `.gemini/settings.json`.

### 6. Hooks (Lifecycle scripts)

- **Compatibility**: Fully Compatible
- **Supported Events**: Supports native events like `PreToolUse` and `PostToolUse`.

### 7. Agents (Sub-agents)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Maps to the `agents` field in `settings.json`, supporting specific skill assignments for different personas.

### 8. Configuration (Global Settings)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Merges configuration items from `tools.gemini` into `.gemini/settings.json`.

## Limitations & Fallback Strategies

### Key Limitations

1. Gemini CLI currently does not support automatic rule triggering based on specific file globs.
2. Does not support independent loading of modern multi-file rule mechanisms (like those found in Cursor).

### Degradation Handling

| ai-jue Capability | Fallback Method | User Impact |
|:---|:---|:---|
| Rules | Written to `GEMINI.md` | Rules become globally active and cannot target specific file paths automatically. |

### Manual Workarounds

For path-specific rules, users can:
1. Manually specify paths in the prompt.
2. Break rules into specific Skills and activate them manually when needed.

## Installation

```bash
npm install ai-jue-adapter-gemini
```

## Usage

Configure in `ai.config.js`:

```javascript
module.exports = {
  preset: 'base',
  adapters: ['gemini']
};
```

Then run:

```bash
npx jue apply --adapter gemini
```

## Verification

Run adapter tests:

```bash
npm test -- packages/ai-jue-adapter-gemini/test/index.test.ts
```

## Related Links

- [ai-jue Main Project](https://github.com/zenHeart/ai-jue)
- [Gemini CLI Official Docs](https://geminicli.com/docs/)

## License

[MIT](LICENSE)
