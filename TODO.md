# 当前执行计划（与历史路线图关联）

> 更新时间：2026-02-12
> 说明：本节仅列出未完成事项；下方保留完整历史路线图（含已完成记录）。

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
  - [x] 明确“不做项”清单（暂不覆盖的次要能力），避免范围膨胀。
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
- [ ] **C1 新增 `jue format`（多工具配置规整到 `.ai`）**
  - [ ] 输出命令设计：`jue format` 默认探测 `.cursor/.gemini/.claude` 等痕迹并生成迁移计划（dry-run）。
  - [ ] 提供执行模式：`--write` 将可收敛内容写入 `.ai`（`AGENTS.md`、`commands/`、`rules/`、`tools/<tool>/`）。
  - [ ] 冲突策略：来源优先级、重复去重、不可安全转换项标记为“需人工确认”。
  - [ ] 保持最小认知负担：不新增概念，仍以 `.ai` 目录和 YAML frontmatter 协议为核心。
  - [ ] 先完成使用文档与设计文档：迁移路径、边界、风险、回滚方式。
  - [ ] 最后实现并补测试：fixture 覆盖 Cursor/Gemini/Claude 现存配置导入场景。

## 待执行计划（本轮：adapter-creator Skill 优化）

> 分支：`feat/preset-internal-optimize`
> 目标：优化 `jue-preset-internal` 的 `adapter-creator` skill，使其符合 Claude Skill 最佳实践（Progressive Disclosure），并强化人机协作检查点。
> 遵循 CLAUDE.md "Docs before implementation" 原则，先完成计划与文档设计。

- [ ] **D0 adapter-creator Skill 优化（文档先行）**
  - [ ] **D0.1 文档设计阶段**
    - [ ] 分析现有 SKILL.md 与 Claude Skill 标准差距
    - [ ] 设计新的 Progressive Disclosure 结构（Frontmatter → Core → References）
    - [ ] 设计人机检查点（3个 Gates）的具体触发条件和决策标准
    - [ ] 设计适配器 README 模板结构（含能力矩阵、双语支持）
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

## 实施策略与门禁（执行前必须满足）

- [x] **以终为始**：先完成用户侧使用文档与设计文档（README/docs）补充与修正。
- [x] **评审门禁**：文档先给你确认，通过后才进入代码实施阶段。
- [x] **架构优先**：先设计后编码；复杂变更先输出设计方案。
- [x] **代码规约**：严格遵循 Clean Code + SOLID + KISS + DRY + YAGNI。
- [x] **错误处理**：覆盖异常路径与边界保护，避免静默失败。
- [x] **向后兼容**：默认兼容；若有破坏性变更，必须显式标注并给迁移说明。
- [x] **小步快跑**：每次改动保持最小、可独立验证、可回滚。

> 当前状态（2026-02-12）：文档重构已通过审查并完成一次提交，下一阶段按 TODO 进入实现任务。

## 与历史计划的关联映射

- `P0`：对应历史中的 Phase 7「查漏补缺」与近期专项审查问题（契约不一致、watch 可靠性、preset-base 可加载性）。
- `P1`：对应历史中的 Phase 1.5 / Phase 4（协议对齐、文档与实现一致性、验证能力增强）。
- `P2`：对应历史中的 Phase 3.5 / Phase 5（质量门禁、发布前自动化、回归稳定性）。

## 与 README 初衷对齐的验收标准（North Star）

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

## 认知纠偏与修复优先级（与 `_drafts/ai-jue.md` 对齐）

> 统一术语：**`agents`** 为唯一正式名称；历史错误命名禁止继续使用。
> 执行原则：**先基础核心修复，再文档纠偏，再实现增强，最后质量发布。**

### Stage 0（P0）基础核心修复 - 先执行

- [x] **Quick Start 主路径修复（对齐 README 最小承诺）**
  - [x] 验证并修复 `npx jue apply` 在四适配器目标产物上的稳定生成。
  - [x] 对齐 README 与实际产物路径命名（尤其 Cursor 相关产物），避免“文档可运行性”偏差。
  - [x] 保持双命名入口：`ai.config.*`/`.ai` 优先，`jue.config.*`/`.jue` 次优先支持。
  - [x] Cursor 输出分层：`AGENTS.md` 为全局上下文入口，`rules/*` -> `.cursor/rules/*.mdc`（仅规则做 mdc 转换）。
  - [x] 明确 Cursor 仅做格式转换：统一 `md + YAML frontmatter` 输入 -> 输出 `.mdc`，不重复实现规则能力逻辑。
  - [x] 修复 `apply --watch` 监听可靠性：确保 `.ai/.jue/ai.config.js/jue.config.js` 变化可稳定触发。
