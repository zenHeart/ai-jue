---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-4-codex-runtime-toml
scale: patch
slice_gate: user_ok
health: ok
user_accepted: continuous completion authorization (2026-09-19T23:09:00+08:00)
skipped_gates: spec_ok,plan_ok (patch verification; user authorized continuous issue repair)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

核验 Issue #4：发布后的 Codex Adapter 是否把运行时必需的
`@iarna/toml` 作为生产依赖安装，并能在隔离消费者及远程 Agent 环境加载。

## Spec

- Adapter 包的 `dependencies` 必须包含 `@iarna/toml`。
- 从 pack 产物安装到空消费者后，加载 Adapter 不得依赖 monorepo 根依赖。
- `cwr` 与 `mp` 现场验证仅返回脱敏状态，不保存脚本或输出。
- 若当前版本已满足合同，不改生产代码；以验证证据关闭已解决 Issue。

## Plan

1. 检查 package 合同并生成本地 tarball。
2. 在空目录安装 Core 与 Codex Adapter tarball，执行加载 smoke。
3. 在 `cwr`、`mp` 临时目录重复消费验证，完成后删除临时文件。
4. 证据通过则评论并关闭 #4，提交本刀 NOW。

## Deferred-MPF

- 其他 Issue。
- 发布与合并：所有已确认缺陷切片完成后统一执行。

## Open questions

- 无。
