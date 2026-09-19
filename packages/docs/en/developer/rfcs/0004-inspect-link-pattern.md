# RFC-0004: Inspect contract for project-layer cross-tool links

> Status: Implemented
> Tracking: [Issue #33](https://github.com/zenHeart/ai-jue/issues/33)

## Context

The same Skill is sometimes a repository symlink under several Agent project
roots, for example `.claude/skills/<name>` pointing at `.agents/skills/<name>`.
Git for Windows defaults to `core.symlinks=false` and checks out mode `120000`
as a regular file whose contents are the target path. The Agent looks for
`SKILL.md` inside a directory, so the Skill does not load.

Apply already materializes Artifacts as regular files and directories. Inspect
needs to recognize this project-layer link pattern and report when it is broken
or not portable.

## Goals

1. Scan immediate children of known project Skill roots and report broken,
   degraded, in-repo, and out-of-repo links.
2. Record preferred / secondary / last-choice discovery across client roots.
3. Keep the apply write path emitting regular files and directories.

## Non-goals

- A new CLI command, or treating `link-pattern` as an `--extension` package id.
- Changing `directoryPerItem` or executor write semantics.
- Creating, repairing, or deleting symlinks inside ai-jue.
- Taking over multi-root projections under the user home directory.

## Alternatives

1. **Add a project scan to `jue inspect --diagnostics`** (accepted): reuse the
   existing diagnostics channel.
2. Pretend `link-pattern` is an Extension id: overloads `--extension`.
3. A new materialize command: expands the stable CLI and needs a later RFC.

## Decision

Accept alternative 1. `jue inspect --diagnostics` without `--extension` scans
the current project. When both flags are set, link findings print first, then
Extension diagnostics. Findings do not change the exit code.

## Contract

Scan roots (project-relative, immediate children only):

- `.claude/skills`
- `.cursor/skills`
- `.codex/skills`
- `.agents/skills`

| code | severity | when |
| --- | --- | --- |
| `broken-symlink` | error | symlink whose in-repo target is missing |
| `symlink-checkout-degraded` | error | regular file whose contents are a single-line path |
| `cross-tool-symlink` | warn | symlink whose target exists inside the project |
| `cross-repo-symlink` | error | symlink whose target is outside the project, `~`, or an escaping absolute path |

Each finding includes a project-relative POSIX `path`, a `remediation`, and
`evidence` of at most 200 characters. Out-of-repo targets appear as
`<outside-project>` in `target`, `expectedTarget`, and `evidence`.

## Security

The module is read-only: `lstat`, `readlink`, and a bounded file read. It does
not walk through the link into the target tree, call git, or write disk.

## Compatibility

Existing projects may see several `cross-tool-symlink` warnings on the first
run. apply, dry-run, and check stay unchanged.

## Acceptance

- Core tests cover code, severity, and relative path for all four findings.
- inspect returns the same findings for `--diagnostics` without `--extension`.
- The Guide and documentation-contract record preferred / secondary /
  last-choice; `jue-preset-base` README cites that contract.
- Navigation and docs-contract register this RFC.

## Open questions

Alternative 3 (a materialize command) waits for a later RFC.