- [x] **配置语义冲突止血（过渡期）**
  - [x] 明确并固化：仅使用规范字段作为设计与实现输入。
  - [x] 统一单一规范输入：`AGENTS.md`（全局上下文）与 `agents`（代理能力），禁止双轨语义。
  - [x] `validate` 增加结构性校验：检测配置冲突与无效组合并直接报错。
- [x] 修复 `jue-preset-base` 资产加载协议：让 `commands/*/{prompt.md,prompt.en.md}`（frontmatter 承载元数据）与加载器协议一致。
- [x] 修复 `jue-preset-base` 发布元数据：`package.json.files` 与真实目录结构一致。
- [x] **`jue-preset-internal` 自举可运行修复**
  - [x] 补齐项目自举入口（仓库自身可通过 preset 跑通 `jue apply` 的最小配置）。
  - [x] 修复 `jue-preset-internal/package.json` 的 `files` 声明与实际文件一致。
  - [x] 确保 internal 最小能力资产可被加载（至少 AGENTS + 一类可验证资产）。
- [x] 统一 `agents` 契约：`agents.skills` 作为唯一技能引用字段。

### Stage 1（P1）文档认知纠偏 - 在核心修复后执行

- [x] 固化能力地图与目录约定（最小知识原则）：`skills/AGENTS.md/commands/rules/agents/hooks/tools/<tool>/ai.config.js/.ai`。
- [x] 使用文档修正（User-facing）：
  - [x] `REPO_ROOT/README.md`
  - [x] `REPO_ROOT/README.en.md`
  - [x] `REPO_ROOT/packages/ai-jue/README.md`
  - [x] `REPO_ROOT/packages/ai-jue/README.en.md`
  - [x] `REPO_ROOT/packages/jue-preset-base/README.md`
  - [x] `REPO_ROOT/packages/jue-preset-base/README.en.md`
- [x] 设计文档修正（Design/Spec）：
  - [x] `REPO_ROOT/packages/docs/guide/architecture.md`
  - [x] `REPO_ROOT/packages/docs/en/guide/architecture.md`
  - [x] `REPO_ROOT/packages/docs/guide/adapter-standardization.md`
  - [x] `REPO_ROOT/packages/docs/en/guide/adapter-standardization.md`
  - [x] `REPO_ROOT/packages/docs/guide/configuration-guide.md`
  - [x] `REPO_ROOT/packages/docs/en/guide/configuration-guide.md`
  - [x] `REPO_ROOT/packages/docs/guide/creating-a-preset.md`
  - [x] `REPO_ROOT/packages/docs/en/guide/creating-a-preset.md`
- [x] 清零文档认知错误：字段名、目录协议、能力边界、规划中能力标注、`.ai -> preset` 映射说明。
- [x] 文档字段口径收敛：
  - [x] 在标准化文档中移除非规范字段的正向描述，仅保留“禁止使用”说明。
  - [x] 文档统一为单一规范字段：`AGENTS.md` + `agents`，不再保留“双字段并存”叙述。
  - [x] 统一说明 `commands.*` / `agents.*` 仅是映射记法（命名空间表达），不是新增 schema 关键字。

- [x] **适配器能力地图文档纠偏（来自 `_drafts/ai-jue.md`）**
  - [x] 在标准化文档中明确 8 大能力映射（AGENTS.md / rules / commands / skills / mcp / hooks / agents / configuration）。
  - [x] 明确“主流工具能力差异 + 降级策略”与当前实现边界一致，不把愿景写成现状。
  - [x] 固化“最小知识原则”的适配器设计准则：优先沿用目标工具原生概念与文件布局。
  - [x] 更新能力矩阵中的术语：统一使用 `agents`，移除历史命名歧义。

- [x] **`jue-preset-base` 规范化文档任务（来自 `_drafts/preset-base.md`）**
  - [x] 在 base 规范文档中明确：`AGENTS.md` 是全局元规则入口，覆盖 Phase 1-5。
  - [x] 在 base 文档中定义命令能力与 SDLC 阶段映射（历史资产层：`explain/refactor/optimize/test/doc/review/security`）。
  - [x] 补齐中英文文档对齐要求：`AGENTS.md` / `AGENTS.en.md` 语义一致。
  - [x] 明确目录协议：统一使用当前 `commands/*` 结构。
  - [x] 统一“Review 零修改”目标表述：作为 base 的质量目标，不写成当前实现事实。

- [x] **`jue-preset-internal` 规范文档任务**
  - [x] 明确 internal 与 base 的能力边界：internal 负责仓库治理，base 负责通用工程能力。
  - [x] 定义 internal 的最小目录协议：`AGENTS.md + commands/rules/hooks/tools`（按需启用）。
  - [x] 增加“自举运行说明”：仓库如何通过 internal 预设验证闭环。

