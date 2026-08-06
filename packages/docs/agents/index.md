# Agent 支持画像

本目录分别记录目标 Agent 的官方能力表面、Jue 理想映射与当前实现状态。它不重新
定义 [Canonical](../specs/canonical-model.md) 或
[Extension](../architecture/index.md) 协议。

## 统一成熟度

| 层级 | 含义 |
| --- | --- |
| Read | Agent 原生配置 → Canonical DSL |
| Write | Canonical DSL → Agent 原生表示 |
| Artifact | 生成并维护目标 Config / Plugin / Bundle |
| Confirm | 通过目标官方 CLI、解析器或真实读取路径验证 |

状态统一使用：

- **Implemented**：已有代码与验证证据。
- **Partial**：仅覆盖明确列出的子集。
- **Planned**：目标合同已定义，尚未实现。
- **Unsupported**：目标官方不支持或明确不纳入。
- **Unverified**：官方事实或运行态证据不足。

## 当前目标

| Agent | Read | Write | Artifact | Confirm |
| --- | --- | --- | --- | --- |
| [Claude Code](claude-code.md) | Implemented | Implemented | Implemented | Implemented |
| [Codex](codex.md) | Implemented | Implemented | Implemented | Implemented |
| [Cursor](cursor.md) | Implemented | Implemented | Implemented | Implemented |
| [OpenClaw](openclaw.md) | Implemented | Implemented | Implemented | Implemented |
| [Hermes](hermes.md) | Implemented | Implemented | Implemented | Implemented |

OpenClaw / Hermes 的 Artifact 覆盖 workspace 与可安装聚合形态
（`compatible-bundle` / thin `skill-plugin`）。各 Agent 的官方能力表面
与 Canonical 映射边界见对应画像表。
