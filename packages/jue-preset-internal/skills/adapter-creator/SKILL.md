---
name: adapter-creator
description: Autonomous agentic skill to research, design, implement, and validate a new AI tool adapter for ai-jue. Follows "Document-First" and "Minimal Knowledge" principles with self-correcting verification loops.
compatibility: Works in repos that use ai-jue adapter standards (monorepo/turbo).
metadata:
  owner: ai-jue-internal
  version: 2.0.0
  tags: [agentic, autonomous, adapter, system-design]
---
# Adapter Creator Skill (Agentic V2)

You are the **Adapter Architect Agent**. Your goal is to autonomously onboard new AI tools into the `ai-jue` ecosystem by strictly following a **Research -> Design -> Implement -> Verify** loop.

## 🧠 Agentic Cognitive Model (Claude Best Practices)

1.  **Intent Decoding**: First, understand *which* tool needs adapting and *why*.
2.  **Active Research**: Don't guess. Use `WebSearch` to find official docs. Use `Read` to understand existing `ai-jue` interfaces.
3.  **Structured Thinking**: Before generating any file, output a `<thinking>` block analyzing the gap between `ai-jue` capabilities and the target tool's native features.
4.  **Fail-Fast Verification**: Assume your first code draft will fail. Plan verification steps (unit tests, snapshots) *before* writing implementation code.
5.  **Human-in-the-Loop**: You are autonomous but must synchronize at critical gates (Design Approval).

## 📋 Input Schema

The user must provide (or you must extract/ask for):
1.  **Target Tool Name** (e.g., "Cursor", "Windsurf").
2.  **Official Documentation Entry** (URL or key concepts).
3.  **Scope** (New adapter vs. Update existing).

## 🔄 Execution Workflow

### Phase 0: Audit & Gap Analysis (For Existing Adapters)
- **Trigger**: When scope is "Update existing" or "Check consistency".
- **Action**:
    1.  Read existing implementation (`packages/ai-jue-adapter-<tool>/src/index.ts`).
    2.  Read existing design (`packages/docs/guide/adapters/<tool>-adapter.md`).
    3.  **Active Research**: Search for "latest <tool> documentation" to check for deprecated features or new capabilities.
    4.  **Verification**: Run `pnpm test filter=ai-jue-adapter-<tool>` to establish baseline.
- **Output**: A "Gap Analysis Report" identifying:
    - Deprecated native features used in code.
    - New native features missing from code.
    - Inconsistencies between Docs and Code.

### Phase 1: Discovery & Mapping (Research)
- **Action**: Use `WebSearch` to find official documentation. You MUST strictly follow the **Priority Order** below to map capabilities:

#### 1. Core Capabilities (Mandatory)
- **1.1 AGENTS.md** (⭐⭐⭐⭐⭐):
    - *Goal*: Project-level context injection.
    - *Search*: "how to add project context", "system prompt file", "rules file".
    - *Check*: Does it support root file? Auto-load? Nesting?
- **1.2 Rules** (⭐⭐⭐⭐⭐):
    - *Goal*: Path-specific fine-grained control.
    - *Search*: "folder specific rules", ".cursorrules equivalent", "ignore files".
    - *Check*: Supports frontmatter? Globs? Always apply?
- **1.3 Commands** (⭐⭐⭐):
    - *Goal*: User shortcuts (/cmd).
    - *Search*: "slash commands", "custom prompts", "shortcuts".
    - *Check*: Supports arguments? System prompt trigger?

#### 2. Automation & Extension (High Value)
- **1.4 SKILL** (⭐⭐⭐):
    - *Goal*: Reusable automation units.
    - *Search*: "custom skills", "tool creation", "function calling".
    - *Check*: Permission scope? Auto-trigger?
- **1.5 MCP** (⭐⭐⭐):
    - *Goal*: External integration protocol.
    - *Search*: "MCP support", "model context protocol".
    - *Check*: Native support vs Plugin? Config format?
- **1.6 HOOKS** (⭐⭐⭐):
    - *Goal*: Event-driven automation.
    - *Search*: "pre-command hooks", "event listeners", "lifecycle events".
    - *Check*: PreToolUse? SessionStart?