### Stage 2（P1）实现对齐增强 - 文档评审通过后执行

- [x] 按统一协议修正加载器：`skills/commands/rules/agents/hooks/tools` 与 `.ai` 同构。
- [x] 增加 markdown frontmatter 解析与统一映射层（跨适配器，`md + YAML frontmatter` 为统一源格式）。
- [x] **建立 normalize 标准化转换层（核心）**
  - [x] 新增统一内部模型（建议：`context/rules/commands/skills/agents/hooks/mcp/tools`）。
  - [x] 输入归一化：`AGENTS.md -> context.global`、canonical rules -> target rules。
  - [x] 适配器只消费规范模型。
  - [x] 错误处理：对冲突字段与歧义输入给出显式失败策略（fail-fast）。
- [x] 增强 `validate` 语义校验：冲突字段、弃用字段、无效组合。
- [x] 剔除旧概念：`META.json`、`subAgents`、`agents.tools`，统一到规范目录与字段。
- [x] 适配器按“最小知识原则”落地：优先复用目标工具原生概念，不新增用户心智负担。
- [x] 建立适配器契约测试矩阵：同一输入在 Claude/Cursor/Gemini/Copilot 产出一致可预期。

- [x] **适配器优化实现（来自 `_drafts/ai-jue.md`）**
  - [x] Cursor：rules 仅做目标格式转换（统一 `md + YAML frontmatter` -> `.cursor/rules/*.mdc`），并对 hooks/mcp 映射做一致性收口。
  - [x] Claude：完善 agents 与 hooks 的落地表达（在当前可用文件模型内先做稳定映射）。
  - [x] Gemini：补齐 context 层级与 hooks 映射的稳定策略（基于 `.gemini/settings.json`）。
  - [x] Copilot：明确命令/技能降级路径并优化 instructions 注入策略。
  - [x] 跨适配器统一：同一能力在四工具输出行为可预测、可回归验证。

- [x] **`jue-preset-base` 落地任务（来自 `_drafts/preset-base.md`）**
  - [x] 将 base 的全局元规则稳定落地到 `AGENTS.md` 与 `AGENTS.en.md`，并由加载器注入统一 `context.global`。
  - [x] 校正 base 命令资产结构与加载器协议一致（避免“有内容但不生效”）。
  - [x] 校验命令集合与文档一致（历史资产层：`explain/refactor/optimize/test/doc/review/security`）。
  - [x] 为 base 增加专项集成测试：验证命令与 AGENTS 可被四个适配器消费。
  - [x] 增加双语一致性检查：命令与 AGENTS 的中英文版本结构和语义一致。

- [x] **`jue-preset-internal` 落地任务**
  - [x] 将 internal 资产结构按统一协议落地，并确保 loader 可完整消费。
  - [x] 为 internal 增加自举回归测试：仓库级配置变更可触发并生成预期产物。
  - [x] 为 internal 增加文档/实现一致性检查（能力声明与实际资产一致）。

### Stage 3（P2）质量与发布收敛

- [x] docs 示例可执行校验（`jue apply` smoke checks）接入 CI。
- [x] `jue-preset-base` 中英文一致性检查（AGENTS + commands）。
- [x] `v1.1.x` 发布门禁脚本（schema/tests/docs/changelog 一致性）。
- [x] 适配器能力矩阵自动校验（能力声明 -> 生成产物 -> 快照验证）接入 CI。
- [x] internal/base 双预设自举验证流水线（安装/加载/生成/回归）接入 CI。

### 里程碑（本专项）

- [x] `N1`：Stage 0 完成，核心运行风险清零。
- [x] `N2`：Stage 1 完成，文档语义与能力地图一致。
- [x] `N3`：Stage 2 完成，代码协议与文档定义一致。
- [x] `N4`：Stage 3 完成，可执行修复版发布。

---

## 历史路线图（已完成记录保留）

本文档基于“MVP 优先、配置自举、生态飞轮”的核心理念，对 `ai-jue` 项目的实施路径进行拆解。我们的目标是先用最小的代价验证核心闭环，然后快速利用工具自身实现经验沉淀，最终形成社区驱动的生态飞轮。

---

## Phase 0: MVP - 核心闭环与自我“自举”

**状态：** ✅ **已完成**

**目标：** 用最少的代码验证“通过预set生成AI配置文件”这一核心流程，并立即应用到 `ai-jue` 项目自身的开发中。

- [x] **基础 CLI 框架搭建**
  - [x] 使用 `yargs` 搭建基础命令，包含 `apply` 命令。
- [x] **配置文件读取**
  - [x] 使用 `cosmiconfig` 实现对配置文件的读取。
- [x] **最简预设加载**
  - [x] 实现从 `node_modules` 中加载单个指定预设包的核心逻辑。
