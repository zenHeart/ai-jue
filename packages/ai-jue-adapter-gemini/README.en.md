# ai-jue-adapter-gemini

<div align="center">

**Gemini CLI Adapter: Transforming ai-jue configs into Gemini native format**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-gemini.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-gemini)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**English** | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo.

</div>

---

## Overview

This adapter transforms `ai-jue` specification capabilities into native configuration formats for the Gemini CLI (`gemini`).

## Capability Mapping Matrix

| Priority | ai-jue Capability | Gemini Native Feature | Status | User Instructions | Implementation Strategy |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **[AGENTS.md](https://geminicli.com/docs/cli/context/)** | Project Context Reference | 🟢 Native | Place `AGENTS.md` in root | Generate `AGENTS.md` and reference via `@AGENTS.md` in `GEMINI.md` |
| ⭐⭐⭐⭐⭐ | **Rules** | Prompt Blocks | 🟡 Degraded | No support for file globs | Rules are written as Markdown blocks into `GEMINI.md` |
| ⭐⭐⭐ | **[Commands](https://geminicli.com/docs/cli/commands/)** | Custom Slash Commands | 🟢 Native | `.gemini/commands/*.toml` | Convert to Gemini native TOML command format |
| ⭐⭐⭐ | **[Skills](https://geminicli.com/docs/cli/skills/)** | Agent Skills | 🟢 Native | `.gemini/skills/{name}/` | Convert to skill directory with `SKILL.md` and resources |
| ⭐⭐⭐ | **[MCP](https://geminicli.com/docs/cli/mcp/)** | Model Context Protocol | 🟢 Native | `mcpServers` in `settings.json` | Inject MCP config into `settings.json` |
| ⭐⭐⭐ | **[Hooks](https://geminicli.com/docs/cli/hooks/)** | Lifecycle Hooks | 🟢 Native | `hooks` in `settings.json` | Inject hook scripts into `settings.json` |
| ⭐⭐ | **[Agents](https://geminicli.com/docs/cli/agents/)** | Agent Personas | 🟢 Native | `agents` in `settings.json` | Inject agent config and skill mappings into `settings.json` |
| ⭐⭐ | **[Configuration](https://geminicli.com/docs/cli/configuration/)** | System Settings & Prompts | 🟢 Native | `settings.json` & `GEMINI.md` | Merge system settings and generate core `GEMINI.md` |

## Detailed Implementation

### 1. AGENTS.md (Global Context)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Generates a physical `AGENTS.md` file and references it at the top of `GEMINI.md` using the `@AGENTS.md` syntax.
- **User Action**: Gemini will automatically load the project context after running `jue apply`.
- **Technical Details**: Leverages Gemini's file reference mechanism to ensure large contexts don't clutter the main prompt.

### 2. Rules (Path-specific instructions)

- **Compatibility**: Partial (Degraded)
- **Mapping Strategy**:
  - `globs` → ❌ Not supported
  - `alwaysApply` → 🟢 Written to `GEMINI.md`
  - `description` → 🟢 Written to `GEMINI.md`
- **File Output**: All rules are merged into the `## Rules (Degraded)` section of `GEMINI.md`.

### 3. Commands (Custom slash commands)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Converts Markdown files in `commands/` into `.gemini/commands/**/*.toml`.
- **Usage**: Users invoke commands via `/command-name` in the CLI.

### 4. Skills (Reusable agent expertise)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Generates a directory structure following the [Agent Skills](https://agentskills.io/specification) spec, including `SKILL.md` (with YAML frontmatter) and `references/` assets.

### 5. MCP (External tool integration)

- **Compatibility**: Fully Compatible
- **Config Format**: Maps directly to the `mcpServers` object in `.gemini/settings.json`.

### 6. Hooks (Lifecycle scripts)

- **Compatibility**: Fully Compatible
- **Supported Events**: Supports all native hook events defined in `settings.json`.

### 7. Agents (Sub-agents)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Maps to the `agents` field in `settings.json`, supporting specific skill assignments for different personas.

### 8. Configuration (Global settings)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Merges all configuration items from `tools.gemini` into `.gemini/settings.json`.

## Limitations & Degradation

### Key Limitations

1. Gemini CLI currently does not support automatic rule triggering based on specific file globs.
2. Does not support modern multi-file rule automatic loading mechanisms (like those found in Cursor).

### Degradation Handling

| ai-jue Capability | Degradation Method | User Impact |
|:---|:---|:---|
| Rules | Written to `GEMINI.md` | Rules become globally active and cannot target specific file paths automatically. |

### Manual Alternatives

For path-specific rules, users can:
1. Manually specify paths in the prompt.
2. Break rules into specific Skills and activate them when needed.

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
