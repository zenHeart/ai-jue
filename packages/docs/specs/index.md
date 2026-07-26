# Jue 规范

这里集中列出 Jue 的公开协议与实现契约。规范回答“什么输入和输出是合法的”，
属于查询型参考；如果你想了解设计动机与运行流程，请先阅读
[架构与运行流程](../architecture/)。

## 推荐阅读顺序

1. [Jue MVP](jue-mvp.md)：定义 `Capability → Preset → Adapter` 产品模型、
   能力边界和 Preset 目录契约。
2. [Canonical Model](canonical-model.md)：定义解析、合并、校验和 Adapter
   共同使用的标准结构。
3. [外部 Capability 引用](capability-source.md)：定义 Preset 如何通过
   `ai.capabilities` 引用规范目录。
4. [Codex / Claude Code Adapter](codex-claude-code-adapters.md)：定义当前
   优先运行时的原生产物和验证边界。

Extension 实现者遵循
[Adapter 标准](../architecture/adapter-standardization.md)、
[Extension API](../reference/extension-api.md)。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| Draft | 目标契约仍可能调整；实现差异必须明确记录 |
| Accepted | 已接受为当前阶段的产品或协议边界 |
| Implemented | 已有实现和验证证据，后续变更必须考虑兼容性 |

每份规范顶部的状态是该文档的准确信息来源。规范与实现不一致时，不得静默
假定任一方正确：应以可运行实现确认当前事实，并把差异作为协议缺陷记录和修复。

## 维护者设计文档

`preset-base.md` 和 `preset-internal.md` 记录具体仓库维护设计，不属于面向
所有用户的稳定公共协议，因此不进入主规范导航。