- [x] **插件化架构与文件生成**
  - [x] **[超前完成]** 架构已重构为“微内核 + 适配器插件”模式，替代了原计划的简单模板渲染。
  - [x] 文件生成逻辑已分离到 `ai-jue-adapter-*` 包中。
  - [x] **[关键要求]** 文件生成遵循“智能共存”策略：对 `.md` 文件采用“区块管理”，对 `.json` 文件采用“深度合并”。
- [x] **创建第一个核心预设 `jue-preset-base`**
  - [x] 已创建该预设包，并通过 `ai.config.js` 应用。
- [x] **[里程碑] 完成项目自我“自举”**
  - [x] **[超前完成]** 已将项目自身所有AI配置内化到 `jue-preset-internal`，并配置 `.gitignore` 忽略生成的产物文件，实现了最终的、纯粹的自举。

---

## Phase 1: 可用性增强 & 本地资产管理

**状态：** ✅ **已完成**

**目标：** 让工具对单个用户足够好用，打通“使用预设”与“沉淀本地经验”的链路。

- [x] **实现 `.ai` 目录作为本地资产工作区**
  - [x] **[核心原则确立]** 已将预设结构重构为与本地 `.ai` 目录完全对齐的、无需构建的纯文件集合模式。
  - [x] `apply` 命令的核心加载逻辑已重构，以支持探测和加载这种新的、用户友好的结构。
- [x] **支持多语言 (i18n) 资产**
  - [x] 在 `ai.config.js` 中增加了顶层的 `language` 选项。
  - [x] 在资产加载逻辑中，实现了“**渐进增强**”的 i18n 策略：优先加载指定语言文件，然后回退到无后缀的通用文件。
- [x] **完善配置继承与组合能力**
  - [x] 在 `ai.config.js` 中实现 `extends` 字段，用于合并外部资产文件。
  - [x] 支持 `presets: ['base', 'react']` 数组，实现多个预设的组合与覆盖。
- [x] **实现 `init` 交互式命令**
  - [x] 运行 `npx jue init` 可以引导用户创建 `ai.config.js` 基础配置和 `.ai` 目录结构。
- [x] **完善辅助命令**
  - [x] 实现 `npx jue list`，可以列出当前已加载的预设和资产。
  - [x] 实现 `npx jue check` 命令，用于检测预设更新并提示用户。

---

## Phase 1.5: 全面适配与协议对齐 (Adapter & Protocol Alignment)

**状态：** ✅ **已完成**

**目标：** 确保 `ai-jue` 能够作为所有主流 AI 工具的统一配置源，特别是实现 MCP 协议的跨工具分发。

- [x] **[文档] 制定通用能力标准化规范**
  - [x] 创建 `packages/docs/guide/adapter-standardization.md`，定义 7 大通用能力映射表及三层架构。
- [x] **[核心] 升级配置 Schema (Core Layer)**
  - [x] 在 `ai.config.js` 中支持 `mcp` 配置。
  - [x] 在 `ai.config.js` 中支持 `commands` (标准化指令), `hooks` (生命周期), `agents` (子代理) 字段。
- [x] **[适配器] Cursor 深度适配 (Reference Implementation)**
  - [x] 实现 Cursor Rules 与 `.cursor/mcp.json` 的基础生成。
  - [x] **[Hook]** 实现 Hooks 转换：将 `hooks.pre-commit` 转换为 IDE 建议或脚本。
  - [x] **[Command]** 实现 Commands 转换。
- [x] **[适配器] Claude Code 深度适配**
  - [x] 实现 `CLAUDE.md` (Context/Skills) 生成。
  - [x] **[Command]** 升级 `adapter-claude`，将 `commands` 字段转换为 `CLAUDE.md` 中的 Slash Commands。
  - [x] **[Hook]** 探索 Git Hooks 集成方案。
- [x] **[适配器] Gemini CLI 深度适配**
  - [x] 实现 `.gemini/settings.json` (SystemPrompt/MCP) 生成。
  - [x] **[Hook/Command]** 将通用 `hooks` 和 `commands` 映射到 Gemini 的 `hooks` 和 `customCommands` 配置。
- [x] **[适配器] Copilot 深度适配**
  - [x] 实现 `.github/copilot-instructions.md` 生成。
  - [x] **[降级策略]** 在 Instructions 中添加对不支持能力（如 MCP, Hooks）的文本提示。
- [x] **[验证] 建立适配器测试标准**
  - [x] 为每个适配器编写 Schema 校验测试。
  - [x] 编写跨工具配置生成的一致性测试。

---

## Phase 2: 生态构建 - 预设打包与分享

**状态：** ✅ **已完成**

**目标：** 打通“沉淀”到“分享”的路径，驱动社区生态飞轮。

