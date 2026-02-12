# 创建预设 (Preset)

`ai-jue` 的核心是可复用的预设生态。一个预设是一个独立 npm 包，用来封装团队可复用的 AI 能力资产。

## 快速创建

```bash
npx jue create-preset myteam
```

这会生成 `jue-preset-myteam` 目录。

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
    ├── gemini/
    └── cursor/
```

说明：

- `AGENTS.md`：全局系统上下文与强约束
- `skills/`：技能资产
- `commands/`：自定义命令
- `rules/`：项目规则
- `agents/`：自定义代理
- `hooks/`：生命周期钩子
- `tools/<tool>/`：工具特定配置

## 与 `.ai` 的关系

预设目录与本地 `.ai/` 目录保持同构，便于“先在项目沉淀，再打包发布”。

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
