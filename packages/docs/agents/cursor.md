# Cursor

> Jue 状态：Read、Write、Artifact（project 与 Plugin 两种）、Marketplace
> index、Confirm 均为
> Implemented（`packages/ai-jue-adapter-cursor/`）。Plugin 无官方 headless
> 校验 CLI，`confirm()` 对 project 与 plugin 均返回 `unconfirmed`，plugin 附带
> 结构证据（诚实降级，非缺口）。
>
> 官方依据：[Cursor Rules](https://docs.cursor.com/context/rules)、
> [Agent Skills](https://docs.cursor.com/context/skills)、
> [Subagents](https://docs.cursor.com/context/subagents)、
> [Hooks](https://docs.cursor.com/context/hooks)、
> [MCP](https://docs.cursor.com/context/mcp)、
> [Plugins](https://cursor.com/docs/plugins#creating-plugins)

## 1. 官方能力表面

### 1.1 Project（项目树）

根目录 `AGENTS.md`、`.cursor/rules/*.mdc`、`.cursor/commands/*.md`、
`.cursor/skills/<name>/SKILL.md`、`.cursor/agents/<name>.md`、
`.cursor/hooks.json`、`.cursor/mcp.json`，以及 `.cursor/settings.json`、
`.cursorignore`、`.cursorindexingignore`。

### 1.2 Plugin（可分发 Bundle）

`.cursor-plugin/plugin.json` manifest 加根级 `rules/`、`skills/`、`agents/`、
`commands/`、`hooks/hooks.json`、`mcp.json`。本地测试：
`~/.cursor/plugins/local/<name>` + Reload Window。

### 1.3 Marketplace（多 Plugin 仓库索引）

仓库根目录 `.cursor-plugin/marketplace.json` 由
`tools.cursor.marketplace` 生成。2026-08-20 对照
[Cursor Plugins Reference](https://cursor.com/docs/reference/plugins) 与
[官方 plugin-template](https://github.com/cursor/plugin-template) 核验的字段为：

- `name`：小写 kebab-case marketplace 名；
- `owner.name`：必需的所有者显示名，`owner.email` 可选；
- `metadata.description`、`metadata.version`、`metadata.pluginRoot`：可选元数据；
- `plugins[]`：1–500 项；Jue 的可移植子集要求唯一 `name` 与本地相对字符串
  `source`；
- `plugins[]` 可选元数据：`description`、语义化 `version`、`author`、
  `homepage`、`repository`、`license`、`keywords`、`logo`（相对路径或 HTTP(S)
  URL）、`category`、`tags`；
- `plugins[]` 组件字段：`skills`、`rules`、`agents`、`commands` 接受相对路径或
  相对路径数组，`hooks`、`mcpServers` 接受相对路径或 JSON 对象，`variables`
  接受 JSON 对象。凭据值使用 `${VAR}` 占位符。

Jue 写入前验证每个本地 source 目录、其 `.cursor-plugin/plugin.json` 与同名
manifest 的索引关系。每个子 Plugin 的 Capability 由其自身 Artifact 独立读取。

## 2. 理想 Jue 映射

| Canonical / Adapter 职责 | Project | Plugin |
| --- | --- | --- |
| manifest | — | `.cursor-plugin/plugin.json` |
| `context.global` | 根目录 `AGENTS.md`（managed block） | 不映射 |
| `rules` | `.cursor/rules/*.mdc` | `rules/*.mdc` |
| `commands` | `.cursor/commands/*.md` | `commands/*.md` |
| `skills` | `.cursor/skills/*/SKILL.md` | `skills/*/SKILL.md` |
| `agents` | `.cursor/agents/*.md` | `agents/*.md` |
| `hooks` | `.cursor/hooks.json` | `hooks/hooks.json` |
| `mcp.servers` | `.cursor/mcp.json` | `mcp.json` |
| target-specific settings | `tools.cursor` | 不映射 |
| `variables` | — | `plugin.json#variables`（透传） |
| Confirm | `unconfirmed` | `unconfirmed`（结构证据） |

Marketplace index 位于两种布局之上的仓库根，由 `tools.cursor.marketplace` 写入
`.cursor-plugin/marketplace.json`，不改变 project/Plugin 的 Capability 路径。

## 3. 转换边界

- Skills / Agents / Commands 保留 YAML frontmatter（`name`、`description`）。
- Project hooks 写 `{ version: 1, hooks }`；Plugin hooks 写 `{ hooks }`（无 version）。
- Hooks 事件名：Canonical PascalCase → Cursor camelCase。
- MCP command 型 server 自动补 `type: "stdio"`。
- 空 hooks / 空 mcp 不写文件。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read | Implemented | project/plugin 自动检测；marketplace index 做结构与 source-manifest 校验 |
| Write | Implemented | `--artifact plugin` 与 `tools.cursor.marketplace` 可用 |
| Artifact | Implemented | project 与 Plugin 均已实现 |
| Confirm | Implemented | 无原生 CLI；返回 `unconfirmed` |

## 5. 后续工作（GitHub Issues）

[JUE-304](../developer/delivery-plan.md) 已完成 project/plugin 正反转。下列项**不在 MVP 范围**，由独立 issue 跟踪，Agent 实施前先读对应 issue 全文：

| Issue | 范围 |
| --- | --- |
| [#9](https://github.com/zenHeart/ai-jue/issues/9) | OpenClaw `compatible-bundle` 以 Cursor 布局为第三基底（[RFC-0002](../developer/rfcs/0002-plugin-artifact-apply.md) 已知边界 3） |
| [#10](https://github.com/zenHeart/ai-jue/issues/10) | `adapter-creator` 补充 Cursor 双布局实现模式 |
| [#11](https://github.com/zenHeart/ai-jue/issues/11) | failure fixtures + 安全合同样本（与 Claude [JUE-105](../developer/delivery-plan.md) 同级） |
