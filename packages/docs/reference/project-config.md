# 项目配置 Reference

> [!NOTE]
> `targets.<adapter>` 的 `artifact`、`enabled` 与 `scope` 已进入 apply 选择流程（与 CLI
> `--artifact` 组合，见 RFC-0002）。Artifact scope 当前以 project 执行路径为准；
> local/user 选择会在写入前返回明确的 scope 错误。

项目唯一配置文件是根目录 `ai.config.js`。它选择 Preset、Extension 和 Target，并
提供项目最高优先级覆盖；Preset 包的 `package.json#ai` 是另一种容器，见
[Preset Manifest](preset-manifest.md)。

```js
export default {
  presets: ["base", "team"],
  capabilities: {},
  extensions: ["jue-extension-openclaw"],
  targets: {
    codex: { artifact: "auto" },
    openclaw: { artifact: "compatible-bundle" }
  },
  context: { global: "Project-specific constraints." },
  skills: {},
  agents: {},
  commands: {},
  rules: {},
  hooks: {},
  mcp: { servers: {} },
  tools: { codex: {}, openclaw: {} },
  language: "zh"
};
```

## 顶层字段

| 字段 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `presets` | `string[]` | `[]` | 有序 Preset 引用 |
| `capabilities` | `Record<string, CapabilityRef>` | `{}` | 外部 Capability 叶子 |
| `extensions` | `string[]` | `[]` | 显式信任并加载的 Extension 包 |
| `targets` | `Record<string, TargetSelection>` | `{}` | 目标与 Artifact 选择 |
| `context.global` | `string` | `""` | 项目最高优先级上下文 |
| `skills` | `Record<string, Skill>` | `{}` | 内联 skill 覆盖 |
| `agents` | `Record<string, Agent>` | `{}` | 内联 agent 覆盖 |
| `commands` | `Record<string, Command>` | `{}` | 内联 command 覆盖 |
| `rules` | `Record<string, Rule>` | `{}` | 内联 rule 覆盖 |
| `hooks` | `Record<string, Hook>` | `{}` | 内联 hook 覆盖 |
| `mcp.servers` | `Record<string, McpServer>` | `{}` | MCP server |
| `tools` | `Record<string, unknown>` | `{}` | target-specific settings |
| `language` | `"zh" \| "en"` | `"en"` | 生成内容语言 |

未知字段失败。

## `TargetSelection`

| 字段 | 类型 | 默认值 | 规则 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | `false` 时跳过自动发现与 `--all`；显式 `--adapter` 仍按用户选择执行 |
| `artifact` | `string \| "auto"` | `"auto"` | 必须由 Adapter 声明 |
| `scope` | `"project" \| "local" \| "user"` | `"project"` | `project` 使用当前 Artifact 根；local/user 选择在写入前返回 scope 错误 |

`auto` 先调用 Adapter 的布局检测复用已被 Jue 管理的现有 Artifact，再选择 Adapter
唯一默认值；检测结果进入 Artifact 转换环境，不进入 Canonical DSL。

## Extension 加载

安装依赖不等于信任。只有 `extensions` 显式列出的包才加载可执行入口。Adapter
内置于 Jue 发行包时不需要重复声明。Extension 请求的实际副作用由 `apply` 在
执行前逐项展示和授权。

## 合并顺序

低到高：

1. `presets` 按数组顺序递归展开；
2. 项目 `capabilities`；
3. 项目 `.ai/`；
4. 根 `AGENTS.md`；
5. 项目内联 Canonical 字段；
6. 将 `tools.<target>` 作为当前目标的独立 Adapter 配置。

`context.global` 分层追加；结构化能力按 ID 深合并；类型冲突失败；每次覆盖记录
provenance。Target、Extension、Artifact 选择和 `tools.<target>` 不进入
Canonical DSL。

## 配置发现与错误

Core 只从 `--config` 或 `<cwd>/ai.config.js` 加载项目配置。配置加载失败、
未知字段、重复 ID、无效 Target、Extension API 不兼容均退出 `1`，且不得部分
执行 `apply`。
