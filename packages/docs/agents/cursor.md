# Cursor

> Jue 状态：Read、Write、Artifact（project 与 Plugin 两种）、Confirm 均为
> Implemented（`packages/ai-jue-adapter-cursor/`）。Plugin 无官方 headless
> 校验 CLI，`confirm()` 对 project 与 plugin 均返回 `unconfirmed`，plugin 附带
> 结构证据（诚实降级，非缺口）。`adapter-creator` 以
> `packages/ai-jue-adapter-cursor/src/capabilities/layout.ts` 为合同写出
> project/plugin 双布局。
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

## 3. 转换边界

- Skills / Agents / Commands 保留 YAML frontmatter（`name`、`description`）。
- Project hooks 写 `{ version: 1, hooks }`；Plugin hooks 写 `{ hooks }`（无 version）。
- Hooks 事件名：Canonical PascalCase → Cursor camelCase。
- MCP command 型 server 自动补 `type: "stdio"`。
- 空 hooks / 空 mcp 不写文件。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read | Implemented | project 与 plugin 自动检测 |
| Write | Implemented | `--artifact plugin` 可用 |
| Artifact | Implemented | project 与 Plugin 均已实现 |
| Confirm | Implemented | 无原生 CLI；返回 `unconfirmed` |

`fixtures/failures/` 提供脱敏安全合同：字面量 MCP env 拒绝、hook 路径穿越拒绝、未知 hook 事件透传。
OpenClaw `compatible-bundle` 可通过显式 `tools.openclaw.bundleFormat: "cursor"`
复用本 Adapter 的 plugin 布局。

## 5. 后续工作（GitHub Issues）

[JUE-304](../developer/delivery-plan.md) 已完成 project/plugin 正反转。下列项**不在 MVP 范围**，由独立 issue 跟踪，Agent 实施前先读对应 issue 全文：

| Issue | 范围 |
| --- | --- |
| [#8](https://github.com/zenHeart/ai-jue/issues/8) | `.cursor-plugin/marketplace.json`（Team marketplace 索引） |
