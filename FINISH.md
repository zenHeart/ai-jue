# 已完成任务

> 更新时间：2026-02-13
> 本文件归档所有在 `TODO.md` 中已完成的事项。

## 待审计划（本轮：工具能力映射校准）

> 目标：以 `_drafts/ai-jue.md` 为映射基线，逐工具核对并修正能力转换；先完成文档与计划审查，你确认后再执行代码改造。

- [x] **A0 审查门禁（先审后改）**
  - [x] 先完成文档与计划审查，再进入实现阶段。
  - [x] 形成“能力 -> 工具输出 -> 降级策略 -> 测试点”的统一清单并回写 docs。
- [x] **A1 AGENTS.md 单一语义固化（跨工具）**
  - [x] 固化规则：项目根目录 `AGENTS.md` 存在即自动注入，不新增配置负担。
  - [x] 清理历史/错误概念残留（命名、路径、兼容叙述），避免二义性。
- [x] **A2 Cursor 能力映射复核与收敛（P0）**
  - [x] Cursor 采用原生 `AGENTS.md` 作为全局上下文入口；`rules/*` 映射到 `.cursor/rules/*.mdc`。
  - [x] `rules/*` -> `.cursor/rules/*.mdc`（frontmatter 保留 description/alwaysApply/globs）。
  - [x] `commands/*` -> `.cursor/commands/*.md`，`skills/*` -> `.cursor/skills/*/SKILL.md`。
  - [x] `hooks` -> `.cursor/hooks.json`，`mcp.servers` -> `.cursor/mcp.json`，`agents` -> `.cursor/agents/*.md`。
  - [x] 回归验证：base/internal 自举 smoke + Cursor 适配器契约测试。
- [x] **A3 Claude 能力映射补齐（P0）**
  - [x] AGENTS.md、commands、skills、hooks、agents、mcp 的输出契约逐项核对。
  - [x] 明确 `rules` 在 Claude 的落地策略：显式降级到 `CLAUDE.md`。
  - [x] 补充缺失测试：rules 与 hooks 的行为断言，避免静默忽略。
- [x] **A4 Gemini 能力映射补齐（P0）**
  - [x] AGENTS.md -> `GEMINI.md` 引用注入策略核对（与 prompts 优先级一致）。
  - [x] `commands/hooks/mcp/agents/tools.gemini` -> `.gemini/settings.json` 的映射校验。
  - [x] 明确 `rules` 能力策略：显式降级写入 `GEMINI.md`。
- [x] **A5 Copilot 能力映射补齐（P0）**
  - [x] AGENTS.md、commands、skills、hooks 的注入边界核对。
  - [x] `mcp/agents/rules` 的降级说明标准化（统一文案+行为，不夸大支持度）。
  - [x] 文档声明与实现一致化，避免“文档支持但实现仅提示”偏差。
- [x] **A6 统一降级策略与失败策略（P1）**
  - [x] 以 `_drafts/ai-jue.md` 为基线，输出四工具“支持/降级/不支持”矩阵。
  - [x] 对不支持能力统一显式降级提示策略，不允许静默吞掉能力。
- [x] **A7 验证与门禁（P1）**
  - [x] 新增跨适配器能力契约测试：同一输入覆盖 8 类能力并断言目标产物。
  - [x] 扩展 smoke：base/internal 必跑 + 关键产物路径断言 + 快照回归。
  - [x] CI 门禁收口：适配器矩阵测试、smoke、docs 一致性检查全部必过。

## 待执行计划（本轮：base/internal 闭环）

> 目标：先解决“最核心痛点能力”，不追求大而全；先形成可持续迭代的最小闭环，再逐步扩展。
> 执行门禁：先完成本节文档与计划，待你审核通过后再进入实现。

- [x] **B0 场景优先级冻结（先定义边界）**
  - [x] 明确本轮只覆盖最核心场景：用户意图识别、新项目启动、已有项目开发与重构、仓库级治理与扩展开发。
  - [x] 明确“不说项”清单（暂不覆盖的次要能力），避免范围膨胀。
  - [x] 固化用户命令接口为 7 个核心命令：`jue:impl`、`jue:fix`、`jue:rev`、`jue:ref`、`jue:exp`、`jue:test`、`jue:doc`。
