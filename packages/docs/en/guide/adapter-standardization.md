# Adapter Standardization (Minimal Knowledge Principle)

This document defines the user consumption model and adapter conversion boundary for `ai-jue`.

## 1. User Consumption Path (Begin with the End)

Users should only learn one canonical model:

1. Declare capabilities in `ai.config.js`
2. Organize assets in `.ai/` or presets
3. Run `jue apply` to generate tool-specific outputs

Users should not learn non-canonical fields or bridge concepts.

## 2. Canonical Capability Model (Single Source)

| Capability | Canonical Path/Field | Purpose |
| --- | --- | --- |
| Global context | `AGENTS.md` | Project-level system context and hard constraints |
| Rules | `rules/` | Rule assets |
| Commands | `commands/` / `commands` | Custom commands |
| Skills | `skills/` / `skills` | Reusable task capabilities |
| Agents | `agents/` / `agents` | Specialized agent units |
| Hooks | `hooks/` / `hooks` | Lifecycle automation |
| MCP | `mcp.servers` | External integrations |
| Tool extension | `tools/<tool>/` / `tools` | Tool-private passthrough config |

Strict rules:
- Do not expose any internal bridge fields
- Do not accept any historical wrong names

## 3. Directory Protocol (`.ai` and Preset Isomorphic)

```text
.ai/
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

## 4. Adapter Responsibility Boundary

- Adapters only convert canonical model -> target tool format
- Adapters only consume canonical fields
- Non-canonical input is rejected in core `validate/normalize` (fail-fast)

## 5. Cursor mdc Conversion Constraint

- Canonical rule source: `md + YAML frontmatter`
- Cursor adapter converts only at transformation time into `.cursor/rules/*.mdc`
- Rule semantics stay in the unified layer; no duplicate logic in Cursor adapter

## 6. Failure Policy (Reduce Cognitive Load)

Fail fast with repair guidance when detecting:

- Any capability fields outside the canonical model
