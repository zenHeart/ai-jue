---
name: adapter-creator
description: Creates or optimizes ai-jue adapters for AI tools. Use when user asks to "create adapter for [tool]", "add support for [tool]", or "optimize/update [tool] adapter".
metadata:
  version: 4.3.0
  tags:
    - adapter
    - scaffolding
    - optimization
    - design-first
    - agentic-workflow
    - self-correction
    - anti-hallucination
    - collaborative-verification
---


# Adapter Creator

A workflow for building production-ready `ai-jue` adapters. This skill ensures **high-precision integration** based on verified official documentation.

## 1. Problem Definition & Mode Selection

**Action**:
1.  Identify target `{tool}`.
2.  Check if `packages/ai-jue-adapter-{tool}` exists.
    -   **Missing?** -> **Create Mode**.
    -   **Exists?** -> **Optimize Mode**.

---

## 2. Phase 1: High-Precision Research (Collaborative)

**Goal**: Obtain 100% accurate documentation URLs for all capabilities.

### Step 1: Automated Discovery
1.  Use `web_search` and `web_fetch` to find the official documentation.
2.  **Mandatory Verification**: Every candidate URL MUST be checked using `curl -I` or a script to ensure 200 OK.

### Step 2: Precision Check & User Collaboration
1.  **Analyze Precision**: Does the URL point to the *exact* feature (e.g., `/docs/cli/gemini-md`) or just a general category (e.g., `/docs/`)?
2.  **Mandatory Collaboration**: If you cannot find a precise, verified URL for any of the 8 core capabilities:
    *   **STOP**.
    *   List the capabilities with missing/vague links.
    *   **Ask the user to provide the exact URLs**.
    *   Do NOT proceed to implementation with vague or hallucinated links.

---

## 3. Phase 2: Documentation-Driven Design

**Action**:
1.  Read `references/README-template.md`.
2.  Fill in the **Capability Mapping Matrix** using ONLY verified, precise URLs.
3.  **Strict Constraint**: If a capability is unsupported by the tool, mark it "Unsupported" and do NOT provide a link.
4.  Write the READMEs.

---

## 4. Phase 3: Implementation Based on Verified Docs

**Action**:
1.  Examine the *content* of the verified URLs (use `web_fetch`).
2.  Implement the conversion logic in `src/index.ts` based **strictly** on the documentation found at those URLs.
3.  Ensure terminology in code matches the tool's official documentation.

---

## 5. Quality Gates (The "Anti-Hallucination" Gates)

**Gate 1: The Precision Audit**
*   **Check**: Are all links in `README.md` precise (pointing to the specific feature page)?
*   **Check**: Are all links verified 200 OK?
*   **Correction**: If links point to index pages or general categories, retry discovery or ask the user.

**Gate 2: Documentation-Code Alignment**
*   **Check**: Does the mapping logic in `index.ts` match the technical details described in the verified URLs?

**Gate 3: Smoke Test**
*   Run `npx jue apply --adapter {tool}`.

---
## References
*   `references/README-template.md`: Single source of truth for adapter docs.
*   `references/IMPLEMENTATION-patterns.md`: Code patterns.
