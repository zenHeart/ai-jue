# Codex

> Jue 状态：Read、Write、Artifact（project 与 Plugin 两种）、Confirm 均为
> Implemented（`packages/ai-jue-adapter-codex/`）。`capabilities` 如实声明三个
> 降级边界：`commands: "degraded"`（custom-commands 机制已废弃）、
> `mcp: "degraded"`（MCP 配在 `[mcp_servers.*]` TOML 表里，超出 JSON 工厂
> 范围）、`rules: "degraded"`（无独立 rules 目录，归入 AGENTS.md）
>
> 官方依据：[Codex Customization](https://developers.openai.com/codex/concepts/customization)、
> [Codex Plugins](https://developers.openai.com/codex/plugins/build)

## 1. 官方能力表面

Codex 使用 `AGENTS.md`、skills、custom agents、MCP、hooks 与项目
`.codex/config.toml` 等表面。Codex Plugin 是可安装 Bundle，可组合 skills、
commands、tools、MCP config、hooks、assets、apps 和 marketplace metadata。

## 2. 理想 Jue 映射

| Canonical / Adapter 职责 | Codex |
| --- | --- |
| `context.global` / `rules` | `AGENTS.md` |
| `skills` / `commands` | `.agents/skills/*/SKILL.md` |
| `agents` | `.codex/agents/*.toml` |
| `hooks` | `.codex/hooks.json` 或单一规范配置表达 |
| `mcp.servers` | `.codex/config.toml` |
| target-specific settings | `tools.codex` |
| Artifact | project-native config 或 Codex Plugin（`.codex-plugin/plugin.json`） |
| Confirm | Plugin：真实 `codex plugin marketplace add`+`plugin add`+`plugin list --json`（隔离 `CODEX_HOME`）；project：无对应原生校验工具，如实返回 `unconfirmed` |

## 3. 转换边界

- `AGENTS.md` 的层级作用域必须保留，不能压平成无范围文本。
- Codex Plugin 中的 app、tool runtime、marketplace metadata 和授权状态不是
  Canonical Capability，进入 未由 Jue 管理的目标原生字段 或 Artifact 生成。
- 同一层同时存在多种 hook 表达时必须选择单一托管表示，不能重复注册。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read | Implemented | `packages/ai-jue-adapter-codex/src/read.ts` |
| Write | Implemented | `packages/ai-jue-adapter-codex/src/write.ts`，经 Core 执行器驱动，`jue apply --adapter codex --dry-run/--check` 实测通过 |
| Artifact | Implemented | project 与 Plugin（`.codex-plugin/plugin.json`）两种已实现 |
| Confirm | Implemented | Plugin 走真实 `codex plugin marketplace add`/`plugin add`/`plugin list --json`（`scripts/verify-codex-native.js` 可重放）；project 无原生校验工具，如实返回 `unconfirmed`（诚实降级，非缺口） |
