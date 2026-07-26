# Agent Support Profiles

This section records official target surfaces, intended Jue mappings, and
current implementation. It does not redefine Canonical or Extension protocols.

## Shared maturity levels

| Level | Meaning |
| --- | --- |
| Read | Agent-native config → Canonical DSL |
| Write | Canonical DSL → Agent-native representation |
| Artifact | Generate and maintain target Config / Plugin / Bundle |
| Confirm | Validate through an official CLI, parser, or real read path |

Statuses are Implemented, Partial, Planned, Unsupported, or Unverified.

## Current targets

| Agent | Read | Write | Artifact | Confirm |
| --- | --- | --- | --- | --- |
| [Claude Code](claude-code.md) | Implemented | Implemented | Implemented | Implemented |
| [Codex](codex.md) | Implemented | Implemented | Implemented | Implemented |
| [OpenClaw](openclaw.md) | Implemented | Implemented | Partial | Implemented |
| [Hermes](hermes.md) | Implemented | Implemented | Partial | Implemented |

Partial means that Agent only has a single Artifact form (project/workspace)
and does not cover a Plugin/Bundle-style aggregate — it does not mean
Read/Write/Confirm themselves are incomplete.
