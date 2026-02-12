# Specification: jue-preset-base (Agentic SDLC Core)

> **Status**: DRAFT
> **Version**: 1.0.0

## 1. 核心定位 (Core Positioning)

`jue-preset-base` 是 `ai-jue` 生态的核心预设，旨在通过 **Agentic SDLC (Agentic Software Development Life Cycle)** 方法论，将 AI 从“代码片段生成器”升级为“全生命周期合作伙伴”。

它不依赖特定技术栈（如 React/Vue），而是关注软件工程的通用元规则（Meta-Rules）。

## 2. 目录结构规范 (Directory Structure Standard)

遵循 "Follow Mainstream Standards" 原则，目录结构直接映射主流 AI 工具的概念：

```
packages/jue-preset-base/
├── prompts/
│   ├── AGENTS.md            # [System Prompt] 全局元规则 (Meta-Rules)
│   │                        # 对应: .cursorrules, CLAUDE.md, instructions.md
│   │
│   └── AGENTS.en.md         # [System Prompt] 英文版
│
├── commands/                # [Slash Commands] 快捷指令集合
│   ├── explain/             # /explain - 解释代码 (Phase 2)
│   │   ├── prompt.md
│   │   └── meta.json
│   ├── refactor/            # /refactor - 重构代码 (Phase 3)
│   ├── test/                # /test - 生成测试 (Phase 4)
│   └── ...
│
├── README.md                # 用户使用文档
└── package.json
```

## 3. 核心能力设计 (Core Capabilities)

### 3.1 AGENTS.md (System Context)

**职责**：植入 Agentic SDLC 的全局行为准则（硬约束）。
**内容**：

- **Phase 1-2 (Intent)**: 意图确认协议（必须复述需求）。
- **Phase 3 (Implementation)**: 架构优先，SOLID/DRY/KISS 原则。
- **Phase 4 (Verification)**: 代码/测试/文档同步交付。
- **Phase 5 (Review)**: 结构化输出 (Reasoning -> Plan -> Code)。

### 3.2 Commands (Slash Commands)

**职责**：封装特定 SDLC 阶段的“技能”，通过 `/command` 显式触发。

| Command | Phase | Description | Inputs | Output |
| :--- | :--- | :--- | :--- | :--- |
| `/explain` | 2 | 业务优先解释 + 可视化 | Selected Code | Markdown + Mermaid |
| `/plan` | 3 | 架构设计方案 | Requirement | Architecture Doc |
| `/refactor`| 3 | 代码重构 (行为不变) | Selected Code | Diff / Refactored Code |
| `/test` | 4 | 测试生成 (测试金字塔) | Code | Test Files |
| `/doc` | 4 | 文档生成 (场景驱动) | Code | TSDoc / Markdown |
| `/review` | 5 | 代码审查 (模拟 Expert) | Diff / Code | Review Report (Table) |
| `/security`| 5 | 安全审计 (OWASP) | Code | Vulnerability Matrix |

## 4. 用户使用手册 (User Manual)

### 4.1 安装与初始化

```bash
npx jue init
# Select "base" preset
```

### 4.2 预期行为 (Expected Behavior)

应用此预设后，用户的编辑器将获得以下增强：

1. **Cursor**:
    - `AGENTS.md` 被直接使用 (或链接到 Project Rules)。
    - `.cursorrules` (Legacy) 仅作为兼容性后备，不再主动生成。
    - 可以在 Chat 中使用 `/explain`, `/refactor` 等命令。

2. **Claude Code**:
    - `CLAUDE.md` 被创建，包含 `AGENTS.md` 内容。
    - 注册 Slash Commands (如 `/explain`) 映射到对应的 Prompt。

3. **GitHub Copilot**:
    - `.github/copilot-instructions.md` 被创建。
    - 常用 Prompt 可以在 Chat 中直接调用或通过 `/` (若支持) 触发。

## 5. 迁移计划 (Migration)

从原有的 `skills/*` 扁平结构迁移至标准化的 `commands/*` 结构。

- `prompts/default/prompt.md` -> `prompts/AGENTS.md`
- `skills/explain-code` -> `commands/explain`
- `skills/code-review` -> `commands/review`
- ... (其他 Skill 对应迁移)

---
**Design Approval**:

- [x] Doc-First? Yes.
- [x] Standard Alignment? Yes (AGENTS.md, commands/).
- [x] Agentic SDLC? Yes.