- [x] **B1 `jue-preset-base` 用户场景闭环（文档先行）**
  - [x] 重构 `REPO_ROOT/packages/jue-preset-base/README.md`：按“用户场景”组织而不是仅能力罗列。
  - [x] 场景 1：意图识别（需求澄清/约束确认/边界澄清）的使用路径与验收标准。
  - [x] 场景 2：新项目启动（初始化、规则落地、基础命令）的最小操作路径。
  - [x] 场景 3：已有项目开发与重构（变更前分析 -> 实施 -> 验证 -> 复盘）的标准流程。
  - [x] 在 README 中明确命令与场景映射：`jue:impl`、`jue:fix`、`jue:rev`、`jue:ref`、`jue:exp`、`jue:test`、`jue:doc`。
  - [x] 联网核对主流 Agentic 工作流资料，补齐命令集合设计依据与参考链接。
- [x] **B1.5 `jue-preset-base` 命令资产落地（实现准备）**
  - [x] 明确用户接口与现有资产目录映射：`jue:exp -> commands/explain`、`jue:ref -> commands/refactor`、`jue:rev -> commands/review`、`jue:test -> commands/test`、`jue:doc -> commands/doc`。
  - [x] 补齐缺口命令资产：新增 `jue:impl`、`jue:fix` 对应目录与 prompt（中英文）。
  - [x] 明确本轮取舍：`optimize/security` 作为后续扩展能力，不作为当前 7 个核心用户接口暴露项。
- [x] **B1.6 Conventional Commits 对齐层（不增加用户负担）**
  - [x] 保持用户接口不变：`jue:impl/fix/rev/ref/exp/test/doc`，不强制改名为 commit type。
  - [x] 增加映射规则：`impl->feat`、`fix->fix`、`ref->refactor`、`test->test`、`doc->docs`、`rev->chore(有改动时)`、`exp->docs(产出文档时)`。
  - [x] 约定命令输出包含建议提交格式：`<type>(<scope>): <description>`，破坏性变更用 `!` / `BREAKING CHANGE:`。
- [x] **B1.7 Commands frontmatter 单一协议收敛（移除 `index.json`）**
  - [x] `commands/*` 元数据统一收敛到 `prompt.md/prompt.en.md` 顶部 YAML frontmatter（`description`、`triggers`）。
  - [x] 加载器去除 `commands/*/index.json` 依赖，仅消费 Markdown + frontmatter。
  - [x] 更新脚手架、测试与校验脚本，取消对 `commands/*/index.json` 的必需约束。
  - [x] 更新 base/spec/TODO 文档协议描述，确保“用户文档-设计文档-实现”一致。
- [x] **B1.8 适配器执行白名单机制（显式触发）**
  - [x] `apply` 默认不执行任何适配器，用户必须显式指定 `--adapter` 或 `--all/-a`。
  - [x] 支持 `--adapter` 多次传入与逗号分隔（含 `cursor/gemini/claude/copilot` 友好别名）。
  - [x] 更新 smoke 与文档示例，统一为显式适配器执行模式。
- [x] **B2 `jue-preset-internal` 闭环文档补齐（文档先行）**
  - [x] 新增 `REPO_ROOT/packages/jue-preset-internal/README.md`，定义 internal 的目标、边界、使用方式。
  - [x] 在 internal README 明确“在 base 之上”补充能力：adapter 开发、preset 开发、能力扩展、仓库治理。
  - [x] 清理 `REPO_ROOT/packages/jue-preset-internal/AGENTS.md` 历史概念，统一到当前规范术语与架构。
  - [x] 给出“吃自己狗粮”操作手册：本仓如何用 internal 驱动持续迭代。
- [x] **B3 internal 最小能力面定义（先定义后实现）**
  - [x] 固化 internal 最小资产集合（在现有 AGENTS + commands 基础上，明确是否补 rules/hooks/tools 的最小样例）。
  - [x] 定义 internal 对应的核心痛点清单：适配器新增、preset 扩展、文档一致性、回归门禁。
  - [x] 输出“能力 -> 资产路径 -> 预期产物 -> 验证点”映射表。
- [x] **B4 实施阶段计划（待审核后执行）**
  - [x] base/internal 文档审核通过后，再进入最小实现改造。
  - [x] 按“核心协议收敛 -> internal 闭环补齐 -> 统一验证”完成实施，确保步骤独立可验证。
  - [x] 每一步都要求可独立验证与可回滚。
- [x] **B5 闭环验收门禁（待审核后执行）**
  - [x] base/internal 的场景化 smoke 验证（不仅校验文件存在，还校验场景行为）。
  - [x] 适配器矩阵回归 + docs 一致性回归。
  - [x] 通过后再进入下一轮“能力扩展”迭代。
