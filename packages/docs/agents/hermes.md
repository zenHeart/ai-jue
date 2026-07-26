# Hermes

> Jue 状态：Read、Write、Confirm 均已实现（JUE-303，
> `packages/ai-jue-adapter-hermes/`）；Artifact 仅实现单一 workspace 目录
> 形态，未覆盖 Hermes Plugin。`capabilities` 如实声明
> `rules/hooks: "unsupported"`（无对应 per-workspace 承载面）、
> `commands/agents: "degraded"`（no-op 直通）、`skills/mcp: "supported"`。
> Adapter 还额外承载了一个 `cron` 字段（`cron/jobs.json` 整文件直通）——这不属于
> 六类原子 Capability 中的任何一类，是 `CanonicalDocumentSchema` 上新增的
> Hermes 专属可选字段，架构层面尚待 RFC 决定是否需要正式收编或改走别的机制
> （见 implementation-status.md"尚未实现的关键合同"一节）
>
> 官方依据：[Hermes Agent](https://github.com/NousResearch/hermes-agent)、
> [Hermes example plugins](https://github.com/NousResearch/hermes-example-plugins)、
> [Programmatic Integration](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/developer-guide/programmatic-integration.md)

## 1. 官方能力表面

经 JUE-303 对真实 Hermes 安装（`~/.hermes/`）核验：项目级表面是
`MEMORY.md`（共享上下文，语义类似 Claude 的 `CLAUDE.md`）、
`skills/<category>/<name>/SKILL.md`（三层，比 Claude/Codex/OpenClaw 的一层
更深）、`config.yaml` 里的 `mcp.servers` 与 `cron/jobs.json`。真实安装的
`~/.hermes/hooks/` 目录是空的——hooks 表面证据不足，`hooks_auto_accept` 是
会话级策略而非 per-workspace hook；`agent:`/`commands:` 均只存在于全局
`config.yaml`，不是项目内可编写文件。Hermes 另提供 plugins、ACP、TUI Gateway
JSON-RPC 与 OpenAI-compatible HTTP API，这些是运行集成协议或未核验的聚合
Artifact 表面，本 Adapter 尚未覆盖。

## 2. 理想 Jue 映射

| Canonical / Adapter 职责 | Hermes |
| --- | --- |
| `context.global` | `MEMORY.md`（managed block） |
| `skills` | `skills/<category>/<name>/SKILL.md`（三层） |
| `mcp.servers` | `config.yaml` 的 `mcp.servers` |
| `cron`（Hermes 专属附加字段，非六类原子 Capability 之一） | `cron/jobs.json` 整文件直通 |
| `rules` / `hooks` | 诚实 `unsupported`：无 per-workspace 承载面 |
| `commands` / `agents` | 诚实 `degraded`：`config.yaml` 里的同名块是全局运行时策略，读写均为 no-op |
| target-specific settings | `tools.hermes` |
| Artifact | 单一 workspace 目录形态；Hermes Plugin 尚未覆盖 |
| Confirm | 真实 `tirith config validate <projectRoot>`（`tirith` 二进制，隔离临时 HOME） |

## 3. 转换边界

- Hermes Plugin 可能注册运行时代码、工具、平台或 UI，不可自动跨 Agent 转换；
  本 Adapter 目前也未生成 Plugin 形态的 Artifact。
- ACP、Gateway 和 HTTP API 是目标运行接口，不进入 Capability 集合。
- Hermes 自学习、memory、profile 和 session 状态不进入通用 Preset。
- `cron` 是本 Adapter 唯一超出六类原子 Capability 的直通字段；在架构层面
  正式收编（是否需要成为第七类原子 Capability，或改以 `tools.hermes`
  target-private 字段承载）尚未经 RFC 决定，当前实现只是先诚实暴露真实
  存在的原生表面，不代表已冻结的架构决策。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read | Implemented | JUE-303，`packages/ai-jue-adapter-hermes/src/read.ts` |
| Write | Implemented | JUE-303，经 Core 执行器驱动 |
| Artifact | Partial | 仅 workspace 目录形态；Hermes Plugin 聚合体尚未实现 |
| Confirm | Implemented | 真实 `tirith config validate`（`scripts/verify-hermes-native.js` 可重放，需要真实 `tirith` 二进制在 PATH 上）；project 无对应聚合体可确认时如实返回 `unconfirmed` |
