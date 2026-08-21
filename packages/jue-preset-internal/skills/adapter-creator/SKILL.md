---
name: adapter-creator
description: Creates or optimizes ai-jue Agent Adapters (Native ⇄ Canonical DSL). Use when user asks to "create adapter for [agent]", "add support for [agent]", or "optimize/update [agent] adapter".
compatibility: Works in ai-jue monorepo with TypeScript/npm workspaces.
metadata:
  version: 6.2.0
  tags: [adapter, capability-mapping, native-verification, equivalence-contracts, agentic-workflow, shared-contract-tests]
---

# Adapter Creator

This is the repository's `agent-extension` Skill referenced by
`packages/docs/developer/delivery-plan.md`'s R2 (JUE-201): it standardizes
official capability search, evidence recording, aggregate-Artifact
investigation, fixture design, mapping, and confirmation so that onboarding
Codex/OpenClaw/Hermes (R3) follows the same sequence Claude Code (R1) already
proved out, without any of it becoming a seventh architecture concept.

A six-phase workflow for building a Native ⇄ Canonical Agent Adapter with real
runtime evidence, not just passing unit tests. Worked example throughout:
`packages/ai-jue-adapter-claude` (`read.ts`/`write.ts`/`capabilities/*.ts`,
`fixtures/`). Design rationale:
`docs/superpowers/specs/2026-07-26-capability-mapping-engine-design.md`.

## 0. Problem Definition & Mode Selection

1. Identify target `{agent}`.
2. **Is `{agent}` a real target with its own official CLI/tooling (an R3
   candidate, or a real Agent someone will actually run `jue apply` against),
   or a synthetic/fictional target built purely to stress-test this Skill's
   or the shared contract-test kit's generality (as JUE-204 needed)?**
   - **Real** → a `packages/ai-jue-adapter-{agent}` workspace package, per
     the steps below.
   - **Synthetic/test-only** → do **not** create a workspace package.
     `packages/ai-jue/src/commands/apply.ts`'s `findAdapters()` discovers
     every `packages/ai-jue-adapter-*/package.json` via glob, so a real
     package is genuinely picked up by `jue apply --all` and
     `scripts/smoke-apply.js` — a construct with no real native tool to
     confirm against would pollute that namespace with a fake, user-visible
     but never-actually-usable target. Build it as an in-repo test fixture
     instead (see `packages/ai-jue-core/test/fixtures/neutral-adapter/` for
     the worked example) — the same pattern kernel-plus-plugin repos like
     Rollup/Vite/Webpack/Babel/ESLint use for synthetic plugins/loaders/
     rules built to prove framework generality.
3. For a real target, check if `packages/ai-jue-adapter-{agent}` exists.
   - **Missing?** → **Create Mode**.
   - **Exists?** → **Optimize Mode**.

---

## 1. Official Capability Discovery

**Goal**: a versioned capability matrix backed by things you actually ran,
not things you remember or assume.

1. Read the current official docs for `{agent}`'s skill/agent/command/
   rule/hook/MCP/project-config/user-config/Plugin-or-Bundle surface.
2. Run the agent's own CLI `--help` (and every subcommand's `--help`) and
   any `validate`/`list`/`inspect`/`doctor` commands it offers. Record the
   exact command and its exact output for every fact in the matrix.
3. **Verify every claim by running it**, even ones the docs state plainly.
   `packages/ai-jue-adapter-claude/fixtures/README.md`'s "Corrections found
   while building this fixture" section exists because a prior *reading*
   of the docs got several field shapes wrong (`hooks.json`'s wrapper key,
   `dependencies`'s array-vs-object shape, two fields that don't actually
   exist) that only surfaced once real fixtures were validated against the
   real CLI. Reading documentation is a starting hypothesis, not a fact.
4. If a precise, verified source can't be found for a capability, **stop
   and ask the user** rather than guessing. Record "not runtime-verified"
   explicitly for anything sourced from docs alone (see
   `packages/docs/agents/claude-code.md` §"not verified" callouts) — don't
   let it read as confirmed.

---

## 2. Minimal Exhaustive Native Fixture

**Goal**: a neutral, low-sensitivity, offline-reproducible fixture tree
covering every Capability, every target-private field worth preserving,
every aggregate Artifact kind, and known failure/edge cases — see
`packages/ai-jue-adapter-claude/fixtures/` for the shape (`project/`,
`plugin/`, `plugin-auto-discovered/`, `marketplace/`, `conflicts/`,
`failures/*`).

1. One directory per Artifact kind (e.g. project-native config vs. an
   installable Plugin/Bundle).
2. One fixture per target-private field you intend to preserve verbatim.
3. One fixture per known edge case: empty value, name collision, illegal
   path, sensitive-looking reference, unsupported semantics.
4. Validate every fixture against the agent's own tooling (its `validate`,
   `list`, or equivalent) and record the exact command + outcome in a
   `fixtures/README.md`. A fixture that only exists to make your own parser
   happy proves nothing.
