---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-11-cursor-failure-fixtures
scale: patch
slice_gate: verifying
health: ok
user_accepted:
skipped_gates: spec_ok,plan_ok (patch slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

为 Cursor Adapter 补齐脱敏 failure fixtures 与安全合同：字面量凭据拒绝、
hook 路径穿越拒绝，并记录未知 hook 事件的透传降级。

## Spec

- `fixtures/failures/sensitive-reference/` 触发 `assertNoLiteralCredentials`。
- `fixtures/failures/path-escape-hook/` 在 read/write 前失败。
- `fixtures/failures/invalid-hook-event/` 透传未知事件名并写入 README。
- 合同套件接入至少一条 sensitive-reference 用例。
- fixture 名不含 `/`；值为合成标记，不是真实密钥。

## Plan

1. 先写失败测试与中性 fixture。
2. 在 Cursor MCP/hooks mapping 复用 Core 安全规则。
3. 更新 fixtures README 与 Cursor 后续工作表。

## Deferred-MPF

- 其余 INBOX 项。

## Open questions

- 无。
