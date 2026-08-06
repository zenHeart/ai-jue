# 什么是 Jue？

Jue 是 AI 能力标准化与 Agent 接入适配层。

它把散落在不同工具中的 `skills`、`agents`、`commands`、`rules`、`hooks`
和 MCP 配置，组织成一套稳定的通用能力模型；再通过 Adapter 转换为 Claude、
Cursor、Codex 等目标 Agent 的原生格式。

## Capability → Preset → Adapter 三层模型

- **Capability（能力）**：Agent 可使用的最小资产。
- **Preset（能力集）**：一组可版本化、组合和分发的能力。它在目标 Agent
  中可能表现为插件、扩展或原生配置。
- **Adapter（适配器）**：把统一能力转换为目标 Agent 原生格式的边界层。

```text
Preset / .ai / ai.config.js
             ↓
     Jue 通用能力模型
             ↓
          Adapter
             ↓
     各 Agent 原生产物
```

团队或个人只维护一份目标无关的能力集，
不同 Agent 的差异由 Adapter 吸收；确实无法通用的配置则保留在
`tools.<tool>` 逃生舱中。

完整 MVP 定义与验收边界见
[Jue MVP：AI 能力标准与 Agent 适配](../specs/jue-mvp.md)；
更多术语的一句话定义与相关文档入口见[术语表](../reference/glossary.md)。
