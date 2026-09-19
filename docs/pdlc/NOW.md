---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-3-native-confirmation-hardening
scale: major
slice_gate: user_ok
health: ok
user_accepted: continuous completion authorization (2026-09-19T23:09:00+08:00)
skipped_gates: plan_ok (minor slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

修复 Issue #3：Hermes 与 OpenClaw 的确认和 ownership 在导入/执行原生 CLI 前
验证真实受管字节、regular-file/realpath 边界，并使用隔离状态、最小环境和脱敏证据。

## Spec

- Hermes 仅在 `__init__.py` 精确等于受管模板时无审批替换。
- Hermes skill-plugin 拒绝 symlink、非 regular 文件、非法 manifest 与 marker comment。
- Hermes/OpenClaw 原生确认使用隔离 HOME/state 与最小环境；错误证据有界且不回显路径/凭据。
- OpenClaw list 必须包含 manifest identity，inspect format 必须匹配生成 marker。
- 原生验证脚本只接受 `confirmed`；`unconfirmed` 非零失败。

## Plan

1. 为 ownership、symlink、inventory、format、环境和证据边界写失败测试。
2. 收紧共享结构验证与原生 CLI 调用，更新验证脚本。
3. 跑聚焦/全量/发布门禁，并在授权 cwr/mp 现场执行原生确认。
4. 发布脱敏证据；仅两端真实确认通过后关闭 #3。

## Deferred-MPF

- RFC/Feature/Epic 进入 INBOX。
- 发布与合并：所有已确认缺陷切片完成后统一执行。

## Open questions

- 无。
