# Apply Scope and Target Root Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement RFC-0003 so `jue apply` can safely target project or Claude Code user artifacts without using the home directory as a fake project.

**Architecture:** CLI/config resolves one apply scope per Adapter. Core resolves and authorizes the Artifact root, validates every root-relative change and scope, and runs the existing executor against that root. Adapters declare supported scopes; Claude maps the user scope to its documented native paths while legacy and other built-in Adapters remain project-only.

**Tech Stack:** TypeScript, Node.js filesystem/path APIs, yargs, Zod, Vitest, VitePress.

**Spec:** `packages/docs/developer/rfcs/0003-apply-scope-target-root.md`

## Global Constraints

- Public apply scopes are exactly `project | user`; default is `project`.
- CLI scope overrides `targets.<adapter>.scope`, which overrides the default.
- Canonical DSL does not contain apply scope or filesystem roots.
- Core authorizes roots; Adapter changes remain safe root-relative paths.
- Existing Adapters without scope metadata are project-only.
- Plugin/Bundle/skill-plugin plus user scope fails before write.
- Tests use isolated temporary homes and never mutate the real user home.

---

### Task 1: Freeze RFC and documentation navigation

**Files:**
- Create: `packages/docs/developer/rfcs/0003-apply-scope-target-root.md`
- Create: `packages/docs/en/developer/rfcs/0003-apply-scope-target-root.md`
- Modify: `packages/docs/developer/rfcs/index.md`
- Modify: `packages/docs/en/developer/rfcs/index.md`
- Modify: `packages/docs/.vitepress/config.mts`
- Test: `packages/ai-jue/test/docs-contract.test.ts`

**Interfaces:**
- Produces the accepted scope/root contract used by all later tasks.

- [ ] Add the locale-paired RFC, index rows, and sidebar entries.
- [ ] Add RFC-0003 to locale-pair and sidebar contract assertions.
- [ ] Run `npm test -- packages/ai-jue/test/docs-contract.test.ts`.

### Task 2: Add apply-scope resolution and Adapter declarations

**Files:**
- Create: `packages/ai-jue/src/apply-scope.ts`
- Modify: `packages/ai-jue/src/config.ts`
- Modify: `packages/ai-jue/src/artifact-kind.ts`
- Modify: `packages/ai-jue-core/src/extension-host.ts`
- Modify: `packages/ai-jue-core/src/index.ts`
- Test: `packages/ai-jue/test/apply-scope.test.ts`
- Test: `packages/ai-jue-core/test/extension-host.test.ts`

**Interfaces:**
- Produces `ApplyScope`, `resolveApplyScope()`, `resolveArtifactRoot()`, and
  project-only compatibility for absent `supportedScopes`.

- [ ] Write tests for CLI/config/default precedence, isolated user root, invalid
  local scope, missing metadata, and invalid Adapter scope declarations.
- [ ] Run the tests and confirm failure because the API does not exist.
- [ ] Implement the minimal resolver and Extension validation.
- [ ] Run the focused tests until green.

### Task 3: Enforce root and scope safety in Core

**Files:**
- Modify: `packages/ai-jue-core/src/core-executor.ts`
- Modify: `packages/ai-jue-core/src/artifact-change.ts`
- Test: `packages/ai-jue-core/test/core-executor.test.ts`

**Interfaces:**
- Extends `ExecutionOptions` with `expectedScope?: ApplyScope`.
- Validates each `ArtifactChange` before plan/check/apply.

- [ ] Write failing tests for scope mismatch, absolute/traversal changes, and a
  symlinked path whose resolved target escapes the authorized root.
- [ ] Confirm the tests fail because the executor currently trusts changes.
- [ ] Add structural, expected-scope, and resolved-containment checks.
- [ ] Verify focused executor tests pass, including rollback and idempotency.

### Task 4: Propagate scope through mapping helpers and Claude Adapter

