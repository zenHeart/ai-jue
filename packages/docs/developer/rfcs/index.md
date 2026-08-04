# RFCs

RFC 记录会改变公共合同、Canonical、Adapter 或 Extension 机制的方案。实现细节和
普通待办不需要 RFC。

## 状态

| 状态 | 含义 |
| --- | --- |
| `Proposed` | 可讨论，不得作为已接受合同实现 |
| `Accepted` | 架构决策已接受，可以进入 Roadmap |
| `Implementing` | 正在实现，必须链接状态和测试 |
| `Implemented` | 实现、验证和文档均完成 |
| `Rejected` | 不采用，保留理由 |
| `Superseded` | 被新 RFC 替代 |

## 清单

| RFC | 状态 | 决策 |
| --- | --- | --- |
| [RFC-0001：最小转换模型](0001-minimal-conversion-model.md) | Accepted | 单一管线、两类适配职责、Extension 注册 Adapter |
| [RFC-0002：Plugin / Bundle Artifact 的 apply 合同](0002-plugin-artifact-apply.md) | Implementing | CLI/`targets` 与四 Agent plugin 路径已接线；OpenClaw `compatible-bundle` 委托 Claude/Codex；Hermes thin `skill-plugin` 已落地；Epic 跟踪收尾中 |

## 新 RFC 必需章节

背景、目标/非目标、候选方案、决策、详细合同、安全、兼容/迁移、验收标准和未决
问题。Accepted RFC 必须进入 Roadmap；Implemented 前必须有可重复验证证据。
