# Jue specifications

This section indexes Jue's public protocols and implementation contracts.
Specifications define valid inputs, outputs, and compatibility boundaries. For
design rationale and runtime flow, start with
[Architecture](../guide/architecture.md).

## Recommended reading order

1. [Jue MVP](jue-mvp.md) defines the
   `Capability → Preset → Adapter` product model, capability boundaries, and
   Preset directory contract.
2. [Canonical Model](canonical-model.md) defines the normalized
   structure shared by resolution, validation, and Adapters.
3. [Capability Source](capability-source.md) defines how
   a Preset references external Capability content through `ai.capabilities`.
4. [Codex / Claude Code Adapter](codex-claude-code-adapters.md)
   defines native outputs and verification boundaries for the prioritized
   runtimes.

## Status labels

| Status | Meaning |
| --- | --- |
| Draft | The target contract can still change; implementation gaps must be explicit |
| Accepted | The document is the accepted product or protocol boundary for the current phase |
| Implemented | The contract has implementation and verification evidence; later changes must consider compatibility |

The status at the top of each specification is authoritative for that document.
If a specification and the implementation differ, verify the runnable behavior
and track the mismatch as a protocol defect rather than silently choosing one.
