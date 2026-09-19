# RFC-0006: Same-runtime Skill collision planning

> Status: Proposed
> Tracking: [Issue #31](https://github.com/zenHeart/ai-jue/issues/31),
> [Issue #30](https://github.com/zenHeart/ai-jue/issues/30),
> [RFC-0005](0005-directory-per-item-prune.md)

## Context

The same Skill name may legally exist in different Agent-native directories.
The risk appears only when **one runtime** scans more than one populated root
and those roots share a normalized name. Codex documents scanning the CWD
ancestor chain plus `$HOME/.agents/skills`, and same-name entries may both
appear. Claude Code has project, personal, and Plugin-namespace precedence.
Antigravity same-name rules are unverified on a current desktop build; that
gate is #30.

Apply currently plans each Adapter independently, so Core cannot see which
Skills one runtime will discover.

## Goals

1. Adapters supply verified discovery-root and precedence evidence.
2. Core plans same-runtime collisions before write: identical content converges
   to one place, divergent content fails.
3. Reuse Capability, Adapter, ArtifactChange, and dry-run / check.

## Non-goals

- A seventh public concept.
- Forcing every Agent to share one physical directory.
- Treating copies for different runtimes as duplicates.
- Deleting user or third-party Skills merely because the name matches.
- Inventing Antigravity precedence before #30.

## Alternatives

1. **Adapter discovery evidence plus Core planning** (accepted direction):
   roots and precedence stay Adapter methods; Core compares identity,
   authorization, and hashes, then emits ArtifactChange.
2. A public “Discovery Root” concept: the six concepts already express this.
3. Per-Adapter dedup only: same-runtime cross-root rules would fork.

## Decision

Accept alternative 1 as the direction. If the public Extension API needs a
discovery-root field, this RFC must reach Accepted first. The current status
is Proposed and is not an implementation contract.

Verified facts (2026-08-27):

- Codex scans `.agents/skills` from CWD through repository ancestors and the
  user `.agents/skills` root.
- Claude Code keeps documented project, personal, and Plugin-namespace
  precedence.
- Antigravity workspace and user same-name rules remain unverified; implementation
  follows #30.

## Contract

Skill identity is the normalized frontmatter `name` plus the complete bundle
hash; the directory name alone is not enough.

For each normalized name visible to one runtime:

1. One managed candidate: plan the existing apply.
2. Multiple byte-identical managed candidates: choose one destination from
   verified Adapter precedence and skip redundant writes.
3. A managed candidate plus an identical unmanaged candidate: keep the
   unmanaged copy and report selected versus ignored path owners.
4. Same name with different bundle or frontmatter identity: fail before write
   with redacted path and source diagnostics.
5. A previously managed extra entry retires only through RFC-0005 recoverable
   delete.

`--dry-run` and `--check` use the same plan and write nothing. Unsupported or
unverified runtimes report `unconfirmed` for native selectors.

## Security

Diagnostics include redacted paths, normalized names, and counts. Skill bodies,
credential-shaped values, and local absolute user paths stay out of findings,
fixtures, and issues.

## Compatibility

Single-root apply stays as it is. New planning results appear only when one
runtime sees multiple roots. Any discovery-root field on the Extension API is
documented after Accepted.

## Acceptance

- A neutral fixture shows one Skill visible from two roots of the same runtime.
- Identical managed duplicates plan one destination; content conflicts fail
  before ArtifactChange execution.
- Unmanaged, target-owned, built-in, and namespaced Plugin Skills are neither
  deleted nor silently overwritten.
- Codex covers CWD, repository ancestors, and user `.agents/skills`.
- Claude covers documented precedence and Plugin namespacing.
- Antigravity coverage lands after #30.
- Chinese and English Architecture, Extension API, Adapter matrix, and
  implementation status record the verification date.

## Open questions

1. Whether discovery roots are an Adapter method result or read-only metadata
   on `defineExtension()`.
2. Antigravity same-name rules follow native evidence from #30.
