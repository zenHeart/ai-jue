# Claude Code 执行手册

本页规定后续 Claude Code 如何实施 [Delivery Plan](delivery-plan.md)。任务依赖和
完成条件以 Delivery Plan 为准，本页只定义编排、隔离、交接和证据协议。

R1（Claude Code 真实闭环）已按下述顺序全部完成；实现进度见
[实现状态](implementation-status.md)。本页描述的编排流程从 R2 起同样适用。

## 编排原则

Claude Code 主会话是唯一 Lead，维护任务依赖、公共合同和最终验收。并行只用于
依赖已经满足且写入边界互不相交的工作：

| 工作类型 | Claude Code 机制 | 约束 |
| --- | --- | --- |
| 官方能力搜索、CLI 探测、fixture 方案交叉复核 | subagent 或 dynamic workflow | 只读；返回证据 URL、版本、命令和结论，不修改合同 |
| 一个 Adapter 内的串行闭环 | 主会话 | Claude Code R1 保持单线程，从 fixture 到原生确认逐关推进 |
| Scale Gate 后三个独立 Adapter | Agent View 会话或 worktree subagent | 每个目标独占 worktree 和 Extension 目录 |
| 需要共享任务列表和即时协商的工作 | Agent Teams | 仅显式启用时使用；按文件分配所有权，由 Lead 合并 |
| 最终合同、Canonical、Core、ArtifactChange 变更 | 主会话 | 暂停并行，先回到 Architecture/RFC 决策 |

Agent Teams 是可选协调层，不是完成任务的前置条件。默认执行路径应能只用主会话、
subagent/dynamic workflow 和 worktree 完成。

## 固定角色

Lead 每轮只创建当前门禁需要的最少角色：

1. **Surface Researcher**：从官方文档、CLI help/schema 和本地只读探测生成目标
   能力表面与证据。
2. **Fixture Reviewer**：将能力表面压缩成最小全量 fixture 矩阵，检查正向、
   保留和失败样本。
3. **Adapter Owner**：只修改一个目标 Extension 的 `read/write/confirm`。
4. **Contract Verifier**：只运行共享 schema、往返、幂等、保留和安全测试。
5. **Native Verifier**：在隔离临时项目验证官方安装、inventory 和真实调用。

研究角色不得写实现；Adapter Owner 不得修改 Canonical 或 Core；验证角色不得为
使测试通过而改变产品合同。一个人可以串行承担多个角色，但一次交接只能有一个
明确产物。

## Claude Code R1 顺序

```text
Lead 冻结公共合同
  → Researcher 提交官方能力矩阵
  → Fixture Reviewer 提交最小全量 fixture
  → Adapter Owner 完成 read
  → schema 与 Native 往返门禁
  → Adapter Owner 完成 write/confirm
  → Core dry-run/apply/check 门禁
  → Native Verifier 完成 Plugin 与 headless 门禁
  → Lead 在干净环境重放 JUE-110
```

每一步只在上一步证据完整后开始。Claude Code 是参考 Extension，不能同时探索
公共模型和三个后续目标实现。

## Scale Gate（JUE-205）冻结内容

Scale Gate 通过即冻结以下内容；R3 三条工作流直接复用，不得各自重新设计：

- **模板**：`packages/jue-preset-internal/skills/adapter-creator/SKILL.md`
  （六阶段方法论）与 `references/IMPLEMENTATION-patterns.md`（能力映射代码
  模式），当前版本 v6.2.0。
- **输入契约**：Phase 1 产出的版本化能力矩阵（官方文档 + 实测 CLI 输出，
  不采信未验证断言）与 Phase 2 产出的最小全量原生 fixture（按 Artifact
  kind 分目录、target-private 字段保留样本、失败样本、聚合 Artifact 调查）。
- **输出契约**：`packages/ai-jue-adapter-{agent}/`（`src/capabilities/*.ts`
  声明表、`read.ts`/`write.ts` 薄组合、`confirm.ts`、`index.ts` 组装
  `Adapter` + `defineExtension()`、`fixtures/`、`test/contract.test.ts` 调用
  `ai-jue-core/testkit` 的 `defineAdapterContractSuite`）；`write()` 输出必须
  经 `packages/ai-jue-core/src/core-executor.ts` 的 `planExecution`/
  `applyExecution`/`checkExecution` 驱动，不得各自实现 apply/回滚。
