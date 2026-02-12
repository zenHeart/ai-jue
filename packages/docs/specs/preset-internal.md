# Specification: jue-preset-internal

> Status: Draft
> Version: 1.0.0

## 1. Positioning and Scope Boundary

`jue-preset-internal` is a repository-governance preset for maintaining the ai-jue monorepo itself.

Boundary definition:

- `jue-preset-base`: reusable, stack-agnostic engineering capabilities for general projects.
- `jue-preset-internal`: project-specific governance, release discipline, architecture constraints, and repo-level collaboration rules.

Internal must not become a generic replacement for base.

## 2. Minimal Directory Protocol

Internal preset should provide only required assets, enabled on demand:

```text
jue-preset-internal/
├── AGENTS.md
├── commands/   # optional, when repo-specific commands are needed
├── rules/      # optional, when repo rule assets are needed
├── hooks/      # optional, when workflow hooks are needed
└── tools/      # optional, tool-specific escape hatch
```

Additional assets can be added only when there is clear repository governance value.

## 3. Self-Bootstrap Runbook

The repository must be able to bootstrap itself through internal preset:

1. Configure root `ai.config.js` with `preset: "internal"`.
2. Run `npx jue apply`.
3. Verify generated outputs are produced by all active adapters.
4. Use generated files as the single source for repo-level assistant behavior.

Minimal closure criteria:

- Global context is loadable from `AGENTS.md`.
- At least one verifiable asset category is loadable (for example commands or rules).
- Generated outputs are reproducible after clean checkout.

## 4. Evolution Policy

- Keep internal focused and minimal; push generic capabilities back to base.
- Every new internal rule should include justification tied to monorepo governance.
- Avoid introducing ai-jue-specific concepts that increase user cognitive load.
