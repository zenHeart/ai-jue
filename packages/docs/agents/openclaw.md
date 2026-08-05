# OpenClaw

> Jue 状态：Read、Write、Confirm 均已实现（JUE-302，
> `packages/ai-jue-adapter-openclaw/`）；**workspace** 与
> **`compatible-bundle`**（RFC-0002）均已落地。后者复用 Claude/Codex
> plugin writer，并沿用 OpenClaw 官方 Bundle 发现路径。
> OpenClaw native runtime surface 作为 Agent-specific Artifact 表面保留在官方
> 能力表中；Jue 的 Canonical 映射合同集中于 workspace 与 compatible-bundle。
> `capabilities` 对 workspace 路径如实声明 `rules/commands/agents/mcp: "degraded"`。
>
> 官方依据：[Plugin bundles](https://docs.openclaw.ai/plugins/bundles)、
> [Plugins](https://docs.openclaw.ai/tools/plugin)、
> [Building plugins](https://docs.openclaw.ai/plugins/building-plugins)、
> [Plugin Manifest](https://docs.openclaw.ai/plugins/manifest)

## 1. 官方能力表面（两层）

### 1.1 Workspace（项目树，JUE-302 已核验）

`AGENTS.md`、`skills/<name>/SKILL.md`、`hooks/<name>/HOOK.md`+`handler.js`。  
`commands`/`agents` 的运行时入口由 OpenClaw 全局 Agent surface 管理；项目树
包含 `AGENTS.md`、skills 与 hooks，MCP 由全局 `openclaw.json` 管理。

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

Jue 的 compatible-bundle 检测只读取上述 Bundle marker；native runtime surface 由
OpenClaw 官方 loader 独立处理。

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

- Workspace MCP 保持在项目级 Artifact 之外，保护用户的全局 `openclaw.json`。
- `compatible-bundle` 复用 Claude/Codex `artifactKind: "plugin"` 的官方兼容布局。
- Canonical 能力包沿用 Bundle 的窄信任边界；OpenClaw native runtime surface 继续
  由 Agent 官方能力表管理。
- hooks 需要在 OpenClaw 执行时，bundle 基底选 Codex；无 runnable hooks 时使用 Claude 基底。

## 4. 当前差距

| 层级 | 状态 | 缺口 |
| --- | --- | --- |
| Read / Write / Confirm（workspace） | Implemented | JUE-302 |
| Artifact `compatible-bundle` | Implemented | 委托 Claude/Codex `artifactKind: "plugin"`；安装确认依赖本机 `openclaw` CLI（CI 常 skip） |
| Native plugin Artifact | Reference | OpenClaw 官方 runtime surface 与 Canonical bundle surface 分开记录 |
