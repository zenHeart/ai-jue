# jue-preset-internal Specification

> Status: Draft
> Version: 1.0.0

## 1. Positioning and boundary

`jue-preset-internal` serves ai-jue repository governance, bootstrap, release
discipline, and architecture constraints only. General engineering abilities
belong in `jue-preset-base`.

## 2. Minimal directory

```text
jue-preset-internal/
├── AGENTS.md
├── commands/   # as needed
├── rules/      # as needed
├── skills/     # as needed
├── hooks/      # as needed
└── tools/      # target-private escape hatch
```

Command metadata lives in `commands/*/prompt.md` frontmatter.

## 3. Self-bootstrap runbook

1. Configure root `ai.config.js` with `presets: ["internal"]`.
2. Run `npx jue apply --all`.
3. Inspect generated files and prove zero diff on the second run.
4. Do not call generated files the source of truth; Preset and Canonical inputs are.

Minimum evidence: loadable global context, at least one generated structured
Capability kind, and reproducibility from a clean checkout.

## 4. Evolution policy

- Keep internal repository-specific and minimal.
- Justify every new rule with governance value.
- Internal rules directly use public Architecture and Specification semantics.
