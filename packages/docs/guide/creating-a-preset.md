# 创建 Preset

Preset 是声明式 Capability 集合，不包含可执行 Extension 或目标安装状态。

## 1. 创建目录

```text
jue-preset-team/
├── package.json
├── README.md
├── AGENTS.md
├── skills/
├── commands/
├── rules/
├── agents/
├── hooks/
├── mcp.json
└── tools/
```

按需创建目录，不生成空能力或示例噪声。

## 2. 编写 manifest

```json
{
  "name": "jue-preset-team",
  "version": "1.0.0",
  "files": [
    "README.md",
    "AGENTS.md",
    "skills",
    "commands",
    "rules",
    "agents",
    "hooks",
    "mcp.json",
    "tools"
  ],
  "ai": {
    "presets": ["base"],
    "capabilities": {}
  }
}
```

完整字段见 [Preset Manifest Reference](../reference/preset-manifest.md)。

## 3. 添加能力

- 只属于当前 Preset：直接写入对应能力目录。
- 被多个 Preset 共用：通过 `ai.capabilities` 引用单一来源。
- 第三方 skill/MCP：使用 外部 Capability 引用与显式 format。
- 目标私有配置：写入 `tools/<target>/config.json`。
- 运行时代码：不要放进 Preset；创建独立 Jue Extension。

## 4. 验证和打包

发布前用 `jue validate` 校验项目配置（`presets` 数组、预设安装与
`extends` 路径），并用 `npm pack` 预览包内容：

```bash
jue validate
npm pack --dry-run
```

验证必须覆盖 manifest、Canonical 目录、嵌套依赖、循环、路径穿越、凭据和敏感
信息。Pack 输出文件 inventory；不得因为文件存在于仓库就自动进入包。

## 5. 消费

```js
export default {
  presets: ["team"],
  targets: {
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" }
  }
};
```

Preset 不因目标不同而复制。Artifact 由对应 Adapter 选择和生成。
