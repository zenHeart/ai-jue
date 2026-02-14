# ai-jue-adapter-{tool}

<div align="center">

**{Tool} Adapter: Convert ai-jue configs to {Tool} native format**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-{tool}.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-{tool})
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**English** | [简体中文](README.md)

Part of the [ai-jue](https://github.com/zenHeart/ai-jue) monorepo.

</div>

---

## Overview

This adapter converts `ai-jue` standardized capabilities into {Tool} native configuration format.

## Capability Mapping Matrix

> **Developer Note**: In the "{Tool} Native Feature" column below, you **MUST** include a Markdown link to the official documentation for that feature. Example: `[Project Rules](https://docs.tool.com/rules)`. If unsupported, write "None".

| Priority | ai-jue Capability | {Tool} Native Feature (Must Link to Docs) | Status | User Config Note | Implementation Strategy |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | {Describe & Link global context mechanism} | {Native/Degraded/Unsupported} | {What user needs to do} | {How to map} |
| ⭐⭐⭐⭐⭐ | **Rules** | {Describe & Link rules mechanism} | {Native/Degraded/Unsupported} | {Support for globs/alwaysApply} | {How to map} |
| ⭐⭐⭐ | **Commands** | {Describe & Link commands mechanism} | {Native/Degraded/Unsupported} | {How to use} | {How to map} |
| ⭐⭐⭐ | **Skills** | {Describe & Link skills mechanism} | {Native/Degraded/Unsupported} | {How to use} | {How to map} |
| ⭐⭐⭐ | **MCP** | {Describe & Link MCP support} | {Native/Degraded/Unsupported} | {Config method} | {How to map} |
| ⭐⭐⭐ | **Hooks** | {Describe & Link hooks mechanism} | {Native/Degraded/Unsupported} | {How to use} | {How to map} |
| ⭐⭐ | **Agents** | {Describe & Link agents mechanism} | {Native/Degraded/Unsupported} | {How to use} | {How to map} |
| ⭐⭐ | **Configuration** | {Describe & Link global config} | {Native/Degraded/Unsupported} | {Config method} | {How to map} |

## Implementation Details

### 1. AGENTS.md (Global Context)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Mapping Strategy**: {How global context is injected}
- **User Action**: {What user needs to do, e.g., "Place AGENTS.md in project root"}
- **Technical Details**: {Implementation specifics}

### 2. Rules (Path-specific Rules / Project Rules)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Mapping Strategy**:
  - `globs` → {Tool's equivalent field}
  - `alwaysApply` → {Tool's equivalent field}
  - `description` → {Tool's equivalent field}
- **Output Files**: {Output path and format, e.g., `.cursor/rules/*.mdc`}
- **Note**: This is the modern rule mechanism replacing outdated global instruction files.

### 3. Commands (Custom Commands)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Mapping Strategy**: {How commands are converted}
- **Usage**: {How users use generated commands}

### 4. Skills (Reusable Skills)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Mapping Strategy**: {How skills are converted}

### 5. MCP (External Tool Integration)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Config Format**: {Generated configuration format}

### 6. Hooks (Lifecycle Hooks)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Supported Events**: {Which hook types are supported}

### 7. Agents (Sub-agents)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Mapping Strategy**: {How agents are converted}

### 8. Configuration (Global Settings)

- **Compatibility**: {Fully Compatible / Partial / Incompatible}
- **Mapping Strategy**: {How configuration is converted}

## Limitations & Fallback Strategies

### Critical Limitations

1. {List key capabilities not supported by Tool}
2. {List known technical limitations}

### Degradation Handling

| ai-jue Capability | Fallback Method | User Impact |
|:---|:---|:---|
| {Capability} | {How to degrade, e.g., "Write to documentation"} | {How user needs to adapt} |

### Manual Workarounds

For unsupported capabilities, users can manually:
1. {Manual step 1}
2. {Manual step 2}

## Installation

```bash
npm install ai-jue-adapter-{tool}
```

## Usage

Configure in `ai.config.js`:

```javascript
module.exports = {
  preset: 'base',
  adapters: ['{tool}']
};
```

Then run:

```bash
npx jue apply --adapter {tool}
```

## Verification

Run adapter tests:

```bash
npm test -- packages/ai-jue-adapter-{tool}/test/index.test.ts
```

## Related Links

- [ai-jue Main Project](https://github.com/zenHeart/ai-jue)
- [{Tool} Official Docs]({Official docs link})

## License

[MIT](LICENSE)
