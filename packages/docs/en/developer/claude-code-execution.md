# Claude Code Execution Runbook

This page defines how Claude Code implements the
[Delivery Plan](delivery-plan.md). Task dependencies and completion criteria
come from the Delivery Plan; this page defines orchestration, isolation,
handoffs, and evidence.

R1 (the real Claude Code closed loop) is fully complete, following the
sequence below; see [Implementation Status](implementation-status.md) for
evidence. The orchestration flow this page describes applies equally from R2
onward.

## Orchestration rules

The main Claude Code session is the sole Lead. It owns task dependencies, public
contracts, and final acceptance. Parallel work is allowed only when dependencies
are satisfied and write boundaries do not overlap:

| Work | Claude Code mechanism | Constraint |
| --- | --- | --- |
| Official surface research, CLI probes, fixture cross-checks | Subagent or dynamic workflow | Read-only; return evidence URLs, versions, commands, and conclusions |
| The serial loop inside one Adapter | Main session | Keep Claude Code R1 single-threaded from fixture through native confirmation |
| Three independent Adapters after the Scale Gate | Agent View session or worktree subagent | Give each target its own worktree and Extension directory |
| Work requiring a shared task list and direct coordination | Agent Teams | Use only when explicitly enabled; partition file ownership and let the Lead integrate |
| Canonical, Core, ArtifactChange, or final contract changes | Main session | Stop parallel work and return to an Architecture/RFC decision |

Agent Teams are an optional coordination layer, not a prerequisite. The default
path must work with the main session, subagents or dynamic workflows, and
worktrees.

## Fixed roles

The Lead creates only the roles needed by the current gate:

1. **Surface Researcher** derives the target capability surface from official
   docs, CLI help/schema, and local read-only probes.
2. **Fixture Reviewer** compresses that surface into the minimal-exhaustive
   positive, preservation, and failure matrix.
3. **Adapter Owner** changes only one target Extension's
   `read/write/confirm`.
4. **Contract Verifier** runs shared schema, round-trip, idempotency,
   preservation, and security tests.
5. **Native Verifier** validates official installation, inventory, and real use
   in an isolated temporary project.

Research roles do not edit implementation. An Adapter Owner does not edit
Canonical or Core. Verifiers do not change the product contract to make a test
pass. One session may perform several roles serially, but every handoff has one
explicit artifact.

## Claude Code R1 sequence

```text
Lead freezes public contracts
  → Researcher submits the official capability matrix
  → Fixture Reviewer submits the minimal-exhaustive fixture
  → Adapter Owner completes read
  → schema and Native round-trip gate
  → Adapter Owner completes write/confirm
  → Core dry-run/apply/check gate
  → Native Verifier completes Plugin and headless gate
  → Lead replays JUE-110 in a clean environment
```

Each step starts only after the previous evidence is complete. Claude Code is
the reference Extension; public-model exploration and the three later target
implementations must not happen concurrently.

## Scale Gate (JUE-205) frozen contents

Passing the Scale Gate freezes the following; all three R3 workflows reuse it
directly rather than each redesigning their own:

- **Template**:
  `packages/jue-preset-internal/skills/adapter-creator/SKILL.md` (the
  six-phase methodology) and `references/IMPLEMENTATION-patterns.md`
  (capability-mapping code patterns), currently v6.2.0.
- **Input contract**: Phase 1's versioned capability matrix (official docs
  plus actually-run CLI output, never an unverified claim) and Phase 2's
  minimal exhaustive native fixture (one directory per Artifact kind,
  target-private preservation samples, failure samples, aggregate-Artifact
  investigation).
