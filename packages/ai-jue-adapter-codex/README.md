# ai-jue-adapter-codex

将解析后的 ai-jue Canonical 配置生成为项目级 Codex 资产。

- 上下文和规则写入根目录 `AGENTS.md` 的 AI-JUE 托管块。
- 技能和命令写入 `.agents/skills/`。
- 自定义 Agent 写入 `.codex/agents/`。
- 项目级 MCP 与受支持的 Codex 设置写入 `.codex/config.toml`。
- Hooks 统一写入 `.codex/hooks.json`，不会同时写入 TOML。Canonical
  的字符串或 `{ script, matcher, tools, timeout, statusMessage }` 会转换为
  Codex 原生的事件数组、matcher group 和 `{ type: "command", command }`
  handler；`async` 没有 Codex 对等语义，会被明确忽略。缺少非空
  `script` 的条目会终止生成，不会写出无效配置。

适配器只接受受支持的项目级字段，不写入凭据、认证状态、Provider
覆盖或用户全局配置。

项目 Hooks 属于可执行代码。Codex 会对项目 Hooks 执行信任审查；生成
配置不代表用户已经授权执行，用户仍须在 Codex 中检查并信任命令。
