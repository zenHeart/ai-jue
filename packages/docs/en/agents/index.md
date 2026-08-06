# Agent Support Profiles

This section records official target surfaces, intended Jue mappings, and
current implementation. It does not redefine the [Canonical
model](../specs/canonical-model.md) or [Extension](../architecture/index.md)
protocols.

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
| [Cursor](cursor.md) | Implemented | Implemented | Implemented | Implemented |
| [OpenClaw](openclaw.md) | Implemented | Implemented | Implemented | Implemented |
| [Hermes](hermes.md) | Implemented | Implemented | Implemented | Implemented |

OpenClaw / Hermes Artifact covers workspace plus an installable aggregate
(`compatible-bundle` / thin `skill-plugin`). Each profile records the official
surface and its Canonical mapping boundary.