**Files:**
- Modify: `packages/ai-jue-core/src/capability-mapping.ts`
- Modify: `packages/ai-jue-adapter-claude/src/write.ts`
- Modify: `packages/ai-jue-adapter-claude/src/read.ts`
- Modify: `packages/ai-jue-adapter-claude/src/capabilities/context.ts`
- Modify: `packages/ai-jue-adapter-claude/src/capabilities/mcp.ts`
- Modify: `packages/ai-jue-adapter-claude/src/index.ts`
- Test: `packages/ai-jue-adapter-claude/test/user-scope.test.ts`
- Test: `packages/ai-jue-adapter-claude/test/mcp-scope.test.ts`

**Interfaces:**
- `CapabilityMapping.write(..., scope?)` and `writeCapabilities(..., scope?)`
  default to project for compatibility.
- Claude `WriteContext` consumes `{ artifactRoot?, projectRoot, scope? }`.

- [ ] Write failing user-scope tests for skills, context, settings/hooks, and MCP.
- [ ] Write failing mismatch/local MCP tests and unchanged project-path tests.
- [ ] Propagate scope through shared factories without changing other Adapter output.
- [ ] Implement Claude's documented project/user path switch.
- [ ] Run Claude round-trip, MCP, and user-scope tests until green.

### Task 5: Wire CLI, per-Adapter roots, and batch isolation

**Files:**
- Modify: `packages/ai-jue/src/commands/apply.ts`
- Modify: `packages/ai-jue/src/core-apply.ts`
- Modify: `packages/ai-jue/src/i18n.ts`
- Modify: each built-in Adapter `src/index.ts`
- Test: `packages/ai-jue/test/commands/apply.test.ts`
- Test: `packages/ai-jue/test/artifact-kind.test.ts`

**Interfaces:**
- `RunCoreAdapterOptions` consumes `scope?: ApplyScope` and internal
  `userHome?: string` for isolated tests.
- Built-ins export/decorate `supportedScopes`; only Claude includes `user`.

- [ ] Write failing tests for CLI option parsing, per-target scope, user root,
  plugin/user incompatibility, old Adapter rejection, preflight logging, and
  continuation after one Adapter fails.
- [ ] Wire `--scope`, root resolution, Adapter metadata, and expected-scope
  executor options.
- [ ] Ensure explicit configured targets can select user mode without project
  footprint inference.
- [ ] Run focused CLI tests until green.

### Task 6: Synchronize public docs and status

**Files:**
- Modify: `packages/docs/reference/project-config.md`
- Modify: `packages/docs/en/reference/project-config.md`
- Modify: `packages/docs/reference/cli/index.md`
- Modify: `packages/docs/en/reference/cli/index.md`
- Modify: `packages/docs/guide/workflow.md`
- Modify: `packages/docs/en/guide/workflow.md`
- Modify: `packages/docs/agents/claude-code.md`
- Modify: `packages/docs/en/agents/claude-code.md`
- Modify: `packages/docs/developer/implementation-status.md`
- Modify: `packages/docs/en/developer/implementation-status.md`

**Interfaces:**
- Publishes the implemented CLI/config contract and honest Adapter scope matrix.

- [ ] Document scope precedence, output paths, invalid kind combinations, and
  project/user examples in both locales.
- [ ] Mark RFC-0003 Implemented only after Task 7 evidence passes.
- [ ] Run docs contract, consistency, and docs build.

### Task 7: Verify isolated and real consumer paths

**Files:**
- Test fixtures/scripts only if needed for replayable validation.

**Interfaces:**
- Produces PR evidence for local, isolated-home, and Windows user discovery.

- [ ] Run focused scope/Core/Claude/CLI tests.
- [ ] Run all package tests in a deterministic order, build, consistency,
  security scan, docs build, and `git diff --check`.
- [ ] Apply a neutral fixture to an isolated home twice; verify first apply and
  second no-change/check behavior from an unrelated project.
- [ ] On the authorized `cheng` Windows host, run the built CLI from a repository
  with an isolated/controlled user target, verify `%USERPROFILE%\.claude\skills`,
  and verify a fresh Claude session discovers the fixture.
- [ ] Review the complete diff and sensitive-information scan before commit.
