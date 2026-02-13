# jue-preset-internal

`jue-preset-internal` 是 `ai-jue` 仓库自举与治理预设，用于支撑本仓持续迭代，不面向通用业务项目复用。

## 1. 定位与边界

- `jue-preset-base`：通用工程能力，面向大多数用户项目。
- `jue-preset-internal`：仓库治理能力，面向 `ai-jue` 自身开发流程。
- `jue-preset-internal` 通过 preset 嵌套默认依赖 `jue-preset-base`，避免在仓库根配置重复声明。

internal 的职责：
- 约束仓库级开发流程（先文档、后实现、可验证交付）。
- 支撑适配器/preset 扩展开发与回归治理。
- 保障"吃自己狗粮"闭环可持续运行。

internal 的非目标：
- 不替代 base 的通用命令能力。
- 不引入新的用户概念或额外配置负担。

## 2. 最小资产协议

```text
packages/jue-preset-internal/
├── AGENTS.md
├── skills/
│   └── adapter-creator/
│       ├── SKILL.md
│       └── references/
│           ├── README-template.md
│           ├── README-template.en.md
│           └── IMPLEMENTATION-patterns.md
└── commands/
    └── repo-governance/
        └── prompt.md
```

说明：
- 命令元数据统一写在 `prompt.md` YAML frontmatter。
- 无需 `index.json`。
- Skill 使用 Progressive Disclosure：Frontmatter → SKILL.md → references/
- 按需再扩展 `rules/hooks/tools`，避免过度设计。

## 3. 核心痛点与能力覆盖

1. 适配器扩展时缺统一约束  
   internal 提供仓库级治理命令与全局 AGENTS 约束，避免实现偏航。
2. preset 扩展缺验收口径  
   internal 强调"文档-设计-实现-测试"一致性，先定义再落地。
3. 回归门禁执行不稳定  
   internal 要求改动具备可验证路径，并纳入适配器矩阵与 smoke。

## 4. 能力映射（B3）

| 能力 | 资产路径 | 预期产物 | 验证点 |
| --- | --- | --- | --- |
| 全局上下文约束 | `AGENTS.md` | 适配器目标文件中的全局规则注入 | `packages/ai-jue/test/preset-internal.integration.test.ts` |
| 仓库治理命令 | `commands/repo-governance/prompt.md` | 各工具命令/指令区域可消费的 command 内容 | `packages/ai-jue/test/preset-internal.integration.test.ts` |
| 适配器创建技能 | `skills/adapter-creator/SKILL.md` + `references/*.md` | 标准化 adapter 设计文档 + 实现代码 | `packages/ai-jue/test/preset-internal.integration.test.ts` |
| 自举可运行 | 根配置引用 `preset: "internal"` | `npx jue apply` 生成四类工具产物 | `scripts/smoke-apply.js` 与集成测试 |

## 5. 吃自己狗粮运行手册

1. 在仓库根目录配置：
   - `ai.config.js` 使用 `preset: "internal"`（自动包含 `base`，无需重复写 `base`）。
2. 执行：
   - `npx jue apply`
3. 验证：
   - `npm test -- packages/ai-jue/test/preset-internal.integration.test.ts`
   - `npm run smoke-apply`
4. 迭代：
   - 先更新 internal 文档与 AGENTS 规则，再落地实现与测试。

## 6. Adapter Creator Skill 使用指南

`skills/adapter-creator/SKILL.md` 提供标准化的 AI 工具适配器创建与优化工作流，遵循 Claude Skill 最佳实践。

### 6.1 核心特性

| 特性 | 说明 |
|:---|:---|
| **双模式工作流** | 智能识别目标适配器是否存在，自动进入“创建模式”或“优化模式”。|
| **渐进式披露** | Frontmatter → 核心指令 → references/ 模板，最小化上下文负载。 |
| **文档先行** | 强制先写/更新 README 设计文档，再进行代码实现。 |
| **人机协作** | 3个检查点（Gates）确保关键决策（能力矩阵、设计、最终交付）均有人工确认。 |

### 6.1.1 Agentic Workflow 增强

除了高层工作流，该 Skill 的指令已为 AI Agent 执行进行深度优化：

| 增强 | 说明 |
|:---|:---|
| **智能模式选择** | 工作流开始时自动检测适配器是否存在，以决定是创建还是优化。 |
| **显式工具调用** | 在每个阶段明确指定应使用的工具，如 `web_search`, `read_file`, `run_shell_command`。 |
| **自我修正循环**| 在验证阶段，指令包含了一个“测试-分析-修复-重试”的闭环，使 AI 具备自主修复能力。|
| **工作区集成**| 在创建模式下，自动将新适配器添加到根 `pnpm-workspace.yaml`。 |
| **错误回退**| 每个人机检查点都包含了否决后的回退路径，增强了工作流的鲁棒性。|

### 6.2 工作流

```
                     ┌──────────────────┐
(不存在) ──→ │      Create Mode     │ ──┐
                     └──────────────────┘   │
                       │                      │
┌──────────────┐       │ (Phase 1, 2, 3)      │
│ Mode Selection │ ─────┤                      ├─→ Gate 1 → Gate 2 → Phase 4 → Gate 3
└──────────────┘       │                      │
                       │                      │
                     ┌──────────────────┐   │
  (已存在) ──→ │     Optimize Mode    │ ──┘
                     └──────────────────┘
                       (Phase 1, 2, 3)
```

### 6.3 使用方式

在 AI 对话中直接请求：

**创建新适配器:**
```
"为 Windsurf 创建适配器"
"添加对 Cline 的支持"
```

**优化现有适配器:**
```
"优化 cursor 适配器"
"更新 gemini 适配器以支持新功能"
```

### 6.4 输出产物

使用该 Skill 将创建或更新一个完整的适配器包：

```
packages/ai-jue-adapter-{tool}/
├── README.md              # 中文设计文档
├── README.en.md           # 英文设计文档
├── src/
│   └── index.ts           # 适配器实现
├── test/
│   └── index.test.ts      # 单元测试
├── package.json
└── tsconfig.json
```

### 6.5 模板参考

| 模板文件 | 用途 |
|:---|:---|
| `references/README-template.md` | 中文适配器 README 模板 |
| `references/README-template.en.md` | 英文适配器 README 模板 |
| `references/IMPLEMENTATION-patterns.md` | 实现模式与最佳实践 |

### 6.6 设计原则

1. **最小知识原则**：适配器只使用目标工具的原生概念。
2. **显式降级**：不支持的能力必须显式说明，不允许静默忽略。
3. **向后兼容**：生成的配置必须与用户现有配置深度合并。
4. **测试覆盖**：所有适配器必须通过单元测试和契约测试。

## 7. 嵌套协议（Preset Extends）

`internal` 使用 preset 元数据声明依赖：

```json
{
  "ai": {
    "presets": ["base"]
  }
}
```

加载顺序：

1. 先加载 `base`
2. 再加载 `internal`
3. 若同名资产冲突，以 `internal` 为准

## 8. 演进原则

- 最小能力集优先：只保留当前闭环必需资产。
- 通用能力下沉 base：internal 不承载通用场景命令。
- 所有新增能力都必须给出"目标痛点 + 验证点"。
