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

An exact `npm:<name>@<version>` source first checks whether the declaring
Preset (or project) lists `<name>` as a direct dependency. If it does, Jue
resolves that package with Node package resolution from the declaring package
directory, verifies the installed `name` and exact `version`, then applies
`path`. If the package is not installed or is not a direct dependency, the
existing exact-version `npm pack` path remains the fallback.
`npm:file:<archive.tgz>` and `file:` are unchanged. Nested Presets resolve from
their parent Preset package directory, not only the process cwd.

A `skill` source uses `SKILL.md` as its primary document and preserves paths
and bytes from `references/`, `scripts/`, `assets/`, and other root-relative
sidecars. `package.json`, cache archives, symbolic links, hard links, and
device files do not enter the Skill bundle.

Resolution merges recursive Presets, references, declarative directories, then
project overrides. References are leaves. `ai-jue.lock` records reference hash,
resolved version, content hash, type, and schema. `--frozen` forbids implicit
refresh; `capability update [id]` updates atomically. Path traversal, unknown
types, floating remote versions, integrity failures, credential leaks, and
corrupted lock caches must block. Offline resolution reads only the local lock.
Contract tests cover determinism, frozen/offline/update behavior, corruption,
traversal, integrity, and sensitive-data redaction.