5. **Aggregate-Artifact investigation**: before adding a new Artifact kind
   (a coarser "package of Artifacts" form — a Bundle, marketplace-style
   index, or similar) because the target Agent's ecosystem happens to
   support one, apply the trade-off test in
   `packages/docs/architecture/adapter-standardization.md`"Artifact
   granularity trade-off": can a specific Delivery Plan task's completion
   evidence be pointed at it? If no current Gate needs it, fixture the
   individual-item Artifact kinds only and record the aggregate form as
   deliberately deferred, not silently skipped.

---

## 3. Native → Canonical (`read()`)

**Goal**: `read(context): Promise<CanonicalDocument>`, schema-valid against
every fixture from Phase 2.

1. For each Canonical Capability, check whether `{agent}`'s native shape
   matches one of the four reusable patterns in
   `packages/ai-jue-core/src/capability-mapping.ts`:
   - `flatMarkdownDirectory` — one `<name>.md` file per item (frontmatter + body)
   - `directoryPerItem` — one directory per item, main file + attachment bundle
   - `managedMarkdownFile` — a single `AI-JUE:START/END`-managed file
   - `mergedJsonFile` — a JSON file where Jue owns one key (or the whole file), deep-merged
2. **Use the matching factory before writing bespoke parse/serialize
   logic.** Declare the mapping in `packages/ai-jue-adapter-{agent}/src/
   capabilities/<capability>.ts` (see `rules.ts`/`commands.ts`/`hooks.ts`/
   `mcp.ts` in the Claude adapter for worked examples, including how
   `hooks.ts`/`mcp.ts` inject agent-specific shape knowledge via
   `toCanonical`/`toNative` callbacks without touching the generic engine).
3. Only write a fully custom `CapabilityMapping` (or skip the engine
   entirely, as `capabilities/context.ts` does for Claude's `@import`
   resolution) for a shape genuinely unique to this Capability — YAGNI
   against forcing every last thing through the abstraction.
4. Compose the table and call `readCapabilities(mappings, root)`; `read.ts`
   itself should end up as a thin composition (~30–50 lines), not a parser.

---

## 4. Canonical → Artifact (`write()`)

**Goal**: `write(canonical, context): Promise<ArtifactChange[]>` — computing
changes, never performing I/O directly (Core executes approved
`ArtifactChange`s; see `packages/docs/architecture/adapter-standardization.md`).

1. Reuse the **same** `capabilities/*` mapping table from Phase 3 —
   `writeCapabilities(mappings, canonical, root, target)` derives the write
   side from the identical declaration, so read and write are inverse by
   construction, not by convention.
2. Every `ArtifactChange` needs `content` (the actual bytes to write) in
   addition to `beforeHash`/`afterHash` — a hash alone gives Core nothing to
   write. `assertArtifactChange` enforces `content`'s hash matches
   `afterHash` and that it's present for `create`/`update`, absent for
   `delete`.
