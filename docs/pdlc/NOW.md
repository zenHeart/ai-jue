---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-24-adapter-compatibility-preflight
scale: major
slice_gate: user_ok
health: ok
user_accepted: continuous completion authorization (2026-09-19T23:09:00+08:00)
skipped_gates:
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

修复 Issue #24：Host 在导入 Adapter 前统一解析 npm 包身份并验证
`peerDependencies.ai-jue-core` 与实际 Host Core 版本兼容；不兼容时明确失败且零写入。

## Spec

- 一个 Host-owned resolver 返回入口、包名/版本、来源、Core peer range 与 Host Core 版本。
- 缺失、非法或不兼容 peer range 在 import/read/write/confirm 前失败。
- 保留 project-local-first；不兼容时不静默回退或自动升级。
- apply、extension validate、inspect diagnostics 使用同一兼容性结果。
- dry-run/check 失败路径不写项目、HOME、lock、cache 或依赖。

## Plan

1. 审计 apply、extension、inspect 的解析与加载路径。
2. 用合成包 fixture 先复现不兼容、缺失、非法 peer range。
3. 收敛到一个 resolver 并接入三条路径，确保加载前失败。
4. 跑聚焦/全量/发布门禁及双远程隔离消费。
5. 发布脱敏证据并关闭 #24。

## Deferred-MPF

- #24 之外的其他 Issue。
- 发布与合并：所有已确认缺陷切片完成后统一执行。

## Open questions

- 无。
