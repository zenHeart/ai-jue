# 什么是 Jue？

Jue 是 AI 能力标准化与 Agent 接入适配层。

它把散落在不同工具中的 `skills`、`agents`、`commands`、`rules`、`hooks`
和 MCP 配置，组织成一套稳定的通用能力模型；再通过 Adapter 转换为 Claude、
Cursor、Gemini、Copilot 等目标 Agent 的原生格式。

Jue 的核心不是 CLI。CLI、网站和编辑器扩展只是使用这套标准的不同入口。

## 三个稳定概念

- **Capability（能力）**：Agent 可使用的最小资产。
- **Preset（能力集）**：一组可版本化、组合和分发的能力。它在目标 Agent
  中可能表现为插件、扩展或原生配置。
- **Adapter（适配器）**：把统一能力转换为目标 Agent 原生格式的边界层。

```text
Preset / .ai / ai.config.js
             ↓
     Jue Canonical Model
             ↓
          Adapter
             ↓
     各 Agent 原生产物
```

这层抽象让能力的定义不再绑定某一个 Agent。团队或个人只维护一份能力集，
不同 Agent 的差异由 Adapter 吸收；确实无法通用的配置则保留在
`tools.<tool>` 逃生舱中。

完整 MVP 定义与验收边界见
[Jue MVP：AI 能力标准与 Agent 适配](../specs/jue-mvp.md)。
