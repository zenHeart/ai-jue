# Hermes

> Jue 状态：Read、Write、Confirm 均为 Implemented（`packages/ai-jue-adapter-hermes/`）；
> **workspace** Artifact 已实现。官方 Hermes「plugin」是 `plugin.yaml` + Python
> `register(ctx)` 的运行时扩展，可附带 `ctx.register_skill` 打包 skills。
> Canonical 能力包默认走 workspace；可选薄封装 `skill-plugin`
> （[RFC-0002](../developer/rfcs/0002-plugin-artifact-apply.md) Phase B）已实现，
> 并沿用 Hermes 的官方 plugin.yaml surface。`capabilities` 如实声明
> `rules/hooks: "unsupported"`、`commands/agents: "degraded"`、
> `skills/mcp: "supported"`。额外 `cron`（`cron/jobs.json`）作为 Hermes 专属
> pass-through 字段提供，映射边界见
> [implementation-status](../developer/implementation-status.md)。
>
> 官方依据：[Plugins](https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins)、
> [Build a Hermes Plugin](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin)、
> [Hermes Agent](https://github.com/NousResearch/hermes-agent)

## 1. 官方能力表面

真实 Hermes 安装（`~/.hermes/`）的项目级表面包括：`MEMORY.md`（共享上下文，
语义类似 Claude 的 `CLAUDE.md`）、`skills/<category>/<name>/SKILL.md`（三层，
比 Claude/Codex/OpenClaw 的一层更深）、`config.yaml` 里的 `mcp.servers` 与
`cron/jobs.json`。`~/.hermes/hooks/` 目录属于 runtime surface；
`hooks_auto_accept` 属于会话级策略。`agent:`/`commands:` 位于全局 `config.yaml`
runtime surface。Hermes 另提供 plugins、ACP、TUI Gateway JSON-RPC 与
OpenAI-compatible HTTP API，这些运行集成面按 Agent-specific surface 记录，
Adapter 实现状态见 [implementation-status](../developer/implementation-status.md)。

## 2. 理想 Jue 映射

| Canonical / Adapter 职责 | Hermes |
| --- | --- |
| `context.global` | `MEMORY.md`（managed block） |
| `skills` | `skills/<category>/<name>/SKILL.md`（三层），保留 `references/`、`scripts/`、`assets/` 支持文件 |
| `mcp.servers` | `config.yaml` 的 `mcp.servers` |
| `cron`（Hermes 专属附加字段，与六类原子 Capability 并列） | `cron/jobs.json` 整文件直通 |
| `rules` / `hooks` | 诚实 `unsupported`：无 per-workspace 承载面 |
| `commands` / `agents` | 诚实 `degraded`：`config.yaml` 里的同名块是全局运行时策略，读写均为 no-op |
| target-specific settings | `tools.hermes` |
| Artifact | `workspace`（skills+mcp）；`skill-plugin`（`plugin.yaml` + 仅 `register_skill` 的 `__init__.py` + flat `skills/`；mcp 仍走 workspace） |
| Confirm | Workspace：存在 `tirith` 时运行 `tirith config validate`，命令不可用时返回 `unconfirmed`；skill-plugin：结构校验（`plugin.yaml` / `register_skill` initializer / skill 目录） |

## 3. 转换边界

- Hermes general plugin 可注册 Python tools/hooks/commands/platforms；`skill-plugin`
  选择其中的 `register_skill` 能力作为轻量分发面，Canonical 文本能力保持与该边界一致。
- 分发 skills：`skill-plugin` 生成 `register_skill` 样板 + flat `skills/`；
  mcp/context 仍留在 workspace apply。
- ACP、Gateway 和 HTTP API 是 Transport/Runtime 面，与 Capability 集合并列。
- Hermes 自学习、memory、profile 和 session 状态属于 Agent runtime state，通用 Preset
  继续聚焦可迁移 Capability。
- `cron` 是本 Adapter 的 Agent-specific pass-through 字段；implementation-status
  记录其映射边界。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read | Implemented | `packages/ai-jue-adapter-hermes/src/read.ts` |
| Write | Implemented | `packages/ai-jue-adapter-hermes/src/write.ts`，经 Core 执行器驱动 |
| Artifact | Implemented | `workspace` + thin `skill-plugin`（skills/`plugin.yaml`/`register_skill`；MCP 仍 workspace）；runtime extension surface 遵循 Hermes 官方 Plugin 规范 |
| Confirm | Implemented | Workspace：可用时运行真实 `tirith config validate`，命令缺失时显式 `unconfirmed`；skill-plugin：`plugin.yaml`、`register_skill` initializer 与 skill roots 的结构证据 |
