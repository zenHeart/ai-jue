---
name: adapter-creator
description: Creates ai-jue adapters for new AI tools. Use when user asks to "create adapter", "add support for [tool]", "build adapter for [cursor/gemini/etc]", "new adapter", or needs adapter development guidance.
compatibility: Works in ai-jue monorepo with TypeScript/pnpm.
metadata:
  version: 2.1.0
  tags: [adapter, scaffolding, design-first]
---

# Adapter Creator

Create production-ready ai-jue adapters following the "Document-First" workflow.

## Quick Start

```
User: "Create adapter for Windsurf"
You:  Follow 4-phase workflow with 3 human gates
```

## Workflow Overview

```
Phase 1: Research ──→ Gate 1 ──→ Phase 2: Design ──→ Gate 2 ──→ Phase 3: Implement ──→ Phase 4: Verify ──→ Gate 3
```

---

## Phase 1: Research & Capability Mapping

**Goal**: Map ai-jue's 8 capabilities to target tool's native features.

**Action**:
1. WebSearch target tool's official docs
2. Check each capability (in priority order):
   - ⭐⭐⭐⭐⭐ AGENTS.md, Rules, Commands
   - ⭐⭐⭐ Skills, MCP, Hooks
   - ⭐⭐ Agents, Configuration
3. Create Capability Matrix with status: `native` / `degraded` / `unsupported`

**Output**: Capability Matrix ( mental or scratchpad )

---

## 🔴 Gate 1: Capability Matrix Review

**Trigger**: After Phase 1 completes.
**Action**: STOP and present matrix to user.

**Present to user**:
```markdown
## {Tool} Capability Matrix

| Capability | Status | Notes |
|:---|:---|:---|
| AGENTS.md | {native/degraded/unsupported} | {brief note} |
| Rules | {native/degraded/unsupported} | {brief note} |
| ... | ... | ... |

**Key decisions needed**:
1. {Any unclear mapping?}
2. {Any surprising limitation?}
```

**Wait for**: User confirmation or corrections before proceeding.

---

## Phase 2: Design Documentation

**Goal**: Generate bilingual adapter README using template.

**Action**:
1. Read `references/README-template.md` and `README-template.en.md`
2. Fill in all `{placeholder}` sections based on research
3. Generate:
   - `packages/ai-jue-adapter-{tool}/README.md` (Chinese)
   - `packages/ai-jue-adapter-{tool}/README.en.md` (English)

**Key sections to complete**:
- Capability Mapping Matrix (8 capabilities)
- Implementation Details (per capability)
- Limitations & Fallback Strategies

---

## 🔴 Gate 2: Design Document Review

**Trigger**: After README files are generated.
**Action**: STOP and present README to user.

**Present to user**:
```markdown
I've generated the adapter design docs:

📄 packages/ai-jue-adapter-{tool}/README.md
📄 packages/ai-jue-adapter-{tool}/README.en.md

**Please review**:
1. Is the capability mapping accurate?
2. Are the limitations clearly explained?
3. Are the implementation strategies correct?

Confirm to proceed with implementation, or suggest changes.
```

**Wait for**: User explicit "LGTM" or specific corrections.

---

## Phase 3: Implementation

**Goal**: Generate adapter code based on design doc.

**Action**:
1. Scaffold directory structure:
   ```
   packages/ai-jue-adapter-{tool}/
   ├── src/
   │   └── index.ts
   ├── test/
   │   └── index.test.ts
   ├── README.md (already created)
   ├── README.en.md (already created)
   ├── package.json
   └── tsconfig.json
   ```

2. Implement `src/index.ts`:
   - Import utilities from `ai-jue-core`
   - Implement `generate(config, outputDir)` function
   - Follow patterns from `references/IMPLEMENTATION-patterns.md`

3. Implement `test/index.test.ts`:
   - Basic functionality tests
   - Capability mapping tests

**Reference**: Consult `references/IMPLEMENTATION-patterns.md` for:
- Native file reference patterns
- Markdown block management
- Structured config generation
- Multi-file output patterns
- Rules with frontmatter
- Capability degradation

---

## Phase 4: Verification & Self-Correction

**Goal**: Ensure adapter passes all tests.

**Action**:
1. Run `pnpm install` in adapter directory
2. Run `pnpm test`
3. If tests fail:
   - Read error messages
   - Fix in `src/index.ts`
   - Re-run tests (max 3 retries)
4. Run cross-adapter contract test:
   ```bash
   npm test -- packages/ai-jue/test/adapter-matrix.test.ts
   ```

---

## 🟢 Gate 3: Completion Confirmation

**Trigger**: After all tests pass.
**Action**: Present final summary to user.

**Present to user**:
```markdown
✅ Adapter creation complete!

📦 packages/ai-jue-adapter-{tool}/
├── ✅ README.md (Chinese design doc)
├── ✅ README.en.md (English design doc)
├── ✅ src/index.ts (Implementation)
├── ✅ test/index.test.ts (Tests)
└── ✅ All tests passing

**Next steps**:
1. Review the implementation
2. Run smoke test: `npm run smoke-apply`
3. Commit the changes

Proceed with commit? [Y/n]
```

---

## Testing Guide

### For This Skill

Validate the skill is working:

| Test Case | Expected Result |
|:---|:---|
| "Create adapter for X" | Loads skill, starts Phase 1 |
| After Phase 1 | Pauses at Gate 1 for confirmation |
| After Phase 2 | Pauses at Gate 2 for README review |
| After Phase 4 | Pauses at Gate 3 for final confirmation |

### For Generated Adapters

Each adapter must pass:

1. **Unit Tests**: `pnpm test` in adapter directory
2. **Contract Test**: Cross-adapter capability consistency
3. **Smoke Test**: `npm run smoke-apply`

---

## References

| File | Purpose |
|:---|:---|
| `references/README-template.md` | Chinese adapter README template |
| `references/README-template.en.md` | English adapter README template |
| `references/IMPLEMENTATION-patterns.md` | Implementation patterns and best practices |

---

## Governance Rules

1. **Document First**: README must be approved before implementation
2. **No Silent Failures**: Unsupported capabilities must be explicitly documented
3. **Bilingual Required**: All adapters must have Chinese and English README
4. **Test Coverage**: All adapters must include unit tests
