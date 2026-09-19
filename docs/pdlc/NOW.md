---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-27-local-preset-check
scale: minor
slice_gate: user_ok
health: ok
user_accepted: continuous completion authorization (2026-09-19T23:09:00+08:00)
skipped_gates: plan_ok (minor slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

修复 Issue #27：`jue check` 识别 local/file/workspace Preset 并跳过 Registry
版本查询；已发布 Registry Preset 继续执行更新检查。

## Spec

- private workspace Preset 返回 skipped 而非 npm 404。
- file/local/workspace 来源均不调用 `npm view`。
- Registry Preset 保持版本比较。
- 输出与测试不包含私有包名、Registry 或本机路径。

## Plan

1. 用中性 workspace fixture 复现 npm 404 路径。
2. 先写失败测试，再按 resolved source 跳过 Registry。
3. 跑聚焦/全量/发布门禁及双远程隔离消费。
4. 发布脱敏证据并关闭 #27。

## Deferred-MPF

- #27 之外的其他 Issue。
- 发布与合并：所有已确认缺陷切片完成后统一执行。

## Open questions

- 无。