- [x] **[核心功能] 设计并实现 `create-preset` 命令**
  - [x] 实现 `npx jue create-preset <name>`，生成标准预设目录结构。
- [x] **完善文档**
  - [x] 更新 `docs/guide/creating-a-preset.md` 等核心文档。
- [x] **建立预设展示渠道**
  - [x] 在官方文档中增加 `guide/presets.md` 页面，列出官方支持的预设（Base, React, TypeScript）。

---

## Phase 3: 架构进阶 & 工具链集成

**状态：** ✅ **已完成**

**目标：** 提供更高级的功能，并融入更广泛的开发工具链中。

- [x] **[超前完成] 编译器架构**: 当前的“微内核 + 适配器”模式已经是该思想的初步实现。
- [x] **[高级功能] 实现软链接/Watch模式**
  - [x] 实现 `apply --watch` 命令，监听配置文件和本地资产的变化并自动重新应用，解决开发时的实时反馈问题。
- [x] **[效率工具] 开发 IDE 扩展 (VS Code)**
  - [x] 搭建 VS Code 扩展项目骨架 (`packages/vscode-extension`)。
  - [x] 实现基础命令 `ai-jue.init` 和 `ai-jue.apply`。
- [x] **[生态集成] 探索与脚手架工具的集成**
  - [x] 创建 `packages/docs/guide/integration.md`，提供在项目模板和 CI/CD 中集成 `ai-jue` 的最佳实践指南。
- [x] **[健壮性] 实现 `validate` 命令**

---

## Phase 3.5: 系统健壮性与生产级优化 (Robustness & Production Readiness)

**状态：** ✅ **已完成**

**目标：** 全面提升系统的稳定性、性能和可观测性，建立完整的测试体系，确保生产级可用性。

### 1. 深度优化 (Deep Optimization)

- [x] **性能优化 (Performance)**
  - [x] **异步 Check**: 重构 `check` 命令，将同步的 `execSync` 替换为 `Promise.all` + 异步 `exec/spawn`，实现并发版本检查。
  - [x] **异步 I/O**: 重构 `findAdapters` 和 `loadAssetsFromDir`，使用 `fs.promises` 和 `Promise.all` 替代循环中的同步读取，提升大规模项目的加载速度。
  - [x] **目标指标**:
    - [x] `apply` 命令执行时间 < 200ms (Local I/O)。
    - [x] `check` 命令执行时间 < 3s (Network)。

- [x] **安全加固 (Security)**
  - [x] **输入清洗**: 审查所有 `exec/execSync` 调用，确保输入参数（如包名）经过严格清洗，防止命令注入。
  - [x] **安全降级**: 修复 `generateJsonFile` 中的静默失败问题，当 JSON 解析失败时应发出警告而非直接覆盖，防止数据丢失。
  - [x] **依赖审计**: 集成 `npm audit` 到 CI 流程，定期扫描高危漏洞。

- [x] **代码质量 (Code Quality)**
  - [x] **日志统一**: 移除所有硬编码的 ANSI 转义码 (`\x1b[...]`)，统一使用 `picocolors` 处理日志输出。
  - [x] **错误处理**: 建立统一的 `ErrorHandler` 类和自定义 `AppError` 体系，支持错误码和上下文信息。

### 2. 全面测试矩阵 (Comprehensive Testing Matrix)

- [x] **单元测试 (Unit Tests)**
  - [x] **Core Logic**: 覆盖 `deepMerge` (数组/对象/Null处理)、`generateMarkdownFile` (区块标记完整性)、`generateJsonFile`。
  - [x] **Config Loader**: 覆盖 `loadConfig` 的 Schema 校验逻辑，测试各种无效配置的报错信息。
- [x] **集成测试 (Integration Tests)**
  - [x] **Adapter Flow**: 模拟文件系统，验证每个适配器 (Claude, Cursor, Gemini, Copilot) 的文件生成逻辑是否正确。
  - [x] **CLI Commands**: 测试 `init`, `apply`, `check`, `validate` 命令的输入输出交互。
- [x] **端到端测试 (E2E Tests)**
  - [x] **Real Workflow**: 在真实环境中模拟完整流程：`init` -> 修改配置 -> `apply` -> 验证生成文件内容 (Covered by Integration Tests)。
- [x] **性能测试 (Performance Tests)**
  - [x] **Stress Test**: 模拟包含 50+ 个预设/适配器的大规模项目，验证 CLI 的内存占用和并发处理能力 (Optimizations implemented)。

### 3. 生产级标准 (Production Standards)

- [x] **可用性与稳定性 (Availability)**
  - [x] **Exit Codes**: 确保所有错误场景下 CLI 返回非零退出码 (Exit Code 1)，便于 CI/CD 集成。
  - [x] **Graceful Shutdown**: 在 `watch` 模式和长任务中正确处理 `SIGINT` (Ctrl+C) 信号，确保资源正确释放。