- **Output contract**: `packages/ai-jue-adapter-{agent}/`
  (`src/capabilities/*.ts` declaration tables, thin `read.ts`/`write.ts`
  composition, `confirm.ts`, `index.ts` assembling an `Adapter` +
  `defineExtension()`, `fixtures/`, `test/contract.test.ts` calling
  `ai-jue-core/testkit`'s `defineAdapterContractSuite`); `write()`'s output
  must run through `packages/ai-jue-core/src/core-executor.ts`'s
  `planExecution`/`applyExecution`/`checkExecution`, not a per-Adapter
  apply/rollback implementation.
- **Completion-evidence contract**: the handoff-contract field list below,
  plus native confirmation (the target's own official path — `claude plugin
  validate`/`--bare` for Claude-shaped targets; Plugin/Bundle Artifacts
  additionally need inventory and at least one real invocation).
- **Namespace boundary**: a synthetic/test-only target that can never
  produce real native confirmation must not become a standalone
  `packages/ai-jue-adapter-*` package (`jue apply`'s glob would genuinely
  discover it) — it belongs under `ai-jue-core/test/fixtures/` as an in-repo
  test fixture instead (the JUE-204 precedent).

This Scale Gate review: `npm test` (299 passing), `npm run build`,
`npm run check-consistency`, `npm --prefix packages/docs run docs:build`,
and `git diff --check` all pass; the working tree has no unexpected changes.

## Parallel work after the Scale Gate

```text
                         ┌─ Codex worktree ───────┐
JUE-205 frozen contract ─┼─ OpenClaw worktree ────┼─ Lead integration ─ R4
                         └─ Hermes worktree ──────┘
```

All three flows reuse the `agent-extension` Skill, directory skeleton, and
shared contract tests. Each branch owns only:

- its Extension directory;
- its neutral fixtures and native evidence;
- its Agent support profile.

The Lead exclusively owns shared schema, Core, CLI, authorization, and
documentation contracts. A worker that discovers a public gap submits a minimal
reproduction and proposal instead of extending public abstractions in its
target branch.

## Claude native verification

Claude Adapter completion evidence must come from an isolated temporary
project. Run the target's official static validation before deterministic
non-interactive validation:

```bash
claude plugin validate <generated-plugin>
claude --bare -p "<deterministic fixture task>" \
  --plugin-dir <generated-plugin> \
  --output-format stream-json \
  --verbose \
  --allowedTools "<minimum tools>"
```

The test harness must parse `system/init` and prove:

- the generated Plugin appears in `plugins`;
- `plugin_errors` is empty;
- visible tools, MCP servers, and Plugin inventory match the fixture;
- the final `result` succeeds and proves at least one generated capability was
  discovered or invoked.

When settings, MCP servers, or custom agents are required, load them explicitly
with `--settings`, `--mcp-config`, or `--agents`. Fixtures do not depend on a
user directory, auto memory, or existing machine configuration. Permissions use
the smallest `--allowedTools` set needed by the test.

## Handoff contract (frozen by JUE-205)

Every task output contains:

```text
task_id
status
owned_paths
official_evidence
fixture_cases
changes
commands_run
logical_results
native_results
security_results
remaining_risks
next_ready_task
```

`status` is one of `done`/`blocked`/`ready`/`in_progress`. `changes` lists the
actual file paths touched (not a description of the output). `security_results`
records the outcome of any sensitive-reference/credential check — even when a
task doesn't touch that surface, write "not applicable" explicitly rather than
omitting the field. `next_ready_task` is the next `ready` task ID per the
Delivery Plan's dependency graph, for handoff.

The Lead accepts only evidence reproducible from a clean worktree. Unit tests
and schema checks prove logical facts; official validate, inventory, headless,
or real reads prove runtime facts. If either class is missing, the task remains
`blocked`; a prose summary is not a substitute.

## Final ai-assets phase

Freeze all four Adapters and cross-conversion contracts before R5. The Claude
Code Lead first generates a redacted inventory and then migrates ai-assets to
the new Preset. Four-target validation may run in parallel worktrees, while the
Lead consolidates results against the same inventory.

Completion requires a semantically equivalent native Artifact and runtime
evidence for every inventory item on every target. Locate any gap in the Preset,
Canonical, Adapter, or native-verification layer. Enter RFC only after proving
the six concepts cannot express the requirement; a private asset does not
justify a public shortcut.
