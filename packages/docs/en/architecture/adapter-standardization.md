# Adapter Standard

An Adapter is the complete conversion unit for one Agent inside an Extension.
This standard refines behavior without adding architecture concepts.

## Input and output

```text
Agent-native config ←→ Adapter ←→ Canonical DSL
                           ↓
                        Artifact
```

An Adapter declares its unique ID, Capability support, native read locations,
Artifact kinds and ownership, required permissions, and a target-native
confirmation path.

## Extension entry and capability defaults

The Extension default export is the sole runtime source of truth for Adapter
inventory, methods, and capability metadata. Core validates that export and
passes the Adapter object to apply; the package entry keeps one default export.

Core owns baselines shared by every Adapter. An Adapter declares target-native
capabilities and deviations from those baselines. `supportedScopes` defaults to
project-only; only an Adapter with verified user-native paths declares `user`.
Adding a scope therefore changes the Core contract and the Adapters that opt in,
without duplicating metadata across every package.

## Three required behaviors

| Method | Purpose | Side effects |
| --- | --- | --- |
| `read` | Agent-native config → Canonical DSL | None |
| `write` | Canonical DSL → Artifact changes | None |
| `confirm` | Confirm through the target-native path | Read-only |

These method names form the Extension API. Core executes Artifact changes.
Third-party Adapters have no interface for bypassing approved scope with
independent writes, network access, installation, or process execution.

## Conversion guarantees

```text
normalize(read(write(Canonical))) = normalize(Canonical)
```

For a target-native fixture:

```text
normalize(read(write(read(Native)))) = normalize(read(Native))
```

Output is deterministic, a second apply produces no changes, valid unmanaged
same-target fields survive, target-private fields never cross Agents, and
degradation or unsupported semantics are visible before writing.

## Artifact writes and confirmation

Each change includes an exact path, operation, before/after hash, risk, and
approval. Core may modify only regions allowed by the Artifact ownership
record. Ownership conflicts block by default. Deletion, network access,
dependency installation, process execution, and user-level writes are shown
and approved separately.

Prefer the target's official parser or CLI, then a real target read path. File
existence alone does not prove Agent recognition. Missing confirmation returns
`unconfirmed`, never success.

## Minimum tests

Each Adapter first derives a capability inventory from current official
documentation, CLI/schema, and read-only probes, then builds a neutral,
offline, deterministic minimal exhaustive fixture. Tests cover every verified
Capability and aggregate Artifact kind, native read, Artifact output, both
round trips, second-apply idempotency, unmanaged-field preservation, ownership
conflicts, confirmation success/failure/unavailability, and sensitive-data
exclusion.

Use real headless reading or execution when available. Otherwise use an
official parser, validate, list, inspect, doctor, or real discovery path plus
native-fixture round-trip equality. File existence or snapshots do not prove
target usability.

## Recommended implementation pattern (a developer asset, not an architecture concept)

Multiple Agents' Capability native shapes frequently fall into a handful of
reusable forms: one flat Markdown file per named item, one directory per
item (main file plus attachments), a single managed-block coexistence file,
or a JSON file deep-merged by key. `packages/ai-jue-core/src/
capability-mapping.ts` provides declarative factories for these four shapes
plus generic `read`/`write` composition functions, so an Adapter declares
each Capability's mapping instead of hand-writing parse/serialize logic per
Capability; read and write for one Capability are derived from the same
declaration and are inverse by construction, not by convention. This is
Adapter-internal implementation tooling, not a seventh architecture concept.
Usage guidance and when to hand-write instead live in
`packages/jue-preset-internal/skills/adapter-creator/`.

## Artifact granularity trade-off

One Adapter may produce multiple Artifact kinds for the same Agent (e.g.
Claude Code's project-native config vs. a Plugin); a selector like
`artifactKind` is Adapter-internal, never enters Canonical, and is never
promoted to a public concept. Whether to add a new Artifact kind is decided
by a downstream Gate's acceptance criteria, not by "the Agent ecosystem has
this, so we should support it":

- A Plugin is explicitly required as native-verification evidence by
  JUE-109/110 (`claude plugin validate` must pass), so generating a Plugin
  manifest is in the current problem domain and must be implemented.
- A coarser "package of Artifacts" form like a Marketplace/aggregate index
  is implemented only when a Gate explicitly requires it (e.g. R5's
  ai-assets needing to ship several Presets as one distributable unit).
  Building it before any Gate calls for it is speculative scope, even when
  the target Agent officially supports the concept.
- Composition is already closed across two layers — Preset (Capability
  composition) and Artifact (different output forms of the same Preset).
  "Multiple Artifacts composed into one larger Artifact" is still an
  Artifact-layer concern expressible with existing concepts; it needs new
  *implementation*, not a new concept, and only once a real acceptance
  criterion calls for it.
- The test: can a proposed new Artifact kind or field be pointed at a
  specific Delivery Plan task's completion evidence? If not, it doesn't get
  built yet.
