# Claude Code

> Jue 状态：Read、Write、Artifact、Confirm 均为 Implemented。Read/Write 为
> Done（JUE-106/107）；project 与 Plugin 两种 Artifact 已实现（Marketplace
> 聚合索引明确排除，见 adapter-standardization.md）；Core
> `apply`/`--dry-run`/`--check` 已实现（JUE-108）；R1 全链路（fixture→
> Canonical→Artifact→原生确认，含 headless 真实调用与批次回滚）已用一条命令
> 端到端重放通过（JUE-109/110）；`confirm()` 已导出并组装为
> `defineExtension()`/`Adapter`（JUE-203）：Plugin 走真实
> `claude plugin validate --strict`，project 无原生校验工具故如实返回
> `unconfirmed`（诚实降级，非缺口）
>
> 官方依据：[Claude Code Plugins](https://code.claude.com/docs/en/plugins)、
> [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)、
> [Skills](https://code.claude.com/docs/en/skills)、
> [Sub-agents](https://code.claude.com/docs/en/sub-agents)、
> [Hooks](https://code.claude.com/docs/en/hooks)、
> [MCP](https://code.claude.com/docs/en/mcp)、
> [Memory](https://code.claude.com/docs/en/memory)、
> [Headless mode](https://code.claude.com/docs/en/headless)
>
> 探测环境：`claude` CLI `2.1.219`（2026-07-26）。

## 1. 官方能力表面

Claude Code 同时支持项目级 `.claude/` 配置与可分发 Plugin。

Plugin manifest（`.claude-plugin/plugin.json`）对 `--plugin-dir` 运行时加载
是可选的：省略时 Claude Code 按目录名自动发现默认组件目录并派生 Plugin 名
（`claude plugin validate` 这条校验路径则要求必须存在 `plugin.json` 或
`marketplace.json`，两条路径的宽松度不同）。Plugin 可承载
`skills/`、`commands/`、`agents/`、`hooks/`（`hooks.json`，形如
`{"hooks": {"<Event>": [...]}}`，也可内联在 manifest 的 `hooks` 键）、
`.mcp.json`、`.lsp.json`（`lspServers`）、`workflows/`、`output-styles/`、
`themes/`、`monitors/monitors.json`、`bin/`、`channels` 和声明式 `userConfig`
（每项需要 `type`/`title`/`description`，通过 `${user_config.KEY}` 注入并以
`CLAUDE_PLUGIN_OPTION_<KEY>` 导出）。Plugin manifest 还可以声明 `dependencies`
（Plugin 间 semver 依赖数组，形如 `["<name>@<range>"]`，安装期拉取另一个
Artifact）。

CLI 生命周期覆盖 `validate`、`install`、`enable`、`disable`、`update`、
`list`、`details`、`init`/`new`、`uninstall`/`remove`、`prune`/`autoremove`、
`tag`、`eval`，以及 `marketplace add/list/remove/update`。

`marketplace.json` 是独立的分发索引文件，可以携带原本属于 Plugin 的字段（例如
一个没有 `plugin.json` 的 Plugin，其 `lspServers` 只出现在 marketplace 条目
里）。Read 方向要还原一个 Plugin 的完整事实面，需要同时读取其 marketplace
条目。

Skill/Command/Agent 三类组件共享同一套 frontmatter 执行语义字段：
`context: fork`、`agent`、`background`、`hooks`、`model`、`effort`、
`disable-model-invocation`、`user-invocable`、`paths`（路径条件加载）。这些
字段让 skill 同时具备 agent 与 hook 的部分能力，边界比 Jue 的六类原子能力更
细。

## 2. 理想 Jue 映射

| Canonical / Adapter 职责 | Claude Code |
| --- | --- |
| `context.global` | `CLAUDE.md`（项目根 `CLAUDE.md`/`.claude/CLAUDE.md`/`CLAUDE.local.md`）；Claude Code 只读取 `CLAUDE.md`，接入根目录 `AGENTS.md` 需要 `CLAUDE.md` 里的 `@AGENTS.md` import |
| `rules` | `.claude/rules/*.md`（`paths` frontmatter 支持路径条件加载，超出 Canonical 现有无条件语义的部分作为目标私有字段保留） |
| `skills` / `commands` | `.claude/skills/*/SKILL.md` 与 `.claude/commands/*.md` 共享同一命名空间：同名时后加载的静默覆盖先加载的，`validate` 不报错 |
| `agents` | `.claude/agents/*.md`（项目）、`~/.claude/agents/*.md`（用户）；Plugin 内为 `agents/` |
| `hooks` | `.claude/settings.json` 的 `hooks` 键，或 Plugin `hooks/hooks.json`／manifest 内联 `hooks` |
| `mcp.servers` | 项目 `.mcp.json`；接受扁平 `{"<name>": {...}}` 与包裹 `{"mcpServers": {...}}` 两种形状，均通过官方校验 |
| target-specific settings | `tools.claude`（`lspServers`、`monitors`、`themes`、`output-styles`、`bin`、`workflows`、`channels`、`userConfig`、`dependencies`） |
| Artifact | project-native 配置，或 Claude Plugin（`.claude-plugin/plugin.json` + 组件目录，manifest 可选） |
| Confirm | `claude plugin validate <path> [--strict]`；headless `system/init`（见 §3） |

## 3. 转换边界

- Read 必须区分三种发现路径：`.claude/` 项目配置、已安装 Plugin root、以及
  `<skills-dir>/<n>/.claude-plugin/plugin.json` 形式的就地发现（不进
  Plugin 缓存，独立于 `plugin install`）。
- Plugin 的 `lspServers`、`monitors`、`themes`、`output-styles`、`bin`、
  `workflows`、`channels`、`userConfig`、`dependencies` 是 Claude Code 私有
  字段，Adapter 原样保留，不进入 Canonical。
- Preset 可以物化为 Plugin，但 Preset 本身不携带 Claude 安装状态；
  Plugin 的 `dependencies`（安装期拉取另一个 Artifact）与 Preset 依赖
  （构建期合并资产）语义不同，不互相映射。
- Plugin 聚合体本身（`plugin.json` 表达身份、版本、依赖与组件路径重定向）
  对应 Jue 的 Artifact，而不是 Capability。
- Plugin scope、依赖、缓存和权限是 Artifact 的安装约束，不是 Capability。
- 作用域优先级：Skill/Agent 是 `managed/enterprise > user > project`；
  Rule 是 `project > user`（`CLAUDE.local.md` 属本地覆盖）；Settings 是
  `managed > CLI > local > project > user`（`permissions` 键按 merge 而非
  override 生效）。MCP 的 `local` scope 写入 `~/.claude.json`，不落在
  `.claude/settings.local.json`；Jue 可写入的仓库内文件只有 `project` scope
  的 `.mcp.json`。

### Headless 原生确认路径

```bash
claude -p "<deterministic task>" --plugin-dir <path> \
  --output-format stream-json --verbose \
  --tools "" --setting-sources ""
```

首行 `system/init` 事件给出 `plugins`、`plugin_errors`、`skills`、
`slash_commands`、`agents`、`mcp_servers`（含 status）的完整清单；此路径也是
manifest-optional 自动发现在运行时确实生效的证据（`plugin-auto-discovered`
形态的目录会以 `<dir>@inline` 形式出现在 `plugins` 里）。**不可加 `--bare`**：
`--bare` 会让 Plugin 的 `agents` 和 `mcp_servers` 从清单中静默消失，只保留
内置项。`claude plugin list`/`claude plugin details` 只能确认已安装 Plugin，
不接受 `--plugin-dir`。

`--tools ""` **不保证零成本**：它只是让本轮没有工具可用，若 prompt 本身不需要
调用工具，模型仍会正常生成回复并产生真实计费（已实测：同样的命令产生了
`total_cost_usd: 0.0394407`）。要真正避免计费，prompt 必须设计成结构上必须依赖
一个已被禁用的工具才能完成，`--tools ""` 本身不会让 CLI 在调用模型前短路。
JUE-109 原生验证前须先确认目标 prompt 确实免费或已获得预算批准。

JUE-109 的实测发现：`--bare` 认证严格要求 `ANTHROPIC_API_KEY` 或经 `--settings`
的 `apiKeyHelper`（不读 OAuth/keychain），且不隔离操作机器上已安装的其余真实
Plugin（`plugins` 清单会连同 fixture 一起出现）；`plugin_errors` 在无错误时是
整个字段缺失，不是空数组。完整证据与可复现脚本见
`packages/ai-jue-adapter-claude/fixtures/README.md`"JUE-109 native usability
verification"一节与仓库根 `scripts/verify-claude-native.js`。JUE-110 用
`scripts/verify-claude-mvp-gate.js` 把同一条 fixture→Canonical→Artifact→原生
确认链路重放为一条可从干净环境重放的命令，见该 README"JUE-110 Claude MVP
Gate"一节。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read | Implemented | JUE-106，见 delivery-plan.md |
| Write | Implemented | JUE-107，见 delivery-plan.md |
| Artifact | Implemented | project 与 Plugin 两种已实现；Marketplace 聚合索引明确排除（非缺口） |
| Confirm | Implemented | `confirm()` 已导出并组装为 `defineExtension()`/`Adapter`（JUE-203）；Plugin 走真实 `plugin validate --strict`（JUE-109 headless 证据）；project 如实返回 `unconfirmed`（诚实降级，非缺口） |