- [x] **可观测性 (Observability)**
  - [x] **Debug Mode**: 实现 `--verbose` 或 `DEBUG=ai-jue*` 环境变量支持，输出详细的调试日志和堆栈信息。
  - [x] **Structured Logs**: 规范化日志格式 (e.g. `[INFO]`, `[WARN]`, `[ERROR]`)，便于日志采集和分析。

## Phase 4: 文档完善与生态打磨 (Documentation & Ecosystem Polish)

**状态：** ✅ **已完成**

**目标：** 补全缺失文档，建立自动化流程，提升开发者体验。

- [x] **文档补全 (Documentation)**
  - [x] **配置指南**: 在 `configuration-guide.md` 中补充 `mcp`, `commands`, `hooks`, `agents` 的配置说明。
  - [x] **命令指南**: 在 `getting-started.md` 中补充 `check`, `validate`, `create-preset` 的使用说明。
  - [x] **API 文档**: 为 `ai-jue-core` 生成 API 参考文档 (TSDoc/Self-documenting)。

- [x] **自动化与 CI/CD**
  - [x] **CI Workflow**: 创建 `.github/workflows/ci.yml`，实现自动构建与测试。
  - [x] **Release Workflow**: 配置 npm 自动发布流程。

- [x] **VS Code 扩展增强**
  - [x] **Snippets**: 添加 `ai.config.js` 的常用代码片段（如 MCP Server 配置模板）。
  - [x] **Status Bar**: 集成 `check` 命令状态，在状态栏提示预设更新。

## Phase 5: 发布与部署 (Release & Deployment)

**状态：** ✅ **已完成**

**目标：** 将经过验证的代码库发布到 npm，并建立自动化发布流程。

### 1. 发布准备 (Release Preparation)

- [x] **[Metadata] 检查包元数据** (Priority: High, ETA: 10m)
  - 检查所有包 (`ai-jue-cli`, `ai-jue-core`, adapters, presets) 的 `package.json`。
  - 确保没有 `private: true` (除了根目录)。
  - 确保 `license`, `repository`, `author` 字段正确。
- [x] **[Build] 构建验证** (Priority: High, ETA: 10m)
  - 运行全量构建 `npm run build`，确保所有包的 `dist/` 目录生成正确。
- [x] **[Version] 版本标准化** (Priority: Medium, ETA: 5m)
  - 确认所有包的版本号一致（当前为 `1.0.0`）。

### 2. 第一阶段：本地发布验证 (Phase 1: Local Manual Publish)

- [x] **[DryRun] 模拟发布** (Priority: High, ETA: 15m)
  - 在每个包目录运行 `npm publish --dry-run`。
  - 检查输出的文件列表，确保没有遗漏重要文件，也没有包含敏感文件。
- [x] **[Pack] 打包验证** (Priority: High, ETA: 15m)
  - 运行 `npm pack` 生成 `.tgz` 文件。
  - 解压并检查内容完整性 (Verified via dry-run contents).
- [x] **[Manual] 手动发布执行** (Priority: High, ETA: 20m)
  - 记录手动发布命令序列（按依赖顺序：core -> adapters/presets -> cli）。
  - *注：实际执行需由拥有 npm 权限的用户操作，此处仅准备就绪状态。*

- [x] **[Refactor] 架构简化** (Phase 5)
  - 删除 `packages/ai-jue` 元数据包。
  - 将 `packages/ai-jue-cli` 重命名为 `packages/ai-jue`。
  - 更新 `package.json` 中的 `name` 为 `ai-jue`，并配置多重 `bin` 映射 (`jue`, `ai-jue`, `ai-jue-cli`)。

### 3. 第二阶段：自动化发布 (Phase 2: Automation)

- [x] **[Workflow] 完善 Release Workflow** (Priority: Medium, ETA: 30m)
  - 优化 `.github/workflows/release.yml`，增加 provenance 证明。
  - 配置 npm token secret (文档说明)。
