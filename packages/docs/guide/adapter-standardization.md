# 适配器标准化（最小知识原则）

本文档定义 `ai-jue` 的用户消费模型与适配器转换边界。

## 1. 用户消费路径（以终为始）

用户只需要理解一套规范：

1. 在 `ai.config.js` 里声明能力
2. 在 `.ai/` 或 preset 里组织资产
3. 执行 `jue apply` 生成各工具配置

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

## 3. 目录协议（Preset 与 `.ai` 同构）

```text
.ai/
├── AGENTS.md
├── skills/
├── commands/
├── rules/
├── agents/
├── hooks/
└── tools/
    ├── gemini/
    └── cursor/
```

## 4. 适配器职责边界

- 适配器只做“规范模型 -> 目标工具格式”转换
- 适配器只消费规范字段
- 非规范输入由 `validate/normalize` 在核心层 fail-fast

## 5. 工具能力映射矩阵（当前实现）

| 能力 | Claude | Cursor | Gemini | Copilot |
| --- | --- | --- | --- | --- |
| AGENTS/context | `CLAUDE.md` | `.cursor/rules/agents.mdc` | `GEMINI.md` | `.github/copilot-instructions.md` |
| rules | 降级到 `CLAUDE.md` | `.cursor/rules/*.mdc` | 降级到 `GEMINI.md` | 降级到 `.github/copilot-instructions.md` |
| commands | `CLAUDE.md` | `.cursor/commands/*.md` | `.gemini/settings.json.customCommands` | `.github/copilot-instructions.md` |
| skills | `CLAUDE.md` | `.cursor/skills/*/SKILL.md` | 降级到 `GEMINI.md`（文本） | `.github/copilot-instructions.md` |
| hooks | `CLAUDE.md`（说明） | `.cursor/hooks.json` | `.gemini/settings.json.hooks` | `.github/copilot-instructions.md`（说明） |
| agents | `CLAUDE.md`（说明） | `.cursor/agents/*.md` | `.gemini/settings.json.agents` | `.github/copilot-instructions.md`（说明） |
| mcp | `.mcp.json` | `.cursor/mcp.json` | `.gemini/settings.json.mcpServers` | `.github/copilot-instructions.md`（降级说明） |
| `tools.<tool>` | 部分支持 | 部分支持 | `.gemini/settings.json` | 部分支持 |

说明：
- “降级到文档”代表目标工具缺少等价结构化入口，适配器显式写入说明，不做静默忽略。
- Cursor 当前是结构化落地最完整的参考实现。

## 6. Cursor 转换约束

- `AGENTS.md`（`context.global`）映射为 `.cursor/rules/agents.mdc`
- `rules/*` 使用统一源格式 `md + YAML frontmatter`，转换为 `.cursor/rules/*.mdc`
- 适配器仅负责格式落地，不在 Cursor 层重复定义规则语义

## 7. 失败与降级策略（降低认知负担）

检测到以下输入时直接失败并给修复建议：

- 其他未纳入规范模型的能力字段

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
