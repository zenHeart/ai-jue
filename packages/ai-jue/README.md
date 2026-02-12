# ai-jue

<div align="center">

**统一 AI 工程配置入口，沉淀可复用协作资产**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

</div>

## 核心定位

`ai-jue` 解决两类问题：

1. 配置碎片化：不同 AI 工具配置分散、维护成本高。
2. 经验碎片化：Prompt/Skills/规则难以结构化沉淀和复用。

## 最小可用

```bash
npm install -D ai-jue jue-preset-react
npx jue apply
```

默认可生成：

- `CLAUDE.md`
- `.cursor/rules/agents.mdc`
- `.cursor/rules/*.mdc`
- `.gemini/settings.json`
- `.github/copilot-instructions.md`

## 目录与概念（最小知识原则）

- 项目根目录 `AGENTS.md`：存在即自动注入全局上下文
- `AGENTS.md`：全局上下文
- `skills/`：技能资产
- `commands/`：命令资产
- `rules/`：规则资产
- `agents/`：代理资产（规范名称）
- `hooks/`：钩子资产
- `tools/<tool>/`：工具私有配置
- `.ai/`：本地资产工作区
- `ai.config.js`：统一配置入口

## 预设嵌套

- preset 可在自身 `package.json` 中通过 `ai.presets`（或 `jue.presets`）声明依赖 preset。
- 加载顺序：先依赖、后自身；自身覆盖依赖同名资产。
- 例如 `internal` 可声明依赖 `base`，用户只需配置 `preset: "internal"`。

## 常用命令

```bash
npx jue init
npx jue apply                                  # 未传参时自动识别 .cursor/.gemini/.claude/.github 等痕迹
npx jue apply --adapter cursor --adapter gemini # 仅执行白名单适配器
npx jue apply -a                               # 执行全部已发现适配器（等同 --all）
npx jue apply --watch
npx jue list
npx jue check
npx jue validate
npx jue create-preset <name>
```

## apply 适配器选择规则

- `jue apply`：自动识别当前目录中的工具痕迹，执行匹配适配器
- `jue apply --adapter ...`：只执行显式指定的适配器
- `jue apply -a` / `jue apply --all`：执行全部已发现适配器
- 当未传参且未识别到工具痕迹时，不会盲目执行全部适配器，会提示用户显式选择

## License

[MIT](LICENSE)
