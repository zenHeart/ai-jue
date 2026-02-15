# ai-jue-adapter-claude

<div align="center">

**Claude Code Adapter: Transforming ai-jue configs into Claude native format**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-claude.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-claude)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**English** | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo.

</div>

---

## Overview

This adapter transforms `ai-jue` specification capabilities into native configuration formats for Claude Code (`claude`).

## Capability Mapping Matrix

> **Developer Note**: The "Claude Code Native Feature" column below includes **verified** Markdown links to the official documentation.

| Priority | ai-jue Capability | Claude Code Native Feature (Must Link to Docs) | Status | User Config Note | Implementation Strategy |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | [CLAUDE.md Context](https://code.claude.com/docs/en/best-practices) | 🟢 Native | Place `CLAUDE.md` in root | Generate `CLAUDE.md` and map global context |
| ⭐⭐⭐⭐⭐ | **Rules** | [Modular Rules](https://code.claude.com/docs/en/memory) | 🟢 Native | `.claude/rules/` directory | Convert to multi-file rule system under the directory |
| ⭐⭐⭐ | **Commands** | [Skills / Commands](https://code.claude.com/docs/en/skills) | 🟢 Native | Invoke via `/skill-name` | Convert to `SKILL.md` under `.claude/skills/` |
| ⭐⭐⭐ | **Skills** | [Agent Skills Specification](https://agentskills.io/specification) | 🟢 Native | Auto-triggered expertise | Generate standard skill directories with YAML Frontmatter |
| ⭐⭐⭐ | **MCP** | [MCP Servers](https://code.claude.com/docs/en/build-with-claude-code/mcp) | 🟢 Native | Root `.mcp.json` | Inject MCP config into project-root `.mcp.json` |
| ⭐⭐⭐ | **Hooks** | [Lifecycle Hooks](https://code.claude.com/docs/en/hooks) | 🟢 Native | Event-driven automation | Inject hook config into `.claude/settings.json` |
| ⭐⭐ | **Agents** | [Sub-Agents](https://code.claude.com/docs/en/sub-agents) | 🟢 Native | Independent personas | Map to personas under `.claude/agents/` |
| ⭐⭐ | **Configuration** | [Settings Scopes](https://code.claude.com/docs/en/build-with-claude-code/settings) | 🟢 Native | Configure permissions & models | Merge items and generate `.claude/settings.json` |

## Detailed Implementation

### 1. AGENTS.md (Global Context)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Generates a physical `CLAUDE.md` file.
- **User Action**: Claude Code automatically loads `CLAUDE.md` from the project root on startup.
- **Technical Details**: Supports resource referencing using the `@path/to/file` syntax within the file.

### 2. Rules (Path-specific Rules / Project Rules)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**:
  - `globs` → Mapped to the `paths` config in the rule metadata
  - `alwaysApply` → Mapped to `auto-apply` metadata
- **Output Files**: Written to `.claude/rules/*.md`.

### 3. Commands (Custom Commands)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Claude Code merges Commands and Skills. Content from `commands/` is converted into simplified skill files under `.claude/skills/`.
- **Usage**: Users invoke them via `/command-name`.

### 4. Skills (Reusable agent expertise)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Generates directory structures following the [Agent Skills](https://agentskills.io/specification) spec, including `SKILL.md` and associated `scripts/` or `references/`.

### 5. MCP (External tool integration)

- **Compatibility**: Fully Compatible
- **File Path**: Written to `.mcp.json` in the project root.
- **Config Format**: Maps directly to the top-level `mcpServers` object.

### 6. Hooks (Lifecycle scripts)

- **Compatibility**: Fully Compatible
- **Target Path**: Injected into the `hooks` field of `.claude/settings.json`.
- **Supported Events**: Supports `PreToolUse`, `PostToolUse`, `SessionStart`, `Notification`, and more.

### 7. Agents (Sub-agents)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Generates independent config files for each sub-agent, supporting custom toolsets and models.

### 8. Configuration (Global Settings)

- **Compatibility**: Fully Compatible
- **Mapping Strategy**: Merges all settings from `tools.claude` into `.claude/settings.json`.

## Installation

```bash
npm install ai-jue-adapter-claude
```

## Usage

Configure in `ai.config.js`:

```javascript
module.exports = {
  preset: 'base',
  adapters: ['claude']
};
```

## Verification

Run adapter tests:

```bash
npm test -- packages/ai-jue-adapter-claude/test/index.test.ts
```

## Related Links

- [ai-jue Main Project](https://github.com/zenHeart/ai-jue)
- [Claude Code Official Docs](https://code.claude.com/docs/en/overview)

## License

[MIT](LICENSE)
