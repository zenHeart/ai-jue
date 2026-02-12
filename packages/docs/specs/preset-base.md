# Specification: jue-preset-base

> Status: Draft
> Version: 1.2.0

## 1. Positioning

`jue-preset-base` is the default user-facing engineering preset in the ai-jue ecosystem.
It is scenario-first and command-minimal: solve high-frequency agentic coding pain points with the smallest stable command set.

## 2. Canonical Structure

```text
packages/jue-preset-base/
├── AGENTS.md
├── AGENTS.en.md
├── commands/
│   └── <command-id>/
│       ├── prompt.md
│       └── prompt.en.md
└── package.json
```

Notes:
- `AGENTS.md` is the single global context and hard-constraint entry.
- `commands/*` is implementation storage; user-facing command names are defined in section 3.2.
- command metadata (for example `description` and `triggers`) is defined in YAML frontmatter in `prompt.md` / `prompt.en.md`.

## 3. Core Capabilities

### 3.1 Global Meta-Rules

`AGENTS.md` enforces the default engineering behavior:

- intent clarification before coding
- architecture-first implementation discipline
- verification completeness (code + tests + docs)
- review-ready, auditable delivery

### 3.2 User-Facing Command Set (Canonical Interface)

| Command | Primary Pain Point | Required Outcome |
| :--- | :--- | :--- |
| `jue:impl` | Requirement ambiguity causes rework | Clarify intent, design first, then implement and verify |
| `jue:fix` | Bug fix without root cause creates regressions | Reproduce, identify root cause, fix and run regression checks |
| `jue:rev` | Reviews only cover functionality | Cover functional and non-functional quality systematically |
| `jue:ref` | Refactor changes behavior unexpectedly | Preserve behavior, keep idempotent and rollback-friendly changes |
| `jue:exp` | Onboarding is slow | Explain architecture intent, data flow, and key constraints |
| `jue:test` | Boundary cases are missed | Generate high-value tests including edge and failure paths |
| `jue:doc` | Docs follow implementation, not user tasks | Produce user-oriented docs with low cognitive load |

### 3.3 User Interface vs. Current Asset Mapping

During migration, user-facing names remain canonical while storage paths can differ:

| User Interface | Current Asset Path |
| :--- | :--- |
| `jue:exp` | `commands/explain` |
| `jue:ref` | `commands/refactor` |
| `jue:rev` | `commands/review` |
| `jue:test` | `commands/test` |
| `jue:doc` | `commands/doc` |
| `jue:impl` | `commands/impl` |
| `jue:fix` | `commands/fix` |

`optimize` and `security` are treated as extension commands, not part of the current 7-command canonical interface.

### 3.4 Conventional Commits Alignment Layer

The preset keeps the 7-command user interface unchanged and adds a commit suggestion layer aligned with Conventional Commits 1.0.0:

| User Command | Suggested Commit Type |
| :--- | :--- |
| `jue:impl` | `feat` |
| `jue:fix` | `fix` |
| `jue:ref` | `refactor` |
| `jue:test` | `test` |
| `jue:doc` | `docs` |
| `jue:rev` | `chore` (only when code changes exist) |
| `jue:exp` | `docs` (only when doc changes exist) |

Suggested commit header format:
- `<type>(<scope>): <description>`
- breaking changes use `!` or `BREAKING CHANGE:` footer.

## 4. Bilingual Consistency Requirements

- `AGENTS.md` and `AGENTS.en.md` must remain semantically equivalent.
- `prompt.md` and `prompt.en.md` must align on behavior, not literal wording.
- Language variants should not change command intent or constraints.

## 5. Quality Goal Statement

"Review 零修改" / "zero-edit review" is a direction target, not a guaranteed baseline for every output.
Docs and release notes must not present it as already guaranteed.
