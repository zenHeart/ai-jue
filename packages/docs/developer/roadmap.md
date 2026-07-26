# Roadmap

每阶段形成一个可验证闭环。先用一个真实 Agent 证明架构，再开放并行迁移。

## R0：文档合同收敛

- [x] 冻结六概念模型。
- [x] 冻结 `init`、`apply`、`inspect` 三命令用户面。
- [x] 明确 Canonical 与目标私有配置边界。
- [x] 明确 Adapter 纯转换、Core 统一执行 ArtifactChange。

门禁：契约测试禁止平行转换层、目标私有字段进入 Canonical、独立 Extension
manifest 和 Adapter 自行扩大副作用。

## R1：headless Claude Code Reference Extension

- 完成 ProjectConfig、CanonicalDocument、ArtifactChange 与托管状态。
- 建立最小 npm Extension Host。
- 核验 Claude Code 当前官方原生表面与 headless 确认路径。
- 实现 Claude `read/write/confirm`。
- 用真实 Claude Extension 跑通 `dry-run → Core apply → confirm → check`。
- 通过隔离项目、二次 apply 零差异、冲突、拒绝授权和回滚验证。

门禁：headless Claude Code 能通过原生路径读取或执行生成能力；完整证据可在干净
环境重复。未通过前不得并行开发其他 Agent。

## R2：agent-extension Scale Gate

- 在仓库沉淀 `agent-extension` Skill，标准化官方能力发现、聚合 Artifact 调查、
  最小全量 fixture、转换和原生确认。
- 从 Claude 实现提炼并冻结 Extension 目录骨架和共享类型。
- 冻结所有 Adapter 共用的合同测试与 fixture 约定。
- 冻结只包含原生表面、映射、Artifact 和确认路径的迁移清单。
- 用中性第二 Adapter fixture 证明无需修改 Core 或 Canonical。

门禁：Claude 全量回归继续通过；新 Agent 只需实现目标原生差异。通过后才开放
Codex、OpenClaw、Hermes 并行迁移。

## R3：并行 Agent 迁移

- Codex、OpenClaw、Hermes 分别复用同一 Extension 骨架和合同测试。
- 每条并行任务只实现目标原生 `read/write/confirm`。
- 公共缺口回到串行 Architecture/RFC 决策，不在分支内扩展 Canonical。
- 四 Agent 共用一个 portable Canonical fixture。

门禁：三条迁移不修改 Core、Canonical DSL、ArtifactChange 或通用授权语义；目标
原生确认通过，零静默丢失。

## R4：交叉转换与多目标验收

- 冻结四 Agent 共同支持的 portable Canonical fixture 与各目标投影。
- 验证任意 Agent A → Canonical → Agent B 的目标投影等价。
- 验证 `apply --all` 生成四目标 Artifact，并能各自反读为对应投影。
- 验证目标私有字段不跨 Agent 传播，以及多目标失败隔离。

门禁：两两交叉矩阵、`--all`、幂等、字段保留、安全和原生确认全部通过。真实
Preset 不参与定义 Canonical。

## R5：ai-assets 最终消费者闭环

- 脱敏盘点 ai-assets 的全部叶能力、组合关系、作用域和运行依赖。
- 按新的 CapabilityRef 与 Preset 合同迁移，不把私有资产内容复制到公共 fixture。
- 同一 Preset 为 Claude Code、Codex、OpenClaw、Hermes 生成各自原生项目与聚合
  Artifact。
- 逐目标完成官方安装/发现、代表性真实调用、全量 inventory 和反读验证。
- 执行一次 `apply --all` 与二次零差异检查。

门禁：每项 ai-assets 能力在四目标均语义等价可用；`degraded`、`unsupported`、
`blocked` 为零；敏感扫描无泄露。ai-assets 是最终产品验收集，但不反向修改
Canonical DSL。
