# OpenClaw

> Jue 状态：Read、Write、Confirm 均已实现（JUE-302，
> `packages/ai-jue-adapter-openclaw/`）；**workspace** Artifact 已落地。  
> **Compatible bundle**（安装 Claude/Codex/Cursor 布局）见 RFC-0002，实现上应
> **委托**已有 Claude/Codex plugin writer，而不是发明第三种目录。  
> Native OpenClaw plugin（`openclaw.plugin.json` + 进程内运行时）不在 Canonical
> 能力包转换范围内。  
> `capabilities` 对 workspace 路径如实声明 `rules/commands/agents/mcp: "degraded"`。
>
> 官方依据：[Plugin bundles](https://docs.openclaw.ai/plugins/bundles)、
> [Plugins](https://docs.openclaw.ai/tools/plugin)、
> [Building plugins](https://docs.openclaw.ai/plugins/building-plugins)、
> [Plugin Manifest](https://docs.openclaw.ai/plugins/manifest)

## 1. 官方能力表面（两层）

### 1.1 Workspace（项目树，JUE-302 已核验）

`AGENTS.md`、`skills/<name>/SKILL.md`、`hooks/<name>/HOOK.md`+`handler.js`。  
无 per-workspace `commands/`/`agents/`；`openclaw agents *` 管理的是
`~/.openclaw/agents/<name>/` 运行时；MCP 在全局 `openclaw.json`。

### 1.2 可安装 Plugin（官方现文档）

| 格式 | 标记 | 用途 |
| --- | --- | --- |
| Compatible bundle | `.claude-plugin/` / `.codex-plugin/` / `.cursor-plugin/`（或 Claude 默认布局） | 内容包；映射 skills/hooks/MCP 等；**窄信任边界** |
| Native plugin | `openclaw.plugin.json` + `package.json#openclaw.extensions` | 进程内工具/通道/provider |

安装：

```bash
openclaw plugins install ./my-bundle
openclaw plugins list    # bundles 显示 Format: bundle + Bundle format
openclaw plugins inspect <id>
```

检测优先：若同时存在 native 与 bundle 标记，走 **native**。

Bundle 映射要点（官方）：

- skills：全格式  
- Claude/Cursor `commands/` → 当 skill 根  
- hooks：**仅** OpenClaw 式 `HOOK.md`+handler（今日主要是 Codex 兼容包）可执行；Claude `hooks/hooks.json` detect-only  
- agents：Claude/Cursor 多为 detect-only  
- MCP：合并进 embedded settings（stdio/HTTP）

## 2. 理想 Jue 映射

| Canonical / Adapter 职责 | OpenClaw |
| --- | --- |
| `context.global` | Workspace：`AGENTS.md`（managed block） |
| `skills` | Workspace：`skills/<name>/`；Bundle：随 Claude/Codex plugin 布局 |
| `hooks` | Workspace：`HOOK.md`+`handler.js`；Bundle：优先 Codex 基底才能执行 |
| `commands` / `agents` / `mcp.servers` | Workspace：诚实 `degraded`（无安全的项目级写入面）；Bundle：按上表映射或 detect-only |
| Artifact | `workspace` \| `compatible-bundle`（RFC-0002） |
| Confirm | Workspace：`openclaw --profile … config validate`；Bundle：`plugins install` + `inspect`（Format: bundle） |

## 3. 转换边界

- Workspace 路径不写全局 `openclaw.json` MCP（避免误改用户环境）。
- `compatible-bundle` **不得**新造目录方言；委托 Claude/Codex `artifactKind: "plugin"`。
- 不为 Canonical 能力包生成 native `openclaw.plugin.json` 运行时插件（成本与信任模型都不匹配）。
- hooks 若需在 OpenClaw 执行，bundle 基底选 Codex，而非 Claude。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read / Write / Confirm（workspace） | Implemented | JUE-302 |
| Artifact `compatible-bundle` | Planned（RFC-0002 / #3） | 委托 Claude/Codex plugin writer + install 确认 |
| Native plugin Artifact | Out of scope | 非 Canonical 包路径 |
