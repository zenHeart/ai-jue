---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-26-35-directory-per-item-prune
scale: patch
slice_gate: implementing
health: ok
user_accepted:
skipped_gates: spec_ok,plan_ok (patch slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

`directoryPerItem` 在再次 apply 时删除 Canonical 已不存在、但 `read()` 仍识别
的条目目录。不新增 CLI 命令或第七概念。

## Spec

见 RFC-0005。仅识别带主文件的条目目录；人手目录（无 SKILL.md 等）保留。
`delete` 走现有 ArtifactChange 与 dry-run/check。

## Plan

1. 写入 RFC-0005 并挂导航。
2. TDD：rename 留下旧目录、recursive delete、人手目录存活。
3. Core 两处修补。

## Deferred-MPF

- 全量 managed-file manifest（#26 宽方案）。
- #8 / #22 / #30 / #31 / #33 / #5。

## Open questions

- 无。
