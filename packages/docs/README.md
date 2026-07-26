# Documentation

Documentation package for the `ai-jue` monorepo.

The site uses three user-facing spaces. Choose a destination by the reader's
intent, not by the implementation package that owns the content.

| Space | Reader question | Source directories |
| --- | --- | --- |
| Guide | How do I complete a task? | `guide/` |
| Architecture | Why does Jue work this way, and what must an implementation preserve? | `architecture/`, `specs/`, `agents/` |
| Reference | What is the exact command, field, default, or API contract? | `reference/` |
| Developer | What is implemented, what is missing, and what comes next? | `developer/` |

`agents/` and `specs/` remain separate source directories because they have
different maintenance and review boundaries. They share the Architecture
navigation so readers do not need to learn two more top-level documentation
concepts.

## Authoring rules

- Put sequential, outcome-oriented instructions in Guide.
- Put decisions, invariants, conversion boundaries, and support profiles in
  Architecture.
- Put exhaustive, stable, scan-friendly facts in Reference.
- Put status, Roadmap, RFCs, and executable work in Developer.
- Link to the canonical page instead of duplicating definitions.
- Add or update the matching file under `en/` for every public Chinese page.
- Update `.vitepress/config.mts` and
  `packages/ai-jue/test/docs-contract.test.ts` when adding a navigable page.
