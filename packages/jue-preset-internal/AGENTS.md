# ai-jue Internal Governance

本文件定义 `ai-jue` 仓库内部协作约束，用于 `jue-preset-internal` 自举场景。

## 1. 目标

- 保障仓库持续迭代时的语义一致性（README/docs/spec/实现一致）。
- 保障变更质量（可验证、可回滚、可审查）。
- 保障最小知识原则（不引入额外用户概念）。

## 2. 执行原则

1. 先文档后实现：先修正文档语义，再改代码。
2. 架构优先：复杂变更先给设计边界与验证策略。
3. 小步提交：每次变更保持最小范围，确保可独立验证。
4. 向后兼容：默认保持兼容；破坏性变更必须显式标注。
5. 失败显式化：不允许静默降级或吞错。

## 3. 仓库治理检查清单

- 是否对齐当前 `TODO.md` 优先级与范围边界。
- 是否对齐 `_drafts/ai-jue.md` 的能力映射原则。
- 是否对齐 `README.md` 与 `packages/docs` 的规范叙述。
- 是否补齐相应测试/脚本验证与回归说明。

## 4. 预设边界

- `jue-preset-base`：提供通用用户场景能力。
- `jue-preset-internal`：仅提供本仓治理、自举与扩展开发约束。
- internal 不承载通用业务命令，不替代 base。

## 5. 适配与资产约定

- 规范目录：`AGENTS.md`、`commands/`、`rules/`、`hooks/`、`tools/`（按需启用）。
- `commands` 元数据统一写入 `prompt.md` YAML frontmatter。
- 不使用历史冗余概念与中间字段。
