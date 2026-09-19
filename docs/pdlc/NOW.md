---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: patch-release-after-verified-defects
scale: patch
slice_gate: implementing
health: ok
user_accepted:
skipped_gates: spec_ok,plan_ok (patch slice; user authorized merge and publish)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

把已合入主干、尚未发包的隐私与发布合同修复发布为一轮 patch，
并保持各 Adapter 对 Core 的有界 peer/dev 范围对齐。

## Spec

- 只发布已合入主干的变更，不夹带 INBOX 中的 RFC/Feature/Epic。
- 入库测试与 changelog 只写中性描述。
- `ssh cwr` / `ssh mp` 只做不入库的 `jue --version` / 帮助消费。
- 发布后 npm 上的版本与 git tag 一致。

## Plan

1. 为将要 bump 的包补齐 CHANGELOG。
2. 跑测试、隐私扫描与 release-gate。
3. `npm run release -- --yes --bump=patch`。
4. 第一轮 Release 因 Hermes/OpenClaw peer 未对齐失败；对齐后补发 0.3.3，
   再写回 `release-note.md` 触发未上架的 2.1.2 / 2.0.2 包。
5. 现场 SSH 只确认版本号，不写回仓库。

## Deferred-MPF

- INBOX 中的 RFC/Feature/Epic 保持 open，不在本轮实现。

## Open questions

- 无。