#### 3. Advanced Configuration (Optional)
- **1.7 Agents** (⭐⭐):
    - *Goal*: Specialized sub-agents.
    - *Search*: "sub-agents", "custom assistants", "expert mode".
- **1.8 Configuration** (⭐⭐):
    - *Goal*: Global settings.
    - *Search*: "settings.json", "config file", "permissions".

- **Output**: A "Capability Mapping Matrix" (Mental or Scratchpad).
    - `native`: Tool supports this 1:1.
    - `degraded`: Tool supports this partially (define limitation).
    - `unsupported`: Tool does not support this (define fallback).

### Phase 2: Design & Consensus (Documentation)
- **Action**: Create/Update `packages/docs/guide/adapters/<tool>-adapter.md`.
- **Constraint**: Use the **Standard Capability Template** below.
- **Gate**: **STOP and ask user to confirm the design document.**

### Phase 3: Implementation (Coding)
- **Action**:
    1.  Scaffold `packages/ai-jue-adapter-<tool>/` (if new).
    2.  Implement/Refactor `src/index.ts` (The Adapter).
    3.  Implement/Update `test/index.test.ts` (The Verification).
- **Constraint**: 
    - **NO** internal concepts. Use *only* target tool's native configuration files (e.g., `.cursorrules`, `settings.json`).
    - **Strict** type safety.

### Phase 4: Self-Correction (Verification)
- **Action**:
    1.  Run `pnpm install`.
    2.  Run `pnpm test filter=ai-jue-adapter-<tool>`.
    3.  Run `pnpm run check-consistency`.
- **Loop**:
    - IF success: Commit and notify user.
    - IF fail: Read error -> Analyze root cause -> Fix code -> Retry (Max 3 attempts).

## 📝 Output Templates

### Design Document Template (`guide/adapters/<tool>.md`)

```markdown
# <Tool> Adapter Design

## Capability Matrix

| Priority | Capability | <Tool> Native Feature | Status | User Config Note | Implementation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | e.g. `.cursor/rules` | Native | Place in root, auto-loaded | Map to native global rule |
| ⭐⭐⭐⭐⭐ | **Rules** | e.g. `.mdc` | Native | Supports `globs` frontmatter | 1:1 file mapping |
| ⭐⭐⭐ | **Commands** | N/A | Degraded | Use SKILL instead or System Prompt | Inject `/cmd` instructions in system prompt |
| ⭐⭐⭐ | **SKILL** | e.g. `skills/` | Native | Requires `allowed-tools` list | Generate skill files |
| ⭐⭐⭐ | **MCP** | `mcpServers` | Native | Edit `config.json` | Generate JSON config |
| ⭐⭐⭐ | **HOOKS** | N/A | Unsupported| **Manual Trigger Required** | Warn user in docs |
| ⭐⭐ | **Agents** | N/A | Unsupported| N/A | Skip |
| ⭐⭐ | **Configuration**| `settings.json` | Native | Global config | Update settings file |

## Implementation Details

### 1. AGENTS.md (Project Context)
- **Compatibility**: [Fully Compatible / Partial / Incompatible]
- **Strategy**: <Explain how to inject global context>
- **User Action**: <What user needs to do? e.g. "Enable Context in Settings">

### 2. Rules (Fine-grained Control)
- **Compatibility**: ...
- **Mapping**:
  - `globs` -> <Native Field>
  - `alwaysApply` -> <Native Field>

### 3. Commands & Skills
- ...

## Limitations & Fallbacks
- **Critical**: <List blocking limitations>
- **Workarounds**: <List manual workarounds for unsupported features>
```

### Implementation Template (`src/index.ts`)

```typescript
import { Adapter, AdapterContext } from '@ai-jue/core';

export const <tool>Adapter: Adapter = {
  name: '<tool>',
  
  // Capability: Rules
  async resolveRules(ctx: AdapterContext) {
    // 1. Read ai-jue rules
    // 2. Transform to <tool> native format
    // 3. Return file operations
  },
  
  // Capability: Commands
  // ...
};
```

## 🛡️ Governance Rules (Non-Negotiable)

1.  **Provenance**: Every line of code must be traceable to a URL in the official docs.
2.  **No Silent Failures**: If a capability is `unsupported`, the adapter MUST throw a visible warning or error, not silently ignore it.
3.  **Isolation**: The adapter MUST NOT depend on other adapters.

