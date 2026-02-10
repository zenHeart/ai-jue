# ai-jue

<div align="center">

**重塑 AI 协作范式：让碎片化的开发经验，沉淀为标准化的项目资产**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

标准化项目的 AI 能力（Prompt、Skills、MCP Server），自动适配 Claude Code / Cursor / Gemini / Copilot 等编辑器。

[**📖 为什么叫 ai-jue (AI 诀)？**](#为什么叫-ai-jue-ai-诀)

```bash
npm install -D ai-jue jue-preset-react
npx jue apply
```

</div>

---

## 为什么叫 ai-jue (AI 诀)？

**“诀” (jué)**，在中文语境里代表着高浓度的知识沉淀与极其高效的操作指引：

- **口诀 (Mnemonic)**：将复杂的工程指令化繁为简，易于记忆与传播。
- **秘诀 (Secret Recipe)**：代表着一流开发者在特定领域沉淀下来的独到 AI 互动策略。
- **诀窍 (Knack)**：是那些能让 AI 表现从“平庸”跨越到“卓越”的关键资产。

项目命名为 **ai-jue**，寓意着它不仅是一个配置转换工具，更是一个**“AI 经验过滤器”**。它将开发者脑海中零散的、碎片化的灵感，提炼为一套套结构化的“AI 秘诀（Presets）”，让这些高质量的协作策略得以在不同项目间无损流转。

---

## 为什么需要 ai-jue？

1. **配置碎片化 (Configuration Fragmentation)**
    - **问题**: 每个 AI 编辑器都有独立配置文件（`.gemini/`, `CLAUDE.md`, `.cursor/rules/` 等）。跨项目、跨工具维护这些零散配置非常繁琐。
    - **解法**: 提供统一入口 `ai.config.js`，一次配置，自动生成各编辑器配置文件。

2. **经验碎片化 (Experience Fragmentation)**
    - **问题**: 高价值 AI 经验（优质 Prompt、Skills）大多散落在个人笔记中，无法结构化沉淀。
    - **解法**: 通过 `.ai` 目录实现**配置自循环**。在项目中积累的资产天然沉淀在 `.ai/`，随时可通过 `jue create-preset` 打包为通用预设发布。

---

## 快速开始

### 1. 安装

```bash
npm install -D ai-jue jue-preset-react
```

### 2. 创建配置

```javascript
// ai.config.js
export default {
  preset: 'react'
}
```

### 3. 应用配置

```bash
npx jue apply
```

完成！`ai-jue` 会自动为各编辑器生成对应的配置文件：

- ✓ `CLAUDE.md` — Claude Code
- ✓ `.cursor/rules/*.mdc` — Cursor
- ✓ `.gemini/settings.json` — Gemini CLI

---

## 核心功能

- 🎯 **多预设组合**：支持 `presets: ['base', 'react', 'typescript']`。
- 📁 **本地资产扩展**：通过 `.ai` 目录添加项目特有的 Prompt 和 Skills。
- 🔌 **MCP Server 统一分发**：全局/项目级 MCP 节点一键配置同步。
- 👀 **Watch 模式**：监听配置变化实时自动生成。
- 🛡️ **智能共存**：只更新标记区块，保留你的手动修改。

---

## 常用命令

```bash
npx jue init              # 交互式初始化配置
npx jue apply             # 生成/应用 AI 配置文件
npx jue apply --watch     # 监听变化自动同步
npx jue create-preset <n> # 初始化一个新的预设项目
npx jue list              # 查看当前生效的预设和资产
```

---

## License

[MIT](LICENSE)
