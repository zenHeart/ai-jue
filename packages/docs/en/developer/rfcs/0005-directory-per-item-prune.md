# RFC-0005: directoryPerItem orphan removal

> Status: Implemented
> Tracking: [Issue #26](https://github.com/zenHeart/ai-jue/issues/26),
> [Issue #35](https://github.com/zenHeart/ai-jue/issues/35)

## Context

`directoryPerItem().write()` only emits `create`/`update` for current Canonical
items. After a Preset rename or delete, the old native directory stays forever.
`ArtifactChange` already has `delete`, and the executor already branches on it,
but directory deletes need `recursive`, and the mapping never emits delete.

## Goals

1. When a Capability is part of this write, remove item directories that
   `read()` still recognizes and Canonical no longer declares.
2. Reuse the existing `ArtifactChange` pipeline for dry-run, check, and apply.
3. Fix once in Core for every Adapter that uses `directoryPerItem`.

## Non-goals

- A new CLI command or `--prune` flag.
- A full managed-file manifest (#26 wide design).
- Deleting human directories that have no main file and are invisible to `read()`.
- Inferring deletes when Canonical omits the Capability key entirely.

## Alternatives

1. **Core `directoryPerItem` orphan delete** (accepted): reuse the `read()` set.
2. Per-target managed manifest: broader, new persistent state, out of this slice.
3. A new user command: expands the stable CLI.

## Decision

Accept alternative 1. `writeCapabilities` only calls a mapping when Canonical
contains that key, so omitting a whole Capability does not delete it.

## Contract

- Orphan = names from `read()` minus names in this `value`.
- One `kind: "delete"` per orphan; `path` is the item directory; `afterHash: null`.
- The executor deletes with `fs.rmSync(path, { force: true, recursive: true })`.
- Human directories without the main file never enter `read()`, so they stay.

## Security

Deletes are limited to the Jue shape `read()` already recognizes. Paths remain
root-relative.

## Compatibility

A later apply removes stale item directories on already-projected targets.
`--dry-run` / `--check` preview the `-` lines first.

## Acceptance

- Core mapping test: rename emits delete and apply removes the old directory.
- Core executor test: directory delete with nested files succeeds.
- A human directory without the main file survives.
- Existing Claude/Codex contract tests stay green.

## Open questions

None.
