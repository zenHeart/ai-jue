---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-32-skill-root-sidecars
scale: minor
slice_gate: user_ok
health: ok
user_accepted: continuous completion authorization (2026-09-19T23:09:00+08:00)
skipped_gates: plan_ok (minor slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

修复 Issue #32：Capability Source 加载目录型 Skill 时保留根目录 sidecar，
使第三方 bundle 经 Adapter 投影后仍完整，同时排除包元数据与不安全路径。

## Spec

- `SKILL.md` 仍是主文档，其他允许文件进入 Canonical references/resources。
- npm `package.json`、安装脚本和缓存档案不作为 Skill sidecar。
- 嵌套目录与二进制内容往返不丢失，路径保持 bundle 内安全。
- 现有本地 Preset Skill 行为保持兼容。

## Plan

1. 构造根 sidecar+nested fixture，证明当前转换丢失点。
2. 先写失败测试，再最小扩展 Skill loader 与 Adapter round-trip。
3. 跑聚焦/全量/发布门禁及双远程隔离消费。
4. 发布脱敏证据并关闭 #32。

## Deferred-MPF

- #32 之外的其他 Issue。
- 发布与合并：所有已确认缺陷切片完成后统一执行。

## Open questions

- 无。
