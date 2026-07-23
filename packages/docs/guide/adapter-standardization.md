# 适配器标准化（最小知识原则）

本文档定义 `ai-jue` 的用户消费模型与适配器转换边界。

> 说明：本页分“当前实现”与“目标约束”两层。若存在差异，以当前 adapter 代码行为为准，并将差异列为待收口项。

## 0. 适配器设计目标

适配器不是项目的中心，用户也不应该先学习适配器差异。

适配器存在的目的只有三个：

1. 让用户用统一资产组织能力，而不是分别维护多套工具配置
2. 让已有工具配置能低成本回收到统一资产，再重新分发
3. 在保留工具原生体验的前提下，把新增工具的接入成本降到最低

因此一个 adapter 是否设计合理，关键不在于支持了多少私有字段，而在于：

- 是否尽量消费统一结构
- 是否尽量少反向污染用户认知
- 是否能把工具差异约束在 adapter 内部

## 1. 用户消费路径（以终为始）

用户只需要理解一套规范：

1. 在 `ai.config.js` 里声明能力
2. 在 `.ai/` 或 preset 里组织资产
3. 执行 `jue apply --all`（或 `jue apply --adapter <name>`）生成各工具配置

用户无需学习非规范字段或中间桥接概念。

## 2. 规范能力模型（唯一）

| 能力 | 规范目录/字段 | 说明 |
| --- | --- | --- |
| 全局上下文 | `AGENTS.md` | 项目级系统上下文与强约束 |
| 规则 | `rules/` | 项目规则资产 |
| 命令 | `commands/` / `commands` | 自定义命令 |
| 技能 | `skills/` / `skills` | 可复用任务能力 |
| 代理 | `agents/` / `agents` | 专用代理能力单元 |
| 钩子 | `hooks/` / `hooks` | 生命周期自动化 |
| MCP | `mcp.servers` | 外部工具接入 |
| 工具扩展 | `tools/<tool>/` / `tools` | 工具私有配置透传 |

严格约束：
- 不暴露任何内部桥接字段
- 不支持任何历史错误命名

当前实现补充：

- `prompts` 仍是待迁移的兼容输入，不属于新的 canonical 能力
- `hooks` 支持 `string / canonical object / canonical object[]`
- hook 数组表示同一事件下的多个统一 hook，工具原生数组必须放入 `tools.<tool>`

这也是当前待收口的重点：

- 用户侧应尽量看到稳定概念
- 工具原生私有形状应尽量留在 adapter 或逃生舱内部

## 3. 目录协议（Preset 与 `.ai` 同构）

```text
.ai/
├── AGENTS.md
├── skills/
├── commands/
├── rules/
├── agents/
├── hooks/
├── mcp.json
└── tools/
    ├── gemini/
    └── cursor/
```

## 4. 适配器职责边界

- 适配器只做“规范模型 -> 目标工具格式”转换
- 适配器只消费规范字段
- 非规范输入由 `validate/normalize` 在核心层 fail-fast
- 跨适配器重复出现的输出逻辑必须优先下沉到 `ai-jue-core`，避免各 adapter 维护分叉 helper

扩展原则：

- 新增 adapter 时，优先复用现有统一结构和共享 helper
- 新增通用能力时，先更新统一结构，再决定各 adapter 如何原生映射或显式降级
- 不应为了接入单个工具，反向放宽整套用户输入模型

### 4.1 能力下沉流程

新增能力时，默认按下面的顺序演进，而不是一步到位进入统一结构：

1. 先作为单工具能力存在于 adapter 或 `tools.<tool>`
2. 当多个工具都出现相近需求时，在 adapter 层先对齐命名与语义
3. 只有当该能力足够稳定、足够通用、且用户容易理解时，才正式下沉到统一结构

正式下沉前，至少应满足：

- 不只是单工具私有特性
- 不会显著增加用户侧概念数量
- 能在 preset、`.ai/`、`ai.config.js` 三个入口中表达
- 能为至少两个 adapter 提供清晰映射或明确降级路径

这套流程的目的，是用最小代价把“局部工具特性”演进为“可复用通用能力”，同时避免过早膨胀核心模型

