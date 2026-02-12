# Specification: jue-preset-base

> Status: Draft
> Version: 1.1.0

## 1. Positioning

`jue-preset-base` is the universal engineering preset in the ai-jue ecosystem.
It defines SDLC meta-rules and reusable command capabilities, without binding to any specific tech stack.

## 2. Canonical Structure

The canonical structure follows the minimum-knowledge principle and mainstream conventions:

```text
packages/jue-preset-base/
├── AGENTS.md              # Global meta-rules (canonical)
├── AGENTS.en.md           # English counterpart of AGENTS.md
├── commands/
│   ├── explain/
│   │   ├── index.json
│   │   └── prompt.md
│   ├── refactor/
│   ├── optimize/
│   ├── test/
│   ├── doc/
│   ├── review/
│   └── security/
└── package.json
```

## 3. Core Capabilities

### 3.1 Global Meta-Rules

`AGENTS.md` is the single global entry for the preset's system context and hard constraints, covering Phase 1 to Phase 5:

- Phase 1-2: requirement confirmation and ambiguity reduction
- Phase 3: architecture-first implementation discipline
- Phase 4: verification completeness (code/tests/docs)
- Phase 5: reviewability and structured delivery

### 3.2 Command-to-SDLC Mapping

| Command | SDLC Phase | Capability |
| :--- | :--- | :--- |
| `/explain` | Phase 2 | Business-first explanation and logic walkthrough |
| `/refactor` | Phase 3 | Behavior-preserving code refactor |
| `/optimize` | Phase 3 | Performance analysis and optimization matrix |
| `/test` | Phase 4 | Test design and generation |
| `/doc` | Phase 4 | Documentation generation |
| `/review` | Phase 5 | Structured code review |
| `/security` | Phase 5 | Security audit based on OWASP mindset |

## 4. Bilingual Consistency Requirements

- `AGENTS.md` and `AGENTS.en.md` must remain semantically equivalent.
- Command directories must keep aligned metadata and prompt intent across languages.
- Language variants should differ only in expression, not behavioral constraints.

## 5. Quality Goal Statement

"Review 零修改" is a quality target for iterative improvement, not a guaranteed current state.
Documentation and release notes must avoid presenting it as an already-achieved fact.