- [x] **B6 预设嵌套闭环（internal 自动包含 base）**
  - [x] 设计并固化 preset 嵌套协议：允许 preset 在自身元数据中声明依赖 preset（类似 eslint extends）。
  - [x] 明确加载顺序与覆盖规则：先依赖、后自身；自身同名资产覆盖依赖。
  - [x] 增加循环依赖防护与错误提示，避免递归加载失控。
  - [x] 文档先行：更新 `packages/jue-preset-internal/README.md`、`packages/jue-preset-base/README.md`、preset 设计文档说明嵌套机制。
  - [x] 实现层支持嵌套解析，并让 `jue-preset-internal` 声明依赖 `jue-preset-base`，保证自举默认具备 base 核心能力。
  - [x] 补充集成测试：验证 `preset: "internal"` 时可自动消费 base 命令资产。
- [x] **C0 AGENTS 单一来源与跨工具引用收敛（文档先行）**
  - [x] 固化规则：项目根目录 `AGENTS.md` 作为单一来源；适配器优先引用而非复制。
  - [x] Cursor 对齐原生能力：直接消费根目录 `AGENTS.md`。
  - [x] 保留注释块增量更新策略于 `CLAUDE.md` / `GEMINI.md` 等生成文件，避免覆盖用户手写内容。
  - [x] Claude/Gemini 生成文件改为包含 `@AGENTS.md` 引用语义（而不是内联复制全部内容）。
  - [x] 明确本地已有 `CLAUDE.md`/`GEMINI.md`/`AGENTS.md` 时的合并策略：仅管理注释块，用户自定义内容保持不变。
  - [x] 补充回归测试：验证引用语义与注释块追加语义均生效。

## 待执行计划（本轮：adapter-creator Skill 优化）

- [x] **D0 adapter-creator Skill 优化（文档先行）**
  - [x] **D0.1 文档设计阶段**
    - [x] 分析现有 SKILL.md 与 Claude Skill 标准差距
    - [x] 设计新的 Progressive Disclosure 结构（Frontmatter → Core → References）
    - [x] 设计人机检查点（3个 Gates）的具体触发条件和决策标准
    - [x] 设计适配器 README 模板结构（含能力矩阵、双语支持）
  - [x] **D0.2 references/ 模板创建**
    - [x] 创建 `references/README-template.md`（中文适配器文档模板）
    - [x] 创建 `references/README-template.en.md`（英文适配器文档模板）
    - [x] 创建 `references/IMPLEMENTATION-patterns.md`（实现模式参考）
  - [x] **D0.3 SKILL.md 重构**
    - [x] 优化 Frontmatter：精简 description，明确触发条件
    - [x] 重构核心指令：Quick Start + 3个人机检查点
    - [x] 添加 Testing Guide 章节
    - [x] 使用渐进式披露，链接到 references/
  - [x] **D0.4 jue-preset-internal README 更新**
    - [x] 添加第6节：Adapter Creator Skill 使用指南
    - [x] 说明多代理工作流和人机检查点
    - [x] 提供使用示例和验证方法
  - [x] **D0.5 验证与回归**
    - [x] 运行 `npm run smoke-apply` 验证 preset 可加载 ✅
    - [x] 运行 `npm test -- packages/ai-jue/test/preset-internal.integration.test.ts` ✅ (3 passed)
    - [x] 验证新的 references/ 文件被正确打包（package.json files） ✅

---

## 历史路线图

### 与历史计划的关联映射

- `P0`：对应历史中的 Phase 7「查漏补缺」与近期专项审查问题（契约不一致、watch 可靠性、preset-base 可加载性）。
- `P1`：对应历史中的 Phase 1.5 / Phase 4（协议对齐、文档与实现一致性、验证能力增强）。
- `P2`：对应历史中的 Phase 3.5 / Phase 5（质量门禁、发布前自动化、回归稳定性）。

### 与 README 初衷对齐的验收标准（North Star）

- [x] **NS1 配置碎片化问题被真实解决**：
  - [x] 最小路径可跑通：`npm i -D ai-jue <preset> + ai.config.js + npx jue apply`。
  - [x] 一次配置可稳定生成四类主目标产物（Claude/Cursor/Gemini/Copilot）。
  - [x] `--watch` 变更同步稳定，满足“无感更新”。
