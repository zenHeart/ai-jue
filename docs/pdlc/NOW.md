---
mode: hot
product_kind: software
intent_status: accepted
phase: iterating
vcs: git
branch: main
slice_id: issue-1-npm-capability-from-preset
scale: patch
slice_gate: verifying
health: ok
user_accepted:
skipped_gates: spec_ok,plan_ok (patch slice; continuous completion authorization)
---
# NOW

本隔离单元当前刀。WIP=1。

## Intent

`npm:<name>@<exact>` Capability 先从声明 Preset 的已安装直接依赖解析，
校验包名与精确版本后再读 `path`。没有匹配安装时保留现有 `npm pack`。
嵌套 Preset 从其父 Preset 目录解析，不依赖进程 cwd。

## Spec

- 不新增 `CapabilityRef.root` 或并行身份字段。
- 声明 Preset 有匹配直接依赖时，用 Node 包解析（起点为该 Preset）。
- 包名/版本不符则显式失败；未安装则回退 `npm pack`。
- `path` 仍受 containment 约束。
- 覆盖 hoisted、nested、bundled、source-workspace 布局。
- 现有 `file:`、`npm:file:*.tgz`、远程精确 npm 不回归。

## Plan

1. 更新 Capability Source 规范。
2. 先写失败测试（无 registry、无绝对路径 source）。
3. 在 `resolveNpm` / `loadPresetRecursive` 落地。

## Deferred-MPF

- 其余 INBOX 项（#26/#35 RFC、#9、#8、#33、#31、#5/#22/#30）。

## Open questions

- 无。