## 5. 工具能力映射矩阵（当前实现）

| 能力 | Claude | Cursor | Gemini | Copilot |
| --- | --- | --- | --- | --- |
| AGENTS.md | 根 `AGENTS.md` + `CLAUDE.md`（引用 `@AGENTS.md`） | 根目录 `AGENTS.md`（Cursor 原生消费） | `GEMINI.md`（引用 `@AGENTS.md`） | `.github/copilot-instructions.md` |
| rules | `.claude/rules/*.md` | `.cursor/rules/*.mdc` | 降级到 `GEMINI.md` | `.github/instructions/*.instructions.md` 或主说明文件 |
| commands | `.claude/skills/*/SKILL.md` | `.cursor/commands/*.md` | `.gemini/commands/**/*.toml` | `.github/prompts/*.prompt.md` 或主说明文件 |
| skills | `.claude/skills/*/SKILL.md` | `.cursor/skills/*/SKILL.md` | `.gemini/skills/*/SKILL.md` | `.github/copilot-instructions.md` |
| hooks | `.claude/settings.json` | `.cursor/hooks.json` | `.gemini/settings.json.hooks` | `.github/copilot-instructions.md`（说明） |
| agents | `.claude/agents/*.md` | `.cursor/agents/*.md` | `.gemini/settings.json.agents` | `.github/instructions/*.instructions.md` |
| mcp | `.mcp.json` + `.claude/settings.json`（scope 说明） | `.cursor/mcp.json` | `.gemini/settings.json.mcpServers` | `.github/copilot-instructions.md`（降级说明） |
| `tools.<tool>` | 部分支持 | 部分支持 | `.gemini/settings.json` | 部分支持 |

说明：
- “降级到文档”代表目标工具缺少等价结构化入口，适配器显式写入说明，不做静默忽略。
- Cursor 当前是结构化落地最完整的参考实现。

## 6. Claude / Cursor 转换约束

### 6.1 Claude

- `context.global` 必须同时保持根 `AGENTS.md` 与 `CLAUDE.md` 的 `@AGENTS.md` 引用语义
- `rules/*` 转换为 `.claude/rules/*.md`
- `commands/*` 与 `skills/*` 都映射到 `.claude/skills/*/SKILL.md`
- `hooks` 使用 `.claude/settings.json`
- `mcp.servers` 中 `project` scope 原生落到 `.mcp.json`；其他 scope 必须显式说明，不允许静默吞掉

### 6.2 Cursor

- `AGENTS.md`（`context.global`）在 Cursor 下保持根目录原生文件；`rules/*` 才转换为 `.cursor/rules/*.mdc`
- `rules/*` 使用统一源格式 `md + YAML frontmatter`，转换为 `.cursor/rules/*.mdc`
- `hooks` 保留结构化对象，输出到 `.cursor/hooks.json`
- `mcp.servers` 允许 `disabled / autoApprove` 等字段透传到 `.cursor/mcp.json`
- 适配器仅负责格式落地，不在 Cursor 层重复定义规则语义

## 7. 失败与降级策略（降低认知负担）

检测到以下输入时直接失败并给修复建议：

- 其他未纳入规范模型的能力字段

当前待收口差异：

- `prompts` 仍需迁移到 `context.global` 或 `tools.<tool>`，避免长期保留第二套提示词分类

对于目标工具不支持的能力：
- 必须输出显式降级说明或映射到可消费文件
- 不允许静默吞掉能力输入

## 8. 验证用例索引（能力 -> 测试点）

- Cursor 映射：`packages/ai-jue-adapter-cursor/test/index.test.ts`
- Claude 映射：`packages/ai-jue-adapter-claude/test/index.test.ts`
- Gemini 映射：`packages/ai-jue-adapter-gemini/test/index.test.ts`
- Copilot 映射：`packages/ai-jue-adapter-copilot/test/index.test.ts`
- 跨适配器矩阵：`packages/ai-jue/test/adapter-matrix.test.ts`
- 能力快照：`packages/ai-jue/test/adapter-capability.snapshot.test.ts`
- 自举 smoke：`scripts/smoke-apply.js`
