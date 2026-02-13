---
name: adapter-creator
description: Creates or optimizes ai-jue adapters for AI tools. Use when user asks to "create adapter for [tool]", "add support for [tool]", or "optimize/update [tool] adapter".
compatibility: Works in ai-jue monorepo with TypeScript/pnpm.
metadata:
  version: 3.0.0
  tags: [adapter, scaffolding, optimization, design-first, agentic-workflow, self-correction]
---

# Adapter Creator

Create or optimize production-ready ai-jue adapters following the "Document-First" workflow.

## 1. Workflow Initialization: Mode Selection

**Goal**: Determine whether to run in "Create Mode" or "Optimize Mode".

**Action**:
1.  From the user's request (e.g., "optimize cursor adapter"), identify the tool name: `{tool}`.
2.  Construct the directory path: `packages/ai-jue-adapter-{tool}`.
3.  Use the `list_directory` tool on that path.
    -   **If the tool returns a "Not Found" error**: The adapter does not exist. Proceed in **Create Mode**.
    -   **If the tool returns a list of files**: The adapter exists. Proceed in **Optimize Mode**.

---

## 2. Create Mode Workflow

> This workflow runs if the adapter does not already exist.

### Phase 1 (Create): Research & Capability Mapping

**Goal**: Map ai-jue's 8 capabilities to the target tool's native features.
**Action**:
1.  Use `web_search` to find the target tool's official documentation.
2.  Create a Capability Matrix with the status for each capability: `native` / `degraded` / `unsupported`.

### Phase 2 (Create): Design Documentation

**Goal**: Generate bilingual adapter READMEs from a template.
**Action**:
1.  Use `read_file` to read `references/README-template.md` and `references/README-template.en.md`.
2.  Fill in the placeholders based on research.
3.  Use `write_file` to create `packages/ai-jue-adapter-{tool}/README.md` and `README.en.md`.

### Phase 3 (Create): Implementation

**Goal**: Scaffold the new adapter and integrate it into the monorepo.
**Action**:
1.  **Scaffold Files**: Use `write_file` to create the initial file structure (`package.json`, `src/index.ts`, etc.).
2.  **Implement Logic**: Use `replace` or `write_file` to implement the logic in `src/index.ts` and `test/index.test.ts`.
3.  **Update Workspace**: Use `read_file` and `write_file` to add the new adapter path to the root `pnpm-workspace.yaml`.

---

## 3. Optimize Mode Workflow

> This workflow runs if the adapter already exists.

### Phase 1 (Optimize): Analysis & Research

**Goal**: Analyze the existing adapter and research the latest tool capabilities to find optimization opportunities.
**Action**:
1.  Use `read_file` to get the content of the existing `packages/ai-jue-adapter-{tool}/src/index.ts` and `README.md`.
2.  Use `web_search` to find the latest official documentation for the tool.
3.  Compare the existing implementation against the latest docs and identify gaps, potential improvements, or new features.
4.  Update the Capability Matrix based on these findings.

### Phase 2 (Optimize): Update Design Documentation

**Goal**: Update the adapter's README to reflect the planned optimizations.
**Action**:
1.  Use `read_file` to get the current content of `packages/ai-jue-adapter-{tool}/README.md`.
2.  Based on the analysis from Phase 1, update the Capability Matrix and Implementation Details sections.
3.  Use `replace` or `write_file` to save the updated README.

### Phase 3 (Optimize): Refactor Implementation

**Goal**: Apply optimizations and refactor the existing adapter code.
**Action**:
1.  Use `read_file` to get the current content of `packages/ai-jue-adapter-{tool}/src/index.ts` and `test/index.test.ts`.
2.  Apply the refactoring based on the updated design. This may involve adding new features, improving efficiency, or enhancing capability mapping.
3.  Use `replace` or `write_file` to save the updated code.

---

## 4. Shared Gates & Verification

> Both workflows converge here.

### 🔴 Gate 1: Capability Review

**Trigger**: After Phase 1 (Create or Optimize) completes.
**Action**: STOP. Present the (new or updated) Capability Matrix to the user for confirmation.
**Fallback**: If the user suggests changes, you MUST return to Phase 1, apply the feedback, and re-present this Gate.

### 🔴 Gate 2: Design Review

**Trigger**: After Phase 2 (Create or Optimize) completes.
**Action**: STOP. Present the (new or updated) README design document to the user for confirmation.
**Fallback**: If the user suggests changes, you MUST return to Phase 2, apply the feedback, and re-present this Gate.

### Phase 4: Verification & Self-Correction

**Goal**: Ensure the adapter passes all tests.
**Action**:
1.  Use `run_shell_command` to run `pnpm install` in the monorepo root.
2.  Enter **Self-Correction Loop (Max 3 retries)**:
    1. Run `pnpm test` on the specific adapter package.
    2. If it succeeds, exit the loop.
    3. If it fails, read the error, analyze the code (`read_file`), apply a fix (`replace`/`write_file`), and retry the test.
3.  Run the cross-adapter contract test.

### 🟢 Gate 3: Completion Confirmation

**Trigger**: After all tests pass.
**Action**: STOP. Present a summary of the created/optimized adapter to the user for final approval.
**Fallback**: If the user reports final issues, attempt to fix and re-verify.

---
## References & Governance
(Content of References and Governance Rules sections remains unchanged)
...
