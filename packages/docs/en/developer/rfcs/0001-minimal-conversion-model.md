# RFC-0001: Minimal Conversion Model

> Status: Accepted

## Context

Earlier documentation separately named normalized data, target-private fields,
conversion functions, output writing, and runtime actions. This encouraged
parallel pipelines and exposed internal structure to users.

## Decision

```text
Capability / Preset ↔ Canonical DSL ↔ Adapter ↔ Artifact
                         ↑
                 Extension registers Adapter
```

The stable concepts are exactly Capability, Preset, Canonical DSL, Extension,
Adapter, and Artifact. Canonical DSL is both specification and normalized data.
An Adapter owns one Agent's complete bidirectional conversion. Extension is the
only executable extension mechanism. Plugins, Bundles, and configs are Artifact
forms. npm owns package lifecycle; Jue defines only the default-export API.
Core commands are `init`, `apply`, and `inspect`; preview, CI, and diagnostics
are options.

## Consequences

A new Agent implements one Adapter. A new output extends that Adapter. A seventh
concept requires another RFC proving it cannot be a field, method, or ordinary
behavior of the six. Implementations test round trips, idempotency, unmanaged
field preservation, permissions, and native confirmation.
