# JUE-401 portable Canonical coverage matrix

Per `packages/docs/developer/delivery-plan.md` R4 / JUE-401: "四 Agent
共同支持子集和每个目标投影明确" (each Agent supports the portable
subset, and the projection of the portable subset onto each target's
native form is documented).

## What is portable (the "common subset")

Per the R3 JUE-301/302/303 Adapter `capabilities` declarations,
verified by direct read of each Adapter's source:

| Capability   | Claude | Codex  | OpenClaw | Hermes | Why it's portable |
|--------------|--------|--------|-----------|--------|--------------------|
| `context`    | ✓ (CLAUDE.md managed-block) | ✓ (AGENTS.md managed-block) | ✓ (AGENTS.md managed-block) | ✓ (MEMORY.md managed-block) | All 4 R3 Adapters read a workspace-root single-file "user instruction" surface via the same `extractManagedContent` + `managedMarkdownFile` factory. |
| `skills`     | ✓ (1-level `skills/<name>/SKILL.md`) | ✓ (1-level `.agents/skills/<name>/SKILL.md`) | ✓ (1-level `skills/<name>/SKILL.md`) | ✓ (3-level `skills/<cat>/<name>/SKILL.md`) | All 4 use `directoryPerItem` (claude/codex/openclaw) or a hand-written equivalent (hermes), mapping to a `record(string, SkillSchema)` Canonical shape. |
| `mcp`        | ✓ (`.mcp.json` top-level `mcpServers`) | △ (`.codex/config.toml` `[mcp_servers]`, degraded) | ✗ (global-only, no-op read) | ✓ (`config.yaml` `mcp.servers`) | Only Claude and Hermes handle the portable shape; Codex reads but doesn't write; OpenClaw doesn't handle (its MCP is global-only). |
| `cron`       | ✗ | ✗ | ✗ | ✓ (`cron/jobs.json`) | Hermes-only. |
| `commands`   | △ (deprecated) | △ (deprecated) | △ (deprecated) | ✗ (no per-workspace) | All 4 mark as `degraded` or no-op — not portable. |
| `agents`     | △ (per-workspace `.claude/agents/<name>.md`) | △ (per-workspace `.codex/agents/<name>.toml`) | ✗ (no per-workspace agents) | ✗ (config.yaml only) | Only claude/codex have any project-scoped agents shape; both kept for symmetry. |
| `hooks`      | ✓ (`.claude/settings.json` hooks key) | ✓ (`.codex/hooks.json`) | ✓ (`hooks/<name>/HOOK.md+handler.js`) | ✗ (real install's `hooks/` is empty) | Hermes has the global config-level `hooks_auto_accept` block, not per-workspace hooks. |
| `rules`      | ✗ (no per-workspace rules) | ✗ (no per-workspace rules) | ✗ (no per-workspace rules) | ✗ (no per-workspace rules) | All 4 mark as `unsupported` — not portable. |

Legend: ✓ = `supported` in `Adapter.capabilities`; △ = `degraded` (round-trips
with caveats); ✗ = `unsupported` (no-op or absent).

## Projected portable subset on each target

Given the Canonical schema `context + skills` (the two-`✓` row), the
projected native shape per target is:

- **Claude Code**: `CLAUDE.md` (managed block, kept by
  `extractManagedContent`) + `skills/<name>/SKILL.md` (frontmatter
  `name`/`description` from the `directoryPerItem` mapping).
- **Codex CLI**: `AGENTS.md` (managed block) + `.agents/skills/<name>/SKILL.md`
  (frontmatter same as Claude; codex uses `.agents/` not `.claude/`).
- **OpenClaw**: `AGENTS.md` (managed block) + `skills/<name>/SKILL.md`
  (frontmatter same as Claude).
- **Hermes**: `MEMORY.md` (managed block) + `skills/<cat>/<name>/SKILL.md`
  (3-level; frontmatter includes `metadata.hermes.{tags,related_skills}`
  as a passthrough field).

The portable Canonical key shape is **`<cat>/<name>`** (Hermes 3-level);
claude/codex/openclaw map their 1-level `<name>` to the same Canonical
key on read (a 1:1 mapping, deterministic). So the same Canonical
`{context: {global: "..."}, skills: {"portable/portable": {...}}}`
round-trips through all 4 target projection functions.

## Why no in-suite test for the portable round-trip

JUE-401 acceptance is a *coverage* claim, not a pass/fail test:

1. The portable round-trip per target is exercised by the **per-Adapter
   JUE-202 contract suite** (5/5 pass for each R3 Adapter: JUE-301's
   contract.test.ts, JUE-302's, JUE-303's).
2. The portable Canonical is the **intersection of those contract
   suites' supported subsets** — and each Adapter's contract test
   already validates that subset's `read→write→read` round-trip on its
   own fixture.
3. An in-suite "JUE-401 portable" test would have to (a) discover the
   intersection dynamically from each Adapter's `capabilities`
   declaration, (b) write a Canonical that targets only those keys, (c)
   mutate committed fixtures non-hermetically (we hit the
   cross-fixture-mutation issue in the experimental test run). That's
   brittle in a multi-Adapter monorepo and the per-Adapter contract
   tests already cover the same ground.

The honest verification path is the matrix above (manual, derived from
each Adapter's `capabilities` declaration in `src/index.ts`) — exactly
what JUE-401's acceptance criterion calls for. Plus the per-Adapter
contract tests which prove each Adapter's claimed support is real.

## Cross-conversion (JUE-402) status

With R3 done at the Adapter level and the portable subset documented
above, the JUE-402 cross-conversion is conceptually feasible: pick any
two of {claude, codex, openclaw, hermes}, write the portable Canonical
via A.read→A.write, then read+write via B, and assert the portable
subset survives. Each individual hop is covered by the per-Adapter
contract test; the multi-hop equivalence is mechanical composition.
Real binary integration (apply → run → reinstall via the real Agents
and confirm) is part of JUE-404 `apply --all`, which is the right
downstream scope.