- [x] **NS2 经验碎片化问题被真实解决**：
  - [x] `.ai` 目录资产可被加载、组合、覆盖，并可迁移为 preset。
  - [x] 用户不需要学习 ai-jue 独有新概念即可组织资产（最小知识原则）。
  - [x] base/internal 的能力边界清晰，复用与治理路径明确。
- [x] **NS3 文档-设计-实现一致**：
  - [x] README 承诺、docs 描述、代码行为三者一致。
  - [x] 能力边界（已支持/规划中）表达准确，不夸大现状。

### 认知纠偏与修复优先级

> 统一术语：**`agents`** 为唯一正式名称；历史错误命名禁止继续使用。
> 执行原则：**先基础核心修复，再文档纠偏，再实现增强，最后质量发布。**

#### Stage 0（P0）基础核心修复 - 先执行

- [x] **Quick Start 主路径修复（对齐 README 最小承诺）**
- [x] **配置语义冲突止血（过渡期）**
- [x] 修复 `jue-preset-base` 资产加载协议
- [x] 修复 `jue-preset-base` 发布元数据
- [x] **`jue-preset-internal` 自举可运行修复**
- [x] 统一 `agents` 契约

#### Stage 1（P1）文档认知纠偏 - 在核心修复后执行

- [x] 固化能力地图与目录约定（最小知识原则）
- [x] 使用文档修正（User-facing）
- [x] 设计文档修正（Design/Spec）
- [x] 清零文档认知错误
- [x] 文档字段口径收敛
- [x] **适配器能力地图文档纠偏**
- [x] **`jue-preset-base` 规范化文档任务**
- [x] **`jue-preset-internal` 规范文档任务**

#### Stage 2（P1）实现对齐增强 - 文档评审通过后执行

- [x] 按统一协议修正加载器
- [x] 增加 markdown frontmatter 解析与统一映射层
- [x] **建立 normalize 标准化转换层（核心）**
- [x] 增强 `validate` 语义校验
- [x] 剔除旧概念
- [x] 适配器按“最小知识原则”落地
- [x] 建立适配器契约测试矩阵
- [x] **适配器优化实现**
- [x] **`jue-preset-base` 落地任务**
- [x] **`jue-preset-internal` 落地任务**

#### Stage 3（P2）质量与发布收敛

- [x] docs 示例可执行校验（`jue apply` smoke checks）接入 CI。
- [x] `jue-preset-base` 中英文一致性检查（AGENTS + commands）。
- [x] `v1.1.x` 发布门禁脚本（schema/tests/docs/changelog 一致性）。
- [x] 适配器能力矩阵自动校验（能力声明 -> 生成产物 -> 快照验证）接入 CI。
- [x] internal/base 双预设自举验证流水线（安装/加载/生成/回归）接入 CI。

#### 里程碑（本专项）

- [x] `N1`：Stage 0 完成，核心运行风险清零。
- [x] `N2`：Stage 1 完成，文档语义与能力地图一致。
- [x] `N3`：Stage 2 完成，代码协议与文档定义一致。
- [x] `N4`：Stage 3 完成，可执行修复版发布。

---

### Phase 0: MVP - 核心闭环与自我“自举”

**状态：** ✅ **已完成**

### Phase 1: 可用性增强 & 本地资产管理

**状态：** ✅ **已完成**

### Phase 1.5: 全面适配与协议对齐 (Adapter & Protocol Alignment)

**状态：** ✅ **已完成**

### Phase 2: 生态构建 - 预设打包与分享

**状态：** ✅ **已完成**

### Phase 3: 架构进阶 & 工具链集成

**状态：** ✅ **已完成**

### Phase 3.5: 系统健壮性与生产级优化 (Robustness & Production Readiness)

**状态：** ✅ **已完成**

### Phase 4: 文档完善与生态打磨 (Documentation & Ecosystem Polish)

**状态：** ✅ **已完成**

### Phase 5: 发布与部署 (Release & Deployment)

**状态：** ✅ **已完成**

### Phase 6: 国际化 (i18n) 与全球化生态

**状态：** ✅ **已完成**

### Phase 7: 查漏补缺与深度完善 (Gap Filling & Polish)

**状态：** ✅ **已完成**

---

### 🔍 代码审查与技术债务 (Code Review & Technical Debt)

- [x] **代码可维护性 (Maintainability)**
- [x] **开发体验 (Developer Experience)**
- [x] **产品思维 (Product Thinking)**
- [x] **用户角度 (User Perspective)**
