# 创建预设 (Preset)

`ai-jue` 的核心是可复用的预设生态。一个预设是一个独立 npm 包，用来封装团队可复用的 AI 能力资产。

## 快速创建

```bash
npx jue create-preset myteam
```

这会生成 `jue-preset-myteam` 目录。

> 当前实现说明：`create-preset` 命令会生成 `AGENTS.md`、`commands/`、`rules/`、`skills/`、`agents/`、`hooks/`、`tools/`，以及一个 `commands/example/prompt.md` 示例命令。它当前不会自动生成 `tools/gemini/`、`tools/cursor/` 子目录。

## 目录协议（推荐）

遵循最小知识原则，优先复用主流工具常见组织方式：

```text
jue-preset-myteam/
├── package.json
├── README.md
├── AGENTS.md
├── skills/
├── commands/
├── rules/
├── agents/
├── hooks/
└── tools/
```

说明：

- `AGENTS.md`：全局系统上下文与强约束
- `skills/`：技能资产
- `commands/`：自定义命令
- `rules/`：项目规则
- `agents/`：自定义代理
- `hooks/`：生命周期钩子
- `tools/<tool>/config.json`：当前 loader 正式读取的工具特定配置入口

## 与 `.ai` 的关系

预设目录与本地 `.ai/` 目录在核心能力目录上保持同构，便于“先在项目沉淀，再打包发布”。

当前待收口说明：

- `hooks/` 的目录协议仍偏脚本型输入，还未完全升级到结构化 hooks
- `tools/<tool>` 当前在实现上等价于 `tools/<tool>/config.json`

## 预设嵌套（Preset 依赖 Preset）

可在 preset 的 `package.json` 中声明依赖其他 preset（类似 eslint extends），无需用户在项目侧重复声明：

```json
{
  "name": "jue-preset-internal",
  "ai": {
    "presets": ["base"]
  }
}
```

规则：

- `ai.presets`（或 `jue.presets`）支持 `base` 或完整包名 `jue-preset-base`
- 加载顺序为“先依赖、后自身”
- 同名资产冲突时，自身 preset 覆盖依赖 preset
- 检测到循环依赖时终止递归并给出错误提示

## 发布

```bash
npm publish
```

通常不需要构建步骤，预设按文件资产直接消费。

补充说明：

- `create-preset` 当前生成的 `package.json` 仍带有 `main: "index.js"` 字段，这是模板残留而不是 loader 必需项
- 下一轮计划会将脚手架模板进一步收口到“仅反映实际消费结构”
