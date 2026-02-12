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

## 常用命令

```bash
npx jue init
npx jue apply
npx jue apply --watch
npx jue list
npx jue check
npx jue validate
npx jue create-preset <name>
```

## License

[MIT](LICENSE)
