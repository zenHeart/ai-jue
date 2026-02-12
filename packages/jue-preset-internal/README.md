# jue-preset-internal

`jue-preset-internal` 是 `ai-jue` 仓库自举与治理预设，用于支撑本仓持续迭代，不面向通用业务项目复用。

## 1. 定位与边界

- `jue-preset-base`：通用工程能力，面向大多数用户项目。
- `jue-preset-internal`：仓库治理能力，面向 `ai-jue` 自身开发流程。
- `jue-preset-internal` 通过 preset 嵌套默认依赖 `jue-preset-base`，避免在仓库根配置重复声明。

internal 的职责：
- 约束仓库级开发流程（先文档、后实现、可验证交付）。
- 支撑适配器/preset 扩展开发与回归治理。
- 保障“吃自己狗粮”闭环可持续运行。

internal 的非目标：
- 不替代 base 的通用命令能力。
- 不引入新的用户概念或额外配置负担。

## 2. 最小资产协议

```text
packages/jue-preset-internal/
├── AGENTS.md
└── commands/
    └── repo-governance/
        └── prompt.md
```

说明：
- 命令元数据统一写在 `prompt.md` YAML frontmatter。
- 无需 `index.json`。
- 按需再扩展 `rules/hooks/tools`，避免过度设计。

## 3. 核心痛点与能力覆盖

1. 适配器扩展时缺统一约束  
   internal 提供仓库级治理命令与全局 AGENTS 约束，避免实现偏航。
2. preset 扩展缺验收口径  
   internal 强调“文档-设计-实现-测试”一致性，先定义再落地。
3. 回归门禁执行不稳定  
   internal 要求改动具备可验证路径，并纳入适配器矩阵与 smoke。

## 4. 能力映射（B3）

| 能力 | 资产路径 | 预期产物 | 验证点 |
| --- | --- | --- | --- |
| 全局上下文约束 | `AGENTS.md` | 适配器目标文件中的全局规则注入 | `packages/ai-jue/test/preset-internal.integration.test.ts` |
| 仓库治理命令 | `commands/repo-governance/prompt.md` | 各工具命令/指令区域可消费的 command 内容 | `packages/ai-jue/test/preset-internal.integration.test.ts` |
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

## 6. 演进原则

- 最小能力集优先：只保留当前闭环必需资产。
- 通用能力下沉 base：internal 不承载通用场景命令。
- 所有新增能力都必须给出“目标痛点 + 验证点”。
