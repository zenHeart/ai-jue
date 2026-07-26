# External Capability Reference Specification

> Status: Partial
>
> [!WARNING]
> `source`, `type`, `ref`, and `path` are implemented as defined on this page,
> and each reference resolves exactly one leaf Capability. `integrity` can be
> supplied but is not yet enforced for remote sources. See
> [Implementation Status](../developer/implementation-status.md).

`capabilities` references one external Capability. It is a Canonical DSL input
field, not an architecture concept or arbitrary conversion extension point.

```js
export default {
  capabilities: {
    review: { source: "file:./vendor/review", type: "skill" }
  }
};
```

Presets use the same shape under `package.json#ai.capabilities`. Required fields
are `source` and `type`; `ref`, `path`, and `integrity` apply when needed.
`type` is one of `skill`, `agent`, `command`, `rule`, `hook`, or `mcp`. Each
reference resolves exactly one Capability; use a Preset for a collection.
Publishers normalize third-party content before distribution; Jue never
executes source scripts while resolving it.

Resolution merges recursive Presets, references, declarative directories, then
project overrides. References are leaves. `ai-jue.lock` records reference hash,
resolved version, content hash, type, and schema. Contract tests cover
determinism, frozen/offline/update behavior, corruption, traversal, integrity,
and sensitive-data redaction.
