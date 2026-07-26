# 外部 Capability 引用规范

> 状态：Partial
>
> [!WARNING]
> `source`、`type`、`ref`、`path` 已按本页定义实现，每个引用只解析一个叶
> Capability。`integrity` 字段已可提供，但尚未对远程来源强制要求。当前事实见
> [实现状态](../developer/implementation-status.md)。

`capabilities` 允许项目或 Preset 引用外部的单个 Capability。它是 Canonical DSL
的输入字段，不是新的架构概念，也不支持任意第三方格式转换。

```js
export default {
  capabilities: {
    review: { source: "file:./vendor/review", type: "skill" }
  }
};
```

Preset 在 `package.json#ai.capabilities` 使用相同引用形状。

| 字段 | 必需 | 含义 |
| --- | --- | --- |
| `source` | 是 | `file:`、精确 `npm:`、固定 `github:`；`url:` 为规划 |
| `type` | 是 | 单个 Canonical Capability 类型：`skill`、`agent`、`command`、`rule`、`hook` 或 `mcp` |
| `ref` | GitHub 条件必需 | commit 或不可变 tag |
| `path` | 否 | 来源内安全相对路径 |
| `integrity` | 远程来源必需 | 内容完整性 |

`type` 是 Canonical 类型判别字段，不是可执行扩展点。每个引用只解析一个
Capability；需要引用多个 Capability 时使用 Preset。发布者应先把第三方内容整理
为对应 Canonical 目录格式；Jue 不加载来源中的转换代码或脚本。

解析顺序为递归 Preset、当前包引用、当前包声明式目录、项目 `.ai/` 与内联覆盖。
引用始终是叶子；类型冲突失败并保留来源信息。

`ai-jue.lock` 保存引用 hash、解析版本/ref、内容 hash、type 与 schema 版本。
`--frozen` 禁止隐式刷新，`capability update [id]` 原子更新。路径穿越、未知
type、浮动远程版本、integrity 失败和凭据泄漏必须阻塞。

验收覆盖统一 schema、六种 type、嵌套资源保留、确定性 lock、frozen、
offline、update、缓存损坏和敏感信息脱敏。
