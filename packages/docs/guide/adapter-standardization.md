# 适配器标准化（最小知识原则）

本文档定义 `ai-jue` 的用户消费模型与适配器转换边界。

## 1. 用户消费路径（以终为始）

用户只需要理解一套规范：

1. 在 `ai.config.js` 里声明能力
2. 在 `.ai/` 或 preset 里组织资产
3. 执行 `jue apply` 生成各工具配置

用户无需学习历史字段或中间桥接概念。

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
- 适配器不承担历史字段兼容
- 非规范输入由 `validate/normalize` 在核心层 fail-fast

## 5. Cursor mdc 转换约束

- 统一源格式：`md + YAML frontmatter`
- Cursor 适配器仅在转换阶段输出 `.cursor/rules/*.mdc`
- 规则语义在统一层定义，Cursor 不重复实现能力逻辑

## 6. 失败策略（降低认知负担）

检测到以下输入时直接失败并给修复建议：

- 其他未纳入规范模型的能力字段
