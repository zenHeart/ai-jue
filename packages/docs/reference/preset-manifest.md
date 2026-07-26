# Preset npm 包约定

Preset 是声明式 Capability 包。包名建议 `jue-preset-<id>`，manifest 位于
`package.json#ai`。

```json
{
  "name": "jue-preset-team",
  "version": "1.0.0",
  "files": ["AGENTS.md", "skills", "commands", "rules", "agents", "hooks", "mcp.json", "tools"],
  "ai": {
    "presets": ["base"],
    "capabilities": {
      "review": {
        "source": "file:../../capabilities/review",
        "type": "skill"
      }
    }
  }
}
```

## `package.json#ai`

| 字段 | 必需 | 类型 | 含义 |
| --- | --- | --- | --- |
| `presets` | 否 | `string[]` | 递归依赖，依赖优先、当前覆盖 |
| `capabilities` | 否 | `Record<string, CapabilityRef>` | 外部叶子引用 |

至少存在一项目录 Capability、`presets` 或 `capabilities`。

## `CapabilityRef`

| 字段 | 必需 | 类型 |
| --- | --- | --- |
| `source` | 是 | `file:` / `npm:` / `github:` |
| `type` | 是 | `skill` / `agent` / `command` / `rule` / `hook` / `mcp` |
| `ref` | 条件 | Git ref |
| `path` | 否 | 来源内相对路径 |

引用是单个 Capability 叶子，不递归展开 Preset，也不返回 Capability 集合。

## 目录清单

| 路径 | Canonical |
| --- | --- |
| `AGENTS.md` | `context.global` |
| `skills/<id>/SKILL.md` | `skills.<id>` |
| `commands/<id>/prompt.md` | `commands.<id>` |
| `rules/<id>/prompt.md` | `rules.<id>` |
| `agents/<id>/prompt.md` | `agents.<id>` |
| `hooks/<id>/index.json` | `hooks.<id>` |
| `mcp.json` | `mcp` |
| `tools/<target>/config.json` | 当前目标的非 Canonical 配置 |

Preset 不包含 Extension 入口、安装状态、凭据、用户配置或目标 Plugin 运行时代码。
`package.json` 是 Preset 的包与配置入口。为保持数据与可执行代码的信任边界，
Preset 与 Extension 分别发布。
