---
mode: hot
product_kind: software
intent_status: accepted
phase: converging
vcs: git
branch: main
slice_id: privacy-gate-before-remote-validation
scale: patch
slice_gate: user_ok
health: ok
user_accepted: 2026-09-19T23:09:00+08:00
skipped_gates: spec_ok,plan_ok (patch slice; user accepted the privacy constraint)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

在连接 `cwr` / `mp` 或向 GitHub 回传验证证据前，保证仓库中的 CWR
回归样本只包含中性占位符，并让自动门禁能扫描已跟踪文件，避免名为
“redacted”的样本绕过仅检查暂存区的 pre-commit 扫描。

## Spec

- 入库测试只使用脱敏/中性 fixture：保留结构、字段类型和服务器数量，不保留
  真实身份、主机、路径或凭据值。
- `ssh cwr` / `ssh mp` 只用于现场 Agent 消费验证：命令、输出、本机路径、
  会话日志一律不入库、不进 CI、不进 Issue 评论。
- `security-scan` 默认行为继续检查暂存内容，兼容现有 pre-commit 用法。
- 增加显式的全仓已跟踪文件扫描模式；发现敏感字面量时只报告规则、文件和行号，
  不回显原始行。
- 自动测试覆盖“拒绝敏感值”和“接受中性占位符”。

## Plan

1. 先写扫描器失败测试，证明当前全仓扫描能力缺失。
2. 最小化扩展扫描器并中性化 CWR fixture。
3. 运行聚焦测试、全仓隐私/安全扫描及相关 Adapter 回归测试。
4. 门禁通过后再建立 Issue 缺陷队列并开始第一条 Issue 切片。

## Deferred-MPF

- Git 历史清理与疑似凭据轮换：需要仓库所有者在对应服务侧执行，不能由测试替代。
- `cwr` / `mp` SSH 现场 Agent 消费：每刀 Issue 修完后在隔离 HOME 跑，证据只口头/本地脱敏摘要，不入库。
- 任何 GitHub Issue 评论或关闭：进入对应 Issue 切片后执行。

## Open questions

- 历史中出现过的任何真实凭据是否仍有效，必须按已暴露处理并由所有者轮换。
