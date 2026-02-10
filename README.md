# ai-jue

<div align="center">

**重塑 AI 协作范式：让碎片化的开发经验，沉淀为标准化的项目资产**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml/badge.svg)](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml)

标准化项目的 AI 能力（Prompt、Skills、MCP Server），自动适配 Claude Code / Cursor / Gemini / Copilot 等编辑器。

[**📖 为什么叫 ai-jue (AI 诀)？**](#为什么叫-ai-jue-ai-诀)

```bash
npm install -D ai-jue jue-preset-react
npx jue apply
```

</div>

---

<!-- TABLE OF CONTENTS -->
<details>
<summary>📖 目录</summary>

- [ai-jue](#ai-jue)
  - [为什么叫 ai-jue (AI 诀)？](#为什么叫-ai-jue-ai-诀)
  - [为什么需要 ai-jue？](#为什么需要-ai-jue)
  - [快速开始](#快速开始)
    - [1. 安装](#1-安装)
    - [2. 创建配置](#2-创建配置)
    - [3. 生成配置文件](#3-生成配置文件)
  - [核心功能](#核心功能)
    - [🎯 多预设组合](#-多预设组合)
    - [📁 本地资产扩展](#-本地资产扩展)
    - [🔌 MCP Server 统一分发](#-mcp-server-统一分发)
    - [👀 Watch 模式](#-watch-模式)
    - [🛡️ 智能共存](#️-智能共存)
  - [官方预设](#官方预设)
  - [工作原理](#工作原理)
  - [CLI 命令](#cli-命令)
  - [创建自己的预设](#创建自己的预设)
  - [发布流程](#发布流程)
  - [路线图](#路线图)
  - [贡献](#贡献)
  - [License](#license)

</details>

---

## 为什么叫 ai-jue (AI 诀)？

**“诀” (jué)**，在中文语境里代表着高浓度的知识沉淀与极其高效的操作指引：

- **口诀 (Mnemonic)**：将复杂的工程指令化繁为简，易于记忆与传播。
- **秘诀 (Secret Recipe)**：代表着一流开发者在特定领域（如 React、Rust）沉淀下来的独到 AI 互动策略。
- **诀窍 (Knack)**：是那些能让 AI 表现从“平庸”跨越到“卓越”的关键资产。

项目命名为 **ai-jue**，寓意着它不仅是一个配置转换工具，更是一个**“AI 经验过滤器”**。它将开发者脑海中零散的、碎片化的灵感，提炼为一套套结构化的“AI 秘诀（Presets）”，让这些高质量的协作策略得以在不同项目间无损流转。

---

## 为什么需要 ai-jue？

`ai-jue` 项目的诞生，是为了解决 AI 辅助开发时代下，开发者经验无法有效沉淀、复用和共享的核心痛点。

1. **配置碎片化 (Configuration Fragmentation)**
    - **问题**: 每个 AI 编辑器都有自己独立的配置文件（`.gemini/`, `CLAUDE.md`, `.cursor/rules/` 等）。跨项目、跨工具维护这些零散的配置，繁琐且容易不同步。
    - **解法**: 提供一个统一的入口 `ai.config.js`，一次配置，自动生成各编辑器的配置文件。

2. **经验碎片化 (Experience Fragmentation)**
    - **问题**: 开发者在使用 AI 的过程中积累的高价值经验（优质 Prompt、Skills、上下文指令），大多散落在个人笔记中，无法结构化沉淀，更难以在团队间高效共享和同步。
    - **解法**: 通过 `.ai` 目录实现配置的**自循环**——开发者在项目中积累的 Prompt、Skills 等资产天然以结构化形式沉淀在 `.ai/` 目录中，当积累到一定程度后，可通过 `jue create-preset` 一键打包为 npm 预设包发布，大幅降低从"个人经验"到"团队标准"的发布成本。

**总结：`ai-jue` 的使命是将开发者高价值的"AI 开发能力"进行标准化、工程化和资产化，成为 AI 开发领域的 ESLint。**

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

### 3. 生成配置文件

```bash
npx jue apply
```

完成！ai-jue 会根据项目的 AI 配置策略，自动为各编辑器生成对应的配置文件：

```
✓ CLAUDE.md                          — Claude Code
✓ .cursor/rules/*.mdc                — Cursor
✓ .gemini/settings.json              — Gemini CLI
✓ .github/copilot-instructions.md    — GitHub Copilot
```

---

## 核心功能

### 🎯 多预设组合

```javascript
// ai.config.js
export default {
  presets: ['base', 'react', 'typescript']
}
```

### 📁 本地资产扩展

通过 `.ai` 目录添加团队自定义的 Prompt 和 Skills：

```javascript
// ai.config.js
export default {
  preset: 'react',
  extends: {
    prompts: './prompts/custom-rules.md',
    skills: ['./skills/deploy.md']
  }
}
```

### 🔌 MCP Server 统一分发

```javascript
// ai.config.js
export default {
  preset: 'react',
  mcp: {
    servers: {
      'my-db': { command: 'npx', args: ['@myteam/mcp-server-db'] }
    }
  }
}
```

### 👀 Watch 模式

```bash
npx jue apply --watch
```

### 🛡️ 智能共存

- `.md` 文件：只更新 `<!-- AI-JUE:START -->` 和 `<!-- AI-JUE:END -->` 包围的区块，保留你的手动修改
- `.json` 文件：深度合并，只添加/更新管理的字段

---

## 官方预设

| 预设 | 描述 | 安装 |
|------|------|------|
| **jue-preset-base** | 通用最佳实践（代码审查、Git 规范、错误处理） | `npm i -D jue-preset-base` |
| **jue-preset-react** | React Hooks、组件设计、性能优化 | `npm i -D jue-preset-react` |
| **jue-preset-typescript** | 类型安全、泛型技巧、工具类型 | `npm i -D jue-preset-typescript` |

---

## 工作原理

```
ai.config.js          →  加载预设 & 合并配置  →  适配器插件生成文件
┌──────────────┐       ┌───────────────────┐    ┌──────────────────────┐
│ preset: 'react'│ →  │  ai-jue-core       │ → │ adapter-claude → CLAUDE.md    │
│ mcp: {...}    │      │  (微内核)          │    │ adapter-cursor → .cursorrules │
│ commands: {}  │      │  配置合并 & 路由    │    │ adapter-gemini → settings.json│
└──────────────┘       └───────────────────┘    │ adapter-copilot→ instructions │
                                                 └──────────────────────────────┘
```

> 详细架构见 [architecture.md](packages/docs/guide/architecture.md)

---

## CLI 命令

```bash
npx jue init              # 交互式初始化配置
npx jue apply             # 生成 AI 工具配置文件
npx jue apply --watch     # 监听变化自动重新生成
npx jue check             # 检查预设是否有新版本
npx jue validate          # 校验配置合法性
npx jue list              # 列出已加载的预设和资产
npx jue create-preset <n> # 创建新的预设项目结构
```

---

## 创建自己的预设

```bash
npx jue create-preset my-team-preset
```

生成的预设结构：

```
my-team-preset/
├── package.json
├── prompts/
│   └── agents.md        # 通用提示词
├── skills/
│   └── deploy.md        # 技能定义
└── tools/
    └── meta.json        # 工具配置（MCP 等）
```

发布到 npm 后，团队成员只需：

```bash
npm install -D jue-preset-my-team
# ai.config.js → preset: 'my-team'
npx jue apply
```

> 详细指南见 [creating-a-preset.md](packages/docs/guide/creating-a-preset.md)

---

## 发布流程

本项目采用「本地生成版本与标签 → GitHub Actions 自动发布」模式。

```bash
npm run release
```

该命令自动完成：

1. 基于 `git diff` 检测有变更的包
2. 交互式选择版本策略（patch/minor/major）
3. 生成 CHANGELOG、创建 tag 并推送

推送后 GitHub Actions 自动触发 [release.yml](.github/workflows/release.yml)，使用 npm Trusted Publisher (OIDC) 并行发布所有变更包。

---

## 路线图

- [x] **v0.1** — MVP：`apply` 命令 + 项目自举
- [x] **v0.2** — `init` / `check` / `extends` / 官方预设
- [x] **v1.0** — `create-preset` 命令 + 完整文档
- [x] **v2.0** — `--watch` 模式 + VS Code 扩展
- [ ] **未来** — 可视化配置工具、高级配置语言、更多工具集成

> 完整路线图见 [TODO.md](TODO.md)

---

## 贡献

欢迎贡献！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交修改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

- 🐛 [报告问题](https://github.com/zenHeart/ai-jue/issues)
- 💡 [功能建议](https://github.com/zenHeart/ai-jue/discussions)
- 📦 [创建预设](packages/docs/guide/creating-a-preset.md)

---

## License

[MIT](LICENSE)

<div align="center">

**定义 AI 开发的工程化范式，让一流经验跨越工具与项目的鸿沟** 🚀

</div>
