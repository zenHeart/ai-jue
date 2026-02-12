# `ai.config.js` Configuration Guide

`ai.config.js` is the unified entry for `ai-jue` (and `jue.config.js` is also supported; `ai.config.js` has priority). The design goal is minimal cognitive load: users declare intent once, and the system auto-discovers assets and performs adapter conversions.

## 1. Minimal Working Config

```js
export default {
  presets: ['base']
}
```

```bash
npx jue apply
```

This means:
- You only declare which preset to use
- You do not need heavy object configuration first
- The system auto-mounts default asset directories

## 2. Canonical Fields (Single)

```js
export default {
  presets: ['base'],
  language: 'en',

  commands: {
    review: {
      description: 'Code review',
      prompt: 'Review current changes for correctness, performance, and security',
      triggers: ['/review']
    }
  },

  hooks: {
    'pre-commit': 'npm run lint'
  },

  agents: {
    reviewer: {
      description: 'Focused reviewer agent',
      prompt: 'You are a strict code review agent',
      skills: ['review']
    }
  },

  mcp: {
    servers: {
      filesystem: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '.']
      }
    }
  },

  tools: {
    gemini: {
      temperature: 0.2
    }
  }
}
```

## 3. How Config Relates to File Structure

### 3.1 Default Mounting Logic (Low Cognitive Load)

When you run `jue apply`, core processing order is:

1. Load assets from configured presets
2. Auto-scan local `.ai/` (if absent, scan `.jue/`)
3. Merge files referenced by `extends`
4. Apply object overrides from `ai.config.js`

Implication:
- **Object config is not mandatory** for core usage
- Directory assets work by default
- Object config is mainly for explicit override/runtime tuning

### 3.2 Directory-to-Capability Mapping

```text
.ai/
├── AGENTS.md      -> global context
├── rules/         -> rules
├── commands/      -> commands
├── skills/        -> skills
├── agents/        -> agents
├── hooks/         -> hooks
└── tools/         -> tool-private config
```

### 3.3 When to Use Directory vs Object

- Prefer directories for reusable, versioned assets
- Use object config for explicit overrides (for example `tools.gemini`, `mcp.servers`)
- Use `extends` for temporary or externalized assets

## 4. Field Summary

- `preset` / `presets`: choose presets (`presets` wins when both exist)
- `extends`: explicitly load external files and merge
- `language`: i18n preference
- `commands`: command definitions
- `hooks`: hook definitions
- `agents`: agent definitions
- `mcp`: MCP server definitions
- `tools`: tool-private passthrough config

## 5. Non-Canonical Input Policy

- Fail fast on non-canonical capability fields
- Return actionable repair guidance
- Do not implement non-canonical concept handling in adapters

## 6. Design Constraints

- Minimal Knowledge Principle: expose mainstream concepts only
- Single canonical model: no dual-track semantics
- Adapter single responsibility: format conversion only
