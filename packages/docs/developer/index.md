# Developer

Developer 空间记录 Jue 的目标架构与当前实现之间的差距。它面向维护者和后续实现
Agent，不是普通用户的入门前置知识。

## 阅读顺序

1. [架构](../architecture/)：稳定原则和最小转换模型。
2. [文档事实源合同](documentation-contract.md)：冲突时的权威顺序。
3. [实现状态](implementation-status.md)：哪些合同已实现、部分实现或尚未实现。
4. [Roadmap](roadmap.md)：按依赖顺序交付能力。
5. [Delivery Plan](delivery-plan.md)：领取当前任务并提交验收证据。
6. [Claude Code 执行手册](claude-code-execution.md)：按依赖拆解、并行实施和验证。
7. [RFCs](rfcs/)：重要方案、取舍和决策状态。

## 文档边界

| 文档空间 | 回答的问题 |
| --- | --- |
| Guide | 用户如何完成任务？ |
| Architecture | Jue 为什么这样设计？ |
| Reference | 理想且完整的合同是什么？ |
| Developer | 当前实现离合同还有多远，下一步做什么？ |

Reference 中未实现的合同不会删除或降格；其实现状态统一链接到本空间。完成一项
功能时必须同时更新实现、测试、Agent 支持画像、实现状态和 Delivery Plan。
