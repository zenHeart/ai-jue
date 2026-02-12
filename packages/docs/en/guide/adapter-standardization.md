# Adapter Standardization (Minimal Knowledge Principle)

This document defines the user consumption model and adapter conversion boundary for `ai-jue`.

## 1. User Consumption Path (Begin with the End)

Users should only learn one canonical model:

1. Declare capabilities in `ai.config.js`
2. Organize assets in `.ai/` or presets
3. Run `jue apply --all` (or `jue apply --adapter <name>`) to generate tool-specific outputs

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

## 5. Capability Mapping Matrix (Current Implementation)

| Capability | Claude | Cursor | Gemini | Copilot |
| --- | --- | --- | --- | --- |
| AGENTS.md | `CLAUDE.md` (references `@AGENTS.md`) | root `AGENTS.md` (Cursor native) | `GEMINI.md` (references `@AGENTS.md`) | `.github/copilot-instructions.md` |
| rules | degraded into `CLAUDE.md` | `.cursor/rules/*.mdc` | degraded into `GEMINI.md` | degraded into `.github/copilot-instructions.md` |
| commands | `CLAUDE.md` | `.cursor/commands/*.md` | `.gemini/settings.json.customCommands` | `.github/copilot-instructions.md` |
| skills | `CLAUDE.md` | `.cursor/skills/*/SKILL.md` | degraded into `GEMINI.md` (text) | `.github/copilot-instructions.md` |
| hooks | `CLAUDE.md` (documentation) | `.cursor/hooks.json` | `.gemini/settings.json.hooks` | `.github/copilot-instructions.md` (documentation) |
| agents | `CLAUDE.md` (documentation) | `.cursor/agents/*.md` | `.gemini/settings.json.agents` | `.github/copilot-instructions.md` (documentation) |
| mcp | `.mcp.json` | `.cursor/mcp.json` | `.gemini/settings.json.mcpServers` | `.github/copilot-instructions.md` (degradation note) |
| `tools.<tool>` | partial | partial | `.gemini/settings.json` | partial |

Notes:
- “degraded into documentation” means no equivalent structured target exists; adapters must emit explicit fallback text.
- Cursor is currently the most complete structured reference implementation.

## 6. Cursor Conversion Constraint

- `AGENTS.md` (`context.global`) remains at project root for Cursor; only `rules/*` are converted into `.cursor/rules/*.mdc`
- `rules/*` use canonical `md + YAML frontmatter` and are converted to `.cursor/rules/*.mdc`
- The adapter only performs format conversion; rule semantics remain in the unified layer

## 7. Failure and Degradation Policy (Reduce Cognitive Load)

Fail fast with repair guidance when detecting:

- Any capability fields outside the canonical model

For capabilities unsupported by the target tool:
- adapters must emit explicit degradation output or mapped artifacts
- silent dropping of capability input is not allowed

## 8. Verification Index (Capability -> Test Point)

- Cursor mapping: `packages/ai-jue-adapter-cursor/test/index.test.ts`
- Claude mapping: `packages/ai-jue-adapter-claude/test/index.test.ts`
- Gemini mapping: `packages/ai-jue-adapter-gemini/test/index.test.ts`
- Copilot mapping: `packages/ai-jue-adapter-copilot/test/index.test.ts`
- Cross-adapter matrix: `packages/ai-jue/test/adapter-matrix.test.ts`
- Capability snapshot: `packages/ai-jue/test/adapter-capability.snapshot.test.ts`
- Bootstrap smoke: `scripts/smoke-apply.js`