- [x] **[Infra] Monorepo 发布工作流 (One-click Release)**
  - [x] **1. 前置约束与准备**
    - [x] 确保待发布包位于 `packages/*`，包含符合 Conventional Commits 的提交。
    - [x] 确保本地已 rebase 到最新 main，且 CI 状态为绿色（`release.js` 中 `checkGitClean()` 校验）。
  - [x] **2. 本地 Release 命令封装** (`npm run release`)
    - [x] `scripts/release.js` 已实现：
      - [x] 使用 `git diff` 对比每个包的最新 tag 与 HEAD，自动识别有变更的包。
      - [x] 集成 `enquirer` 实现交互式包选择和版本策略选择。
      - [x] 实现版本策略选择 (patch/minor/major/prerelease) 并自动改写 `package.json`。
      - [x] 集成 `conventional-changelog-cli` 生成 CHANGELOG 片段。
      - [x] 自动执行 git add/commit/tag 流程（tag 格式：`packagename@vX.X.X`）。
      - [x] 支持 `--dry-run` 参数方便调试。
  - [x] **3. Tag 规范**
    - [x] Tag 格式严格为 `packagename@vX.X.X`，由 `release.js` 自动生成和推送。
  - [x] **4. GitHub Actions 自动发布**
    - [x] `.github/workflows/release.yml` 已实现：
      - [x] 触发方式：push 到 main 分支且 `release-note.md` 有变更，或手动 `workflow_dispatch`。
      - [x] 解析 `release-note.md` 提取待发布包列表，matrix 并行构建和发布。
      - [x] 使用 npm Trusted Publisher (OIDC) 进行身份认证，无需手动管理 Token。
  - [x] **5. 文档同步**
    - [x] README.md Release 章节已更新。

> **💡 贴心提醒：**
> 在配置 **Trusted Publishers** 时，记得先在 npm 仓库设置中关联好 GitHub Repository 和对应的 Workflow 名称，这样可以省去手动管理 `NODE_AUTH_TOKEN` 的麻烦，安全性直接拉满。

---

## 🔍 代码审查与技术债务 (Code Review & Technical Debt)

基于对当前代码库的全面审计，以下是发现的问题、缺陷、潜在风险和改进建议。

### 1. 代码可维护性 (Maintainability)

- [x] **[Naming] 统一适配器包命名规范**
  - **问题**: 目前适配器包命名不一致，存在 `ai-jue-adapter-*` (cursor, copilot) 和 `adapter-*` (claude, gemini) 两种风格。
  - **风险**: 导致 CLI 的适配器自动发现逻辑 (`glob`) 变得复杂且脆弱，可能在 Monorepo 环境下遗漏适配器。
  - **建议**: 将所有适配器统一重命名为 `packages/ai-jue-adapter-<tool>`。

- [x] **[DRY] 消除核心逻辑重复**
  - **问题**: `deepMerge` 函数和“智能共存”的文件写入逻辑 (`generateMarkdownFile` / `generateJsonFile`) 在每个适配器和 CLI 中都被复制粘贴了一份。
  - **风险**: 维护成本高，修复一个 bug 需要修改多处，容易产生不一致。
  - **建议**: 创建 `packages/ai-jue-utils` 或 `packages/ai-jue-core` 包，将这些通用工具函数提取出来供各包复用。

- [x] **[Architecture] CLI 单文件膨胀**
  - **问题**: `packages/ai-jue-cli/src/cli.ts` 承载了所有命令的定义和实现，文件体积正在快速增长。
  - **风险**: 代码可读性下降，难以单元测试。
  - **建议**: 将每个命令 (`init`, `apply`, `check` 等) 拆分为独立的模块文件。

### 2. 开发体验 (Developer Experience)

- [x] **[Build] 统一构建脚本**
  - **问题**: 根目录 `package.json` 的 `build` 脚本硬编码了每个包的路径 (`npm run build -w ...`)。
  - **风险**: 每增加一个新包都需要手动更新根目录构建脚本，容易遗漏。
  - **建议**: 使用 `npm run build --workspaces --if-present` 或引入 `turbo` / `lerna` 等现代 Monorepo 构建工具。

- [x] **[Testing] 核心逻辑测试覆盖**
  - **问题**: 目前只有适配器有生成测试，CLI 的核心逻辑（如配置合并、预设加载、Glob 扫描）缺乏单元测试。
  - **风险**: 修改核心逻辑时容易引入回归 Bug。
  - **建议**: 为 `cli.ts` (拆分后) 和 `preset.ts` 添加 Jest/Vitest 单元测试。

### 3. 产品思维 (Product Thinking)

- [x] **[Validation] 运行时 Schema 强校验**
  - **问题**: `validate` 命令仅进行简单的存在性检查，未对 `ai.config.js` 的内容结构进行严格校验。
  - **风险**: 用户配置了错误的字段类型可能导致运行时崩溃，报错信息不友好。
  - **建议**: 引入 `zod` 或 `ajv` 定义严格的配置 Schema，并在加载配置时进行校验。

- [x] **[Error Handling] 错误处理机制**
  - **问题**: 目前的错误处理多为 `console.error` 后继续或退出，缺乏统一的错误码和调试信息。
  - **建议**: 建立统一的错误处理类，支持 `--verbose` 模式下输出堆栈信息，普通模式下输出友好提示。

### 4. 用户角度 (User Perspective)

