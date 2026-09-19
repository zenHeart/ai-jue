---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-14-apply-safety-residuals
scale: major
slice_gate: user_ok
health: ok
user_accepted: continuous completion authorization (2026-09-19T23:09:00+08:00)
skipped_gates:
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

修复 Issue #14 中仍可在当前代码复现的 apply scope 安全残差，保证危险输入和
只读命令在任何 Artifact 写入前失败，并且 diagnostics 使用与 apply 相同的上下文。

## Spec

- 深合并在任意深度拒绝原型污染键，错误不包含输入值。
- merged JSON 遇到非法或非对象内容时拒绝覆盖。
- plan/check/apply 在写入前拒绝悬空文件或目录 symlink。
- dry-run/check 不写持久 cache、lock、config 或 target。
- inspect diagnostics 使用与 apply 相同的 scope/root/kind 且保持只读。
- rollback 清除失败批次创建的路径，但保留批次前已有目录。

## Plan

1. 将 Issue 的六组残差映射到现有测试并运行聚焦复现。
2. 对每个仍失败的残差先保留最小失败测试，再做最小实现。
3. 跑 Core/CLI 聚焦测试、全套测试、构建、隐私与安全门禁。
4. 在 `cwr`、`mp` 的隔离临时目录消费 pack 产物，不保留现场材料。
5. 发布脱敏证据并关闭 #14。

## Deferred-MPF

- #14 之外的其他 Issue。
- 发布与合并：所有已确认缺陷切片完成后统一执行。

## Open questions

- 无。
