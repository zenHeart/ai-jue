# 当前执行计划

> 更新时间：2026-07-23
> 项目状态：**Jue 能力标准化 MVP 实施阶段**

## 当前 MVP 闭环

目标协议已收敛到
[`packages/docs/specs/jue-mvp.md`](packages/docs/specs/jue-mvp.md)：

- [x] 明确 Jue 是能力标准化与 Agent 适配层，不只是 CLI 工具
- [x] 明确 Capability / Preset / Adapter 三层边界
- [x] 递归保留 skill 附属资源的相对路径与二进制内容
- [x] 收紧 canonical schema、normalize、Preset 目录协议的一致性
- [x] 将 `ai-assets` 接入为 `jue-preset-ai-assets`
- [x] 用同一真实能力集验证 Claude / Cursor / Gemini / Copilot 输出
- [ ] 在 monorepo 完成官网并发布到 `jue.zenheart.site`
- [ ] 通过全量测试、构建、consistency、真实 smoke 与敏感信息门禁

## 非 MVP 范围

- Preset Registry 或远程能力市场
- ai-assets 专属 CLI / adapter / installer
- 自动同步服务
- 在真实接入闭环前继续扩展 canonical top-level capability

---

## P4 历史收口项

## P4: 文档先行的协议收口

### 核心目标

- [ ] 先以代码实现为第一信息源，完成 `TODO.md` / `packages/docs` / `review.md` 的现状收口
- [ ] 让团队先审阅“当前实现事实”和“目标协议”是否一致，再进入下一轮实现
- [ ] 避免继续在统一标准结构未收口前扩展新字段或新 adapter

### P4-A: 统一标准结构收口

- [x] A1. 明确 `schema -> normalize -> preset/.ai -> adapters` 的单向依赖
- [x] A2. 明确 `commands` 必须具备非空 `prompt/content`
- [ ] A3. 明确 `prompts` 的统一输入形状，决定是统一镜像还是收窄为单字段
- [x] A4. 明确 `hooks` 的稳定交集形状，与工具原生 array 形状的边界
- [x] A5. 明确“单工具能力 -> 多工具复用 -> 下沉为统一能力”的正式演进链路

### P4-B: preset / `.ai` 目录协议收口

- [x] B1. 明确 `hooks/<name>/index.json` 的正式协议
- [x] B2. 明确 `tools/<tool>/config.json` 的正式加载协议
- [x] B3. 用根 `mcp.json` 补齐 preset / `.ai` 与 JS config 的同构表达

### P4-C: 脚手架与文档模板收口

- [x] C1. 对齐 `create-preset` 生成结果与当前 loader 实际消费的最小结构
- [x] C2. 清理脚手架中的历史包模板残留（如无效 `main` 字段）
- [ ] C3. 将“当前实现事实”和“目标协议”拆分表述，避免文档先于代码失真

## 审查门禁

- [ ] 先完成文档审阅并确认核心理念
- [ ] 审阅通过后，再进入 P4-A / P4-B / P4-C 的实现阶段
- [ ] 未确认统一标准结构前，不继续扩展新 top-level capability
