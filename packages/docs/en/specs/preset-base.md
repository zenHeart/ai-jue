# jue-preset-base Specification

> Status: Draft
> Version: 1.2.0

## 1. Positioning

`jue-preset-base` is the default general engineering Preset. It addresses
common Agent coding tasks with a small stable command set and contains no
repository-private governance.

## 2. Canonical structure

```text
packages/jue-preset-base/
├── AGENTS.md
├── AGENTS.en.md
├── commands/<command-id>/prompt.md
├── commands/<command-id>/prompt.en.md
└── package.json
```

Command metadata lives in prompt frontmatter.

## 3. Core capabilities

### 3.1 Global meta-rules

`AGENTS.md` defines intent clarification, architecture-first work, complete
verification, and reviewable delivery.

### 3.2 User command set

| Command | Outcome |
| --- | --- |
| `impl` | Clarify, design, implement, verify |
| `fix` | Reproduce, root cause, fix, regress |
| `review` | Functional and non-functional review |
| `refactor` | Behavior-preserving refactor |
| `explain` | Explain architecture, data flow, constraints |
| `test` | Boundary and failure-path tests |
| `doc` | Low-burden user documentation |

Storage IDs are Canonical command IDs.

### 3.3 Extension commands

`optimize` and `security` may be distributed as ordinary commands without
changing the Canonical Capability set.

### 3.4 Commit suggestions

Commit types are output suggestions, not Capabilities or side effects. The user
always decides whether to commit.

## 4. Bilingual consistency

`AGENTS.md`/`AGENTS.en.md` and prompt variants remain semantically equivalent.
Language never changes behavior, permission, or acceptance.

## 5. Quality target

The `review` command targets zero-edit output as a quality direction; it is a
direction, not a guarantee, and documentation and outputs must not present it
as achieved fact.