- **完成证据契约**：下方"交接合同"字段列表，加上原生确认（`claude plugin
  validate`/`--bare` 一类的目标官方路径，Plugin/Bundle 还需 inventory 与至少
  一次真实调用）。
- **判定生态位边界**：合成/测试用目标（无法提供任何真实原生确认的构造）不得
  建成 `packages/ai-jue-adapter-*` 独立包（会被 `jue apply` 的 glob 真实发现），
  只能作为 `ai-jue-core/test/fixtures/` 下的仓库内测试 fixture（JUE-204 先例）。

本次 Scale Gate 复核：`npm test`（299 通过）、`npm run build`、
`npm run check-consistency`、`npm --prefix packages/docs run docs:build`、
`git diff --check` 全部通过；工作树无未预期改动。

## Scale Gate 后的并行图

```text
                         ┌─ Codex worktree ───────┐
JUE-205 frozen contract ─┼─ OpenClaw worktree ────┼─ Lead integration ─ R4
                         └─ Hermes worktree ──────┘
```

三条工作流复用 `agent-extension` Skill、目录骨架和共享合同测试。每条分支只拥有：

- 自己的 Extension 目录；
- 自己的中性 fixture 与原生证据；
- 自己的 Agent 支持画像。

共享 schema、Core、CLI、授权或文档合同由 Lead 独占。发现公共缺口时，工作线程只
提交最小复现和建议，不在目标分支中扩展公共抽象。

## Claude 原生验证

Claude Adapter 的完成证据必须来自临时隔离项目。先运行目标官方静态校验，再运行
确定性的非交互验证：

```bash
claude plugin validate <generated-plugin>
claude --bare -p "<deterministic fixture task>" \
  --plugin-dir <generated-plugin> \
  --output-format stream-json \
  --verbose \
  --allowedTools "<minimum tools>"
```

测试工具必须解析 `system/init`：

- 生成的 Plugin 出现在 `plugins`；
- `plugin_errors` 为空；
- 实际可见 tools、MCP 和 Plugin inventory 与 fixture 预期一致；
- 最终 `result` 成功，并能证明至少一个生成能力被发现或调用。

需要 settings、MCP 或 custom agents 时，只通过 `--settings`、`--mcp-config`、
`--agents` 显式装载。fixture 不依赖用户目录、自动记忆或机器上的既有 Claude
配置。权限使用满足测试的最小 `--allowedTools` 集合。

## 交接合同（JUE-205 冻结）

每个任务的输出必须包含：

```text
task_id
status
owned_paths
official_evidence
fixture_cases
changes
commands_run
logical_results
native_results
security_results
remaining_risks
next_ready_task
```

`status` 是 `done`/`blocked`/`ready`/`in_progress` 之一；`changes` 列出实际改动的
文件路径（不是产物描述）；`security_results` 记录敏感引用/凭据类检查的结果，即使
该任务未触及也需显式写"不适用"，不能省略；`next_ready_task` 是按 Delivery Plan
依赖判定的下一个 `ready` 任务 ID，用于交接。

Lead 只接受可从干净 worktree 重放的证据。单测与 schema 证明逻辑事实；官方
validate、inventory、headless 或真实读取证明运行时事实。任何一类缺失时任务保持
`blocked`，不能以文字总结代替。

## 最终 ai-assets 阶段

R5 开始前冻结四个 Adapter 和交叉转换合同。Claude Code Lead 先生成脱敏 inventory，
再将 ai-assets 迁移为新 Preset；四目标验证可按 worktree 并行，但由 Lead 对同一
inventory 汇总矩阵。

完成条件是每个 inventory 项在四目标均有语义等价的原生 Artifact 和运行时证据。
任何缺失先定位到 Preset、Canonical、Adapter 或目标原生验证层；只有证明六概念
无法表达时才进入 RFC，不允许为单个私有资产引入公共捷径。
