# OpenClaw

> Jue 状态：Read、Write、Confirm 均已实现（JUE-302，
> `packages/ai-jue-adapter-openclaw/`）；Artifact 仅实现单一
> per-workspace 目录形态，OpenClaw 没有可安装的 Plugin/Bundle 聚合体
> （见下方"官方能力表面"实测结论，修正了本页此前假设的 native
> plugin/compatible bundle 双形态）。`capabilities` 如实声明
> `rules/commands/agents/mcp: "degraded"` 四个边界
>
> 官方依据：[Capabilities Overview](https://docs.openclaw.ai/tools)、
> [Plugin Bundles](https://docs.openclaw.ai/plugins/bundles)、
> [Plugin Manifest](https://docs.openclaw.ai/plugins/manifest)

## 1. 官方能力表面

经 JUE-302 对真实 `~/.openclaw/workspace-jue-probe/` 与
`~/.openclaw/openclaw.json` 的直接读取核验：OpenClaw 的项目级（workspace）
表面只有 `AGENTS.md`（共享指令）、`skills/<name>/SKILL.md`（一层，非嵌套）
与 `hooks/<name>/HOOK.md`+`handler.js`。不存在 per-workspace 的
`commands/`/`agents/` 目录：`openclaw.json` 顶层的 `commands` 键配置的是
OpenClaw 自身的原生 shell 命令行为（`commands.native`/`commands.restart`
等），不是用户可编写的 slash-command；`openclaw agents add/list/delete`
管理的是 user home 下 `~/.openclaw/agents/<name>/` 的隔离运行时环境，不是
项目内文件。MCP 配置全局唯一位于 `~/.openclaw/openclaw.json`
的 `mcp.servers`，没有项目级文件。OpenClaw 没有 Plugin 或 Bundle 一类的可
安装聚合 Artifact——项目级配置就是唯一的原生 Artifact 形态。

## 2. 理想 Jue 映射

| Canonical / Adapter 职责 | OpenClaw |
| --- | --- |
| `context.global` | `AGENTS.md`（managed block） |
| `skills` | `skills/<name>/SKILL.md`（一层） |
| `hooks` | `hooks/<name>/HOOK.md` + `handler.js` |
| `commands` / `agents` / `mcp.servers` | 均为诚实 `degraded`：无 per-workspace 承载面，读写均为 no-op（避免误写用户全局 `openclaw.json`） |
| target-specific settings | `tools.openclaw` |
| Artifact | project/workspace 目录（无 Plugin/Bundle 聚合体） |
| Confirm | `openclaw --profile <isolated> config validate --json` |

## 3. 转换边界

- `commands`/`agents`/`mcp` 三类的 write 均为 no-op：OpenClaw 没有对应的
  per-workspace 原生承载面，写入会误改用户全局配置，因此选择诚实
  `degraded` 而非伪造支持。
- Jue 不从普通 skill 或 rule 推断可执行代码；OpenClaw 也没有暴露这样的
  Plugin 加载机制供 Adapter 生成。
- hooks 的 `HOOK.md` frontmatter 用 `metadata.openclaw.events` 数组表达触发
  事件，与 Claude/Codex 的扁平事件名字段形状不同，按目标原生形状手写解析。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read | Implemented | JUE-302，`packages/ai-jue-adapter-openclaw/src/read.ts` |
| Write | Implemented | JUE-302，经 Core 执行器驱动，`jue apply --adapter openclaw --dry-run/--check` 已实测通过 |
| Artifact | Partial | 仅 workspace 目录形态；OpenClaw 本身没有 Plugin/Bundle 概念，非本 Adapter 缺口 |
| Confirm | Implemented | 真实 `openclaw --profile <isolated> config validate --json`（`scripts/verify-openclaw-native.js` 可重放）；vitest worker 内调用会产生空 stdout 的实测怪癖，因此合同套件内不调用 `confirmNatively`，原生确认放在独立脚本 |