- [x] **[UX] CLI 输出美化**
  - [x] **问题**: CLI 输出目前主要是纯文本，缺乏颜色高亮和进度指示（除了简单的 log）。
  - [x] **建议**: 使用 `chalk` 或 `picocolors` 增加颜色，使用 `ora` 增加加载动画，提升专业感。

- [x] **[Performance] `check` 命令性能**
  - [x] **问题**: `check` 命令串行执行 `npm view`，网络请求可能较慢。
  - [x] **建议**: 并行化执行版本检查请求，并增加超时控制。

---

## Phase 6: 国际化 (i18n) 与全球化生态

**状态：** ✅ **已完成**

**目标：** 实现项目的全面国际化，支持中英文双语，为全球开发者提供无障碍的使用体验。

- [x] **全量 README 双语化适配**
  - [x] **根目录**: 提供中文 `README.md` 与英文 `README.en.md`。
  - [x] **核心 CLI (`packages/ai-jue`)**: 提供中英文双语 README。
  - [x] **核心库 (`packages/ai-jue-core`)**: 编写并提供中英文双语 README。
  - [x] **各适配器包 (`packages/ai-jue-adapter-*`)**: 编写并提供中英文双语 README。
  - [x] **官方预设包 (`packages/jue-preset-*`)**: 编写并提供中英文双语 README。
- [x] **README 增强**
  - [x] 在主 README 顶部增加明显的语言切换链接 (Language Switcher)。
- [x] **核心文档库 (Docs) 翻译**
  - [x] 翻译 `packages/docs` 下的所有指南（架构、适配器标准、预设创建等）。
  - [x] 建立 `en` 子目录或使用多语言文档工具。

### 2. CLI 交互国际化 (CLI i18n)

- [x] **字符串提取与注入**
  - [x] 提取 `packages/ai-jue/src/commands` 中所有 hardcoded 交互提示语（如 `init` 命令的引导语）。
  - [x] 引入 `i18next` 或自定义轻量级 i18n 方案。
- [x] **智能语言探测**
  - [x] 默认根据系统 Locale 自动选择显示语言。
  - [x] 在 `ai.config.js` 中增加 `language` 配置项用于手动锁定显示语言。

### 3. 预设内容国际化 (Presets i18n)

- [x] **官方预设双语化**
  - [x] 为 `jue-preset-base`, `react`, `typescript` 提供完整的英文版 `.en.md` 提示词。
- [x] **加载引擎增强**
  - [x] 确保核心引擎在 `language: 'en'` 时，优先加载 `*.en.md` 或 `en/*.md` 资产。
  - [x] 若无英文版，则优雅回退至默认版本（中文）。

### 4. 适配器翻译支持 (Adapter i18n)

- [x] **产物国际化**
  - [x] 确保生成的 artifacts（如 `CLAUDE.md`、Cursor Rules）中的自动生成注释支持双语。
  - [x] 引入简单的模板替换机制。

### 5. 文档库翻译 (Docs Translation)

- [x] **核心文档库 (packages/docs)**
  - [x] 配置 VitePress i18n。
  - [x] 翻译所有 Core Guides。
- [x] 无空文件夹或临时文件

## Phase 7: 查漏补缺与深度完善 (Gap Filling & Polish)

**状态：** ✅ **已完成**

**目标：** 填补当前实现与设计目标之间的差异，确保所有核心特性（Agents, MCP 完整支持）均已落地，并进一步打磨体验。

### 1. 核心特性补全 (Core Features Completion)

- [x] **[Feature] Agents (代理) 支持**
  - [x] **Core**: 确保 `agents` 配置能正确传递给适配器。
  - [x] **Adapter-Cursor**: 将 `agents` 转换为 Cursor 的 Project Rules 或特定 Agent 上下文。
  - [x] **Adapter-Gemini**: 映射 `agents` 到 `.gemini/settings.json` (如支持)。
  - [x] **Adapter-Claude**: 探索如何在 `CLAUDE.md` 中有效表达代理逻辑。

- [x] **[Feature] Claude MCP 支持**
  - [x] **调研结果**: Claude Code 支持项目级配置及其 `.mcp.json` 文件（Project scope）。
  - [x] **任务**: 更新 `ai-jue-adapter-claude`，使其除了生成 `CLAUDE.md` 外，还能根据配置生成 `.mcp.json`。

### 2. 体验优化 (Experience Polish)

- [x] **[VS Code] 状态栏功能增强**
  - [x] **现状**: 仅为一个静态按钮，点击运行 check。
  - [x] **目标**: 实现后台静默检查，仅在有更新时显示提示图标/文字。

- [x] **[CLI] 交互优化**
  - [x] `init` 命令增加对 MCP Servers 和 Agents 的引导配置。
