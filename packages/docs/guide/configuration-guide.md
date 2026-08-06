# 项目配置指南

大多数项目只需要选择 Preset 和目标 Agent：

```js
export default {
  presets: ["base", "team"],
  targets: {
    "claude-code": { artifact: "plugin" },
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" },
    hermes: { artifact: "auto" }
  }
};
```

完整字段见 [项目配置 Reference](../reference/project-config.md)。

## 1. 何时增加配置

- 复用能力集合：`presets`。
- 引用单个共享/第三方能力：`capabilities`。
- 选择目标交付形态：`targets.<target>.artifact`。
- 保留目标私有配置：`tools.<target>`。
- 项目最高优先级公共能力：内联 Canonical 字段。

不要用项目配置复制 Preset 正文，也不要在 `tools` 中重新表达已有 Canonical。

## 2. 自动选择

`artifact: "auto"` 按以下顺序：

1. 已存在且 inspect 成功的 Artifact；
2. Adapter 合同默认 Artifact；
3. 仍不唯一则 apply 在写入前失败并列出候选。

自动发现不能隐式执行 install、enable、update、reload 或用户级写入。

## 3. 迁移

```bash
jue apply --adapter codex --dry-run
jue apply --adapter codex
jue apply --adapter codex --check
```

所有 `degraded`、`unsupported` 和 `blocked` 必须在写入
前可见。详情见 [跨 Agent 迁移](migration.md)。
