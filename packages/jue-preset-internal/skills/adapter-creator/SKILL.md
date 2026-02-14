---
name: adapter-creator
description: Creates or optimizes ai-jue adapters for AI tools. Use when user asks to "create adapter for [tool]", "add support for [tool]", or "optimize/update [tool] adapter".
compatibility: Works in ai-jue monorepo with TypeScript/pnpm.
metadata:
  version: 4.0.0
  tags: [adapter, scaffolding, optimization, design-first, agentic-workflow, self-correction]
---

# Adapter Creator

A workflow for building production-ready `ai-jue` adapters. This skill focuses on **solving the integration problem** between `ai-jue`'s standard capabilities and a target tool's native features.

## 1. Problem Definition & Mode Selection

**Context**: You need to bridge `ai-jue` (standard config) and a Tool (native config).
**Action**:
1.  Identify the target tool name `{tool}` from the request.
2.  Check if `packages/ai-jue-adapter-{tool}` exists using `list_directory`.
    -   **Missing?** -> **Create Mode**: You are building from scratch.
    -   **Exists?** -> **Optimize Mode**: You are improving an existing integration.

---

## 2. Create Mode: The "Research-First" Workflow

> **Goal**: Build a complete adapter that maps ALL 8 ai-jue capabilities.

### Step 1: Deep Research (The Foundation)
**Why**: You cannot map what you don't understand.
**Action**:
1.  Use `web_search` to find the **official documentation** for the target tool.
2.  **Mandatory**: Find the specific documentation URL for EACH of these features:
    *   Context / Global Instructions (AGENTS.md)
    *   Project Rules (Path-specific instructions)
    *   Custom Slash Commands
    *   Agent Skills / Reusable workflows
    *   MCP (Model Context Protocol) Support
    *   Lifecycle Hooks (scripts)
    *   Agent Personas
    *   Configuration / Settings files
3.  **Output**: Keep these URLs ready for Step 2.

### Step 2: Design by Contract (The Template)
**Why**: We enforce consistency across all adapters via templates.
**Action**:
1.  Read `references/README-template.md` and `references/README-template.en.md`.
2.  **Strictly fill in the templates**.
    *   **CRITICAL**: In the "Capability Mapping Matrix", you **MUST** insert the documentation links found in Step 1.
    *   Do not remove sections. If a feature is unsupported, mark it "Unsupported" but keep the row.
3.  Write the files to `packages/ai-jue-adapter-{tool}/README.md` (and .en.md).

### Step 3: Scaffolding & Implementation
**Why**: Turn the design into code.
**Action**:
1.  Create `package.json` (use `ai-jue-adapter-gemini/package.json` as a reference).
2.  Create `tsconfig.json`.
3.  Create `src/index.ts`. Use patterns from `references/IMPLEMENTATION-patterns.md`.
    *   Implement the `generate` function.
    *   Ensure all 8 capabilities defined in the README are handled (either natively or degraded).

### Step 4: Verification
**Action**:
1.  Create `test/index.test.ts`. Use the testing patterns from `references/IMPLEMENTATION-patterns.md`.
2.  Run `npm run build`.
3.  Run `npm test`.

---

## 3. Optimize Mode: The "Gap-Analysis" Workflow

> **Goal**: Bring an existing adapter up to the latest v4.0.0 standard.

### Step 1: Gap Analysis
**Action**:
1.  Read the existing `README.md`.
2.  Compare the "Capability Matrix" against the standard 8 capabilities in `references/README-template.md`.
3.  Identify missing capabilities, missing documentation links, or outdated formats.

### Step 2: Documentation Refresh
**Action**:
1.  Re-generate `README.md` and `README.en.md` using the **latest templates**.
2.  Fill in any missing documentation links (use `web_search` if needed).
3.  Ensure the "Implementation Details" section accurately reflects the code (or planned code).

### Step 3: Code Refactoring
**Action**:
1.  Update `src/index.ts` to match the new README design.
2.  Ensure strict adherence to `references/IMPLEMENTATION-patterns.md` (e.g., proper AGENTS.md handling).

---

## 4. Quality Gates (Self-Correction)

**Gate 1: The Documentation Link Check**
*   **Check**: Does the `README.md` Capability Matrix contain valid URLs for all native features?
*   **Correction**: If links are missing, search again. Do not hallucinate links.

**Gate 2: The 8-Capability Check**
*   **Check**: Does the adapter handle ALL 8 capabilities (Agents, Rules, Skills, Commands, Hooks, MCP, Context, Config)?
*   **Correction**: If any are missing from `src/index.ts`, implement a degradation strategy (e.g., write to system prompt).

**Gate 3: The Smoke Test**
*   **Check**: Run `npx jue apply --adapter {tool}`. Does it crash? Are files generated?
*   **Correction**: Fix bugs until it passes.

---
## References
*   `references/README-template.md`: The single source of truth for adapter documentation.
*   `references/IMPLEMENTATION-patterns.md`: Copy-pasteable code blocks for standard tasks.
