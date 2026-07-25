# 当前执行计划

> 更新时间：2026-07-25
> 项目状态：**Jue 能力标准化 MVP 已完成**（P4/P5 全部收口，详见下方）

## 当前 MVP 闭环

目标协议已收敛到
[`packages/docs/specs/jue-mvp.md`](packages/docs/specs/jue-mvp.md)：

- [x] 明确 Jue 是能力标准化与 Agent 适配层，不只是 CLI 工具
- [x] 明确 Capability / Preset / Adapter 三层边界
- [x] 递归保留 skill 附属资源的相对路径与二进制内容
- [x] 收紧 canonical schema、normalize、Preset 目录协议的一致性
- [x] 用本地多包 Preset 仓库验证真实组合边界
- [x] 用同一真实能力集验证 Claude / Cursor / Gemini / Copilot 输出
- [x] 在 monorepo 完成官网并发布到 `jue.zenheart.site`
- [x] 通过全量测试、构建、consistency、真实 smoke 与敏感信息门禁

## 非 MVP 范围

- Preset Registry 或远程能力市场
- 特定私有 Preset 仓库专属 CLI / adapter / installer
- 自动同步服务
- 在真实接入闭环前继续扩展 canonical top-level capability
- scoped npm Preset 特殊解析（非本期核心）

---

## P5: Capability Source（输入侧）— 本仓（ai-jue）实现

> 协议：[`packages/docs/specs/capability-source.md`](packages/docs/specs/capability-source.md)
> 诉求：`ai.capabilities` 是 `ai.presets` 的兄弟字段（同放 Preset `package.json` 或项目根 `ai.config.js`
> 的 `ai` 命名空间），首要用途是同仓多 Preset 引用同一本地 Capability 去重（`file:`），第三方引用
> （github / npm）是同一机制的后续扩展。
> **ai-jue 实现 resolver / converter / lock；Preset 仓库只声明引用，不实现解析。**

### 落点

- `packages/ai-jue-core/` — Source / CapabilityRef 类型（`SingleCapabilityRef` / `DirectoryCapabilityRef`
  判别式 union，供 `config.ts` 与 `preset.ts` 共用同一校验）
- `packages/ai-jue/src/capability-source/` — resolve / load / converters
- `packages/ai-jue/src/preset.ts` — 加载 `ai.capabilities` 后 merge（Preset 与项目根 `ai.config.js`
  共用同一实现）
- `packages/ai-jue/src/config.ts` — `ConfigSchema` 新增 `capabilities` 字段与 `allowedTopLevelKeys`

### 切片

- [x] S0 审阅 capability-source 规格 + core 类型
- [x] S1 `file:` + `agent-skill` converter + 单测（含同仓 2 个 Preset 引用同一本地能力、不产生物理复制的用例）
- [x] S4 接入 preset 加载链 + 项目根 resolver 加载链（先打通本地）
- [x] S2 `github:` + lock/cache（本地 mock 验证）
- [x] S3 `npm:` + `mcp` converter（本地 tarball 验证）

### 验收门禁

- [x] 现有 smoke（base / internal / local Preset）不回退
- [x] 未知 converter / 循环 preset 显式失败
- [x] 下载不执行 skill scripts

### P5 加固（2026-07-25 code review 发现并修复）

- [x] `jue capability update [name]` 命令（原规格已写明但未实现）
- [x] `github:` 缺省 `ref` 时按规格输出警告（原来静默）
- [x] Capability Source 内容寻址缓存命中短路（原来每次都重新下载/`npm pack`）
- [x] 修复：缓存目录未做完整性校验，中断的解压会被永久当作有效缓存（改为解到临时目录后原子 rename）
- [x] 修复：`ai.capabilities` 清空后陈旧 `ai-jue.lock` 残留，导致 `capability update` 误报成功（改为空结果时删除 lock）
- [x] Lock 条目补充人类可读的 `source`/`ref`/`path`（原来只有 hash，无法审计具体拉取了什么）

---

## P4 历史收口项（已收口，见下方说明）

## P4: 文档先行的协议收口

> 收口说明（2026-07-25）：P4-A/B/C 的实质内容早于本次收口即已完成（仅剩 A3、C3 两项纯设计/表述问题）。
> P5（Capability Source）已经在 P4 之上落地并通过验证，说明 P4 的统一结构事实上已经支撑了下一轮扩展。
> 本次收口是在与用户逐项确认（P5 实现事实核对、cache 命中缺陷范围、A3 设计方向）后完成的，是本轮对话内的
> 确认闭环，不是一次独立的团队正式文档评审会——如实记录这一点，避免"审阅通过"被误读为更重的流程。
> `review.md` 未在仓库中实际创建，此处一并显式记录为不存在，而非静默略过。

### 核心目标

- [x] 先以代码实现为第一信息源，完成 `TODO.md` / `packages/docs` 的现状收口（`review.md` 从未创建，视为不适用）
- [x] 确认“当前实现事实”和“目标协议”是否一致，再进入下一轮实现（P5 已在此结构上落地并验证通过）
- [x] 未在统一标准结构收口前扩展新字段或新 adapter（`ai.capabilities` 按 `capability-source.md §0` 显式不构成第四个平级概念，仍落回既有六类 Capability）

### P4-A: 统一标准结构收口

- [x] A1. 明确 `schema -> normalize -> preset/.ai -> adapters` 的单向依赖
- [x] A2. 明确 `commands` 必须具备非空 `prompt/content`
- [x] A3. 明确 `prompts` 的统一输入形状：与 `skills`/`agents` 一致，在 `normalize.ts` 做 `prompt/content` 双向镜像（见 `architecture.md §3.1`）
- [x] A4. 明确 `hooks` 的稳定交集形状，与工具原生 array 形状的边界
- [x] A5. 明确“单工具能力 -> 多工具复用 -> 下沉为统一能力”的正式演进链路

### P4-B: preset / `.ai` 目录协议收口

- [x] B1. 明确 `hooks/<name>/index.json` 的正式协议
- [x] B2. 明确 `tools/<tool>/config.json` 的正式加载协议
- [x] B3. 用根 `mcp.json` 补齐 preset / `.ai` 与 JS config 的同构表达

### P4-C: 脚手架与文档模板收口

- [x] C1. 对齐 `create-preset` 生成结果与当前 loader 实际消费的最小结构
- [x] C2. 清理脚手架中的历史包模板残留（如无效 `main` 字段）
- [x] C3. 将“当前实现事实”和“目标协议”拆分表述：`architecture.md §3` 已采用双层表述（当前实现事实 / 目标协议），并显式记录待收口差异

## 审查门禁（已收口，见上方"收口说明"）

- [x] 先完成文档审阅并确认核心理念
- [x] 审阅通过后，再进入 P4-A / P4-B / P4-C 的实现阶段
- [x] 未确认统一标准结构前，不继续扩展新 top-level capability
