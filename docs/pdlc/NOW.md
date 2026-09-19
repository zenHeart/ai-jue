---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-9-openclaw-cursor-bundle
scale: patch
slice_gate: implementing
health: ok
user_accepted:
skipped_gates: spec_ok,plan_ok (patch slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

OpenClaw `compatible-bundle` 增加显式 `tools.openclaw.bundleFormat: "cursor"`，
委托现有 Cursor Extension 默认导出。`auto` 仍只选 Claude/Codex。

## Spec

- `bundleFormat` 接受 `auto | claude | codex | cursor`。
- `auto` 永不选 Cursor。
- 通过 Cursor 包默认 Extension 的唯一 Adapter 写入 plugin 布局。
- 缺失 Cursor peer 在产生变更前失败。
- Cursor `variables` 只进入 Cursor 基底；Claude/Codex 清单不含该字段。
- 身份：Cursor 基底用 `tools.cursor.pluginManifest`，不先吃 Claude/Codex。

## Plan

1. 先写失败测试。
2. 扩展 OpenClaw writer 与 identity 解析。
3. 对齐 peer/dev 与文档。

## Deferred-MPF

- #26/#35 prune RFC、#8 marketplace、#33/#31 RFC、#5/#22/#30。

## Open questions

- 无。
