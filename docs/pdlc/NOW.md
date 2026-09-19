---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-25-mcp-source-fail-explicit
scale: minor
slice_gate: user_ok
health: ok
user_accepted: continuous completion authorization (2026-09-19T23:09:00+08:00)
skipped_gates: plan_ok (minor slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

核验并修复 Issue #25：无法转换为 MCP server 的 Capability Source 必须明确报错，
不得从 lock 与 Artifact 中静默消失；带合法 manifest 或 npm `bin` 的包继续可用。

## Spec

- 根 `ai.capabilities` 与 Preset capabilities 都进入解析链。
- 缺少 `mcp.json`、server 声明和 npm `bin` 的 MCP Source 非零失败并给出中性错误。
- 合法 manifest 与 `bin` fallback 进入 lock 和 Canonical MCP。
- 失败路径不写 lock、cache 或目标 Artifact。

## Plan

1. 用中性 file/npm fixtures 覆盖缺失声明、合法 manifest 与 `bin` fallback。
2. 运行 resolver 与 CLI 聚焦测试；仅修仍存在的静默路径。
3. 跑全量与发布门禁，双远程隔离消费。
4. 发布脱敏证据并关闭 #25。

## Deferred-MPF

- #25 之外的其他 Issue。
- 发布与合并：所有已确认缺陷切片完成后统一执行。

## Open questions

- 无。