3. Handle multiple native Artifact "layouts" (e.g. project vs. Plugin) by
   parameterizing the mapping factories on a small `layout.ts`-style helper
   (see the Claude adapter's `capabilities/layout.ts`), not by duplicating
   `read.ts`/`write.ts` per layout.
4. **Don't write your own apply/rollback logic.** Once `write()` returns
   `ArtifactChange[]`, run it through `packages/ai-jue-core/src/
   core-executor.ts`'s `planExecution`/`applyExecution`/`checkExecution`
   (JUE-108) — the shared drift detection (real on-disk hash vs.
   `beforeHash`), authorization gating (`requiresApproval`), and
   atomic-apply-with-rollback (snapshot before each write, restore
   everything already applied in the batch on a later failure) already work
   for any Adapter's output. `applyChangesOrThrow` is the "write or throw"
   convenience for an Adapter's own `generate()` or test scaffolding that
   doesn't need to inspect the full result. Do not reintroduce a
   per-Adapter or per-target executor — Core executes `ArtifactChange`, full
   stop.

---

## 5. Equivalence Contracts

**Goal**: both contracts pass with real fixtures, not just "the code
compiles."

```text
normalize(read(write(C))) = normalize(C)
normalize(read(write(read(N)))) = normalize(read(N))
```

1. **Don't hand-write these tests.** Import `defineAdapterContractSuite` from
   `ai-jue-core/testkit` and `{ describe, expect, it }` from `vitest`, then
   call the suite with `testApi: { describe, expect, it }`, your Adapter's
   `read`/`write`, a synthetic Canonical fixture, and your Phase 2 native
   fixtures. See `packages/ai-jue-adapter-claude/test/contract.test.ts` for
   the worked example. The caller-supplied API keeps the CommonJS Core
   package independent of Vitest's ESM runtime. It registers both equivalence
   contracts, idempotency, unmanaged-field preservation, sensitive-reference
   rejection, and (via each fixture's optional `confirmNatively` callback)
   native confirmation, materializing `ArtifactChange[]` through the real
   `applyChangesOrThrow`/`core-executor.ts` apply path, not a bespoke
   test-only writer. This subpath is test-only (`vitest` is an optional peer
   used for types; the caller owns the runtime import) and deliberately not exported from
   `ai-jue-core`'s main entry point.
2. Test the first contract against a synthetic, already-normalized
   Canonical fixture (mirrored `content`/`prompt`, explicit hook `type`,
   etc. — see `contract.test.ts`'s `SYNTHETIC_CANONICAL`).
3. Test the second contract against **every** native fixture from Phase 2,
   across every Artifact layout — one `nativeFixtures` entry each.
4. **Expect to find real bugs here.** Building the Claude adapter this way
   surfaced a genuine bug — `context.global`'s `read()` never stripped the
   `AI-JUE:START/END` wrapper, so writing then reading back silently
   corrupted the value — that no unit test aimed at either function alone
   would have caught. The round-trip is the point.

---

## 6. Native Confirmation

**Goal**: proof `{agent}` itself recognizes what was generated — file
existence or a green test suite is not evidence of this.

1. Prefer the agent's official `validate`/`list`/`inspect`/`doctor` command
   over a bespoke check.
2. If the agent supports a headless mode, use it — but **verify its actual
   cost/behavior yourself first**. A prior discovery pass claimed a
   particular headless invocation was "zero-cost"; running it for real
   showed a normal, billed model turn (see
   `packages/ai-jue-adapter-claude/fixtures/README.md`, "the same command
   produced a real charge"). Never propagate an unverified cost/behavior
   claim into a repeatable test.
3. Plugin/Bundle Artifacts additionally need: official install/load,
   inventory, and at least one real capability discovery or invocation
   through the agent itself.
4. **Reusable script shape** (see `scripts/verify-claude-native.js` and
   `scripts/verify-claude-mvp-gate.js` as worked templates — copy the
   structure, not the Claude-specific fixture): build a minimal fixture via
   the Adapter's own `write()` in an isolated temp directory → run the
   agent's official static validator → force a real mid-batch write
   failure and prove `core-executor.ts` rolls it back, then re-validate the
   untouched fixture natively (rollback isn't proven until the native tool
   confirms nothing was corrupted) → headless-invoke one purpose-built,
   tool-free, deterministic capability (a command whose entire instruction
   is "output exactly this marker string, call no tools") and assert the
   marker appears in the final result, not just that the invocation didn't
   error. Keep the paid/networked step skippable (check for the agent's
   auth env vars; skip with a clear message rather than fail when absent)
   so the free steps still run in a script anyone can execute, and never
   wire the paid step into `npm test`.
5. **Auth and isolation are not the same problem, and neither is free to
   assume.** A headless "isolated" mode may still require its own explicit
   credentials distinct from whatever interactive auth already works, and
   "isolated" may only mean "skips hooks/memory," not "ignores every other
   real extension already installed on the machine" — check both
   empirically for `{agent}` rather than assuming they work like Claude
   Code's `--bare` (see `fixtures/README.md`'s JUE-109 corrections for the
   exact gap found there). Match on the fixture's own name/identifier in
   any inventory output, not an exact list length or count.
6. A capability that references an external process (an MCP-server-style
   dependency, a plugin binary, etc.) that isn't actually runnable in the
   fixture does not necessarily block headless invocation — confirm
   empirically whether the agent connects eagerly (on load) or lazily (only
   when the capability is actually used) before assuming a broken reference
   requires a working stub.

---

## Quality Gates

- `npm test`, `npm run build`, `npm run check-consistency`,
  `npm --prefix packages/docs run docs:build`, `git diff --check` — all
  green.
- Every native-tooling command from Phases 2 and 6 is reproducible from a
  clean worktree and recorded (command + outcome), not paraphrased from
  memory.
- Delivery Plan / Implementation Status entries cite the actual file paths
  touched, and clearly separate what's runtime-verified from what's
  sourced from documentation alone.

## References

- `references/IMPLEMENTATION-patterns.md` — capability-mapping code patterns
- `references/README-template.md` / `README-template.en.md` — adapter package README template
- `packages/ai-jue-adapter-claude/` — reference implementation for all six phases
- `packages/ai-jue-core/src/core-executor.ts` — the shared apply/dry-run/check
  engine every Adapter's `write()` output runs through (Phase 4/5)
- `ai-jue-core/testkit` (`packages/ai-jue-core/src/adapter-contract-kit.ts`) —
  the shared contract-test suite every Adapter reuses (Phase 5, JUE-202);
  `packages/ai-jue-adapter-claude/test/contract.test.ts` is the worked example
- `scripts/verify-claude-native.js` / `scripts/verify-claude-mvp-gate.js` —
  worked templates for Phase 6's reusable native-verification script shape
- `rules/concise-functional-typescript/prompt.md` — dispatch-table-over-if/else, no monolithic files
