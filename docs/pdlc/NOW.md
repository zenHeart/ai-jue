---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-10-adapter-creator-cursor-dual-layout
scale: patch
slice_gate: implementing
health: ok
user_accepted:
skipped_gates: spec_ok,plan_ok (patch slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

补齐 adapter-creator 对 Cursor project/plugin 双布局的正向合同，使作者按
现有 `ai-jue-adapter-cursor` 实现写出同一套布局，而不是仍把 Cursor 当成
单一 `.cursor/` 根。

## Spec

- `IMPLEMENTATION-patterns.md` 增加 Cursor 双布局一节，指向真实路径。
- `SKILL.md` Phase 2/3 增加「多种 Artifact kind？」门禁。
- 不声称 Cursor 只有 project；不实现 marketplace 或 failure fixtures。
- `smoke-apply` / docs 构建不受影响。

## Plan

1. 按现有 Cursor `layout.ts` / hooks / manifest 写短摘录 + 链接。
2. 更新 SKILL 检查清单。
3. 跑 smoke-apply 与相关测试。

## Deferred-MPF

- #11 Cursor failure fixtures（下一刀）。
- #1 / RFC / 其余 INBOX 项。

## Open questions

- 无。
