# ai-jue

<div align="center">

**重塑 AI 协作范式：让碎片化的开发经验，沉淀为标准化的项目资产**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml/badge.svg)](https://github.com/zenHeart/ai-jue/actions/workflows/ci.yml)

[English](README.en.md) | **简体中文**

标准化项目的 AI 能力（Prompt、Skills、MCP Server），自动适配 Claude Code / Cursor / Gemini / Copilot 等编辑器。

[**📖 为什么叫 ai-jue (AI 诀)？**](#为什么叫-ai-jue-ai-诀)

```bash
npm install -D ai-jue jue-preset-base
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
    - [🧭 最小知识原则（能力目录约定）](#-最小知识原则能力目录约定)
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
npm install -D ai-jue jue-preset-base
```

### 2. 创建配置

```javascript
// ai.config.js
export default {
  preset: 'base'
}
```

### 3. 生成配置文件

```bash
npx jue apply --all
```

首次在新项目执行 `jue apply` 时，如果未检测到 `ai.config.js` / `jue.config.js`（及对应 rc），会先进入初始化引导（类似 `eslint init`），完成最小配置后再继续 apply。
该引导默认不会创建 `.ai` 空目录；`.ai` 仅在后续需要本地资产渐进增强时再创建。

完成！ai-jue 会根据项目的 AI 配置策略，自动为各编辑器生成对应的配置文件：

```
✓ CLAUDE.md / .claude/*              — Claude Code
✓ AGENTS.md / .cursor/*              — Cursor
✓ .gemini/settings.json              — Gemini CLI
✓ .github/copilot-instructions.md    — GitHub Copilot
```

---

## 核心功能

### 🧭 最小知识原则（能力目录约定）

`ai-jue` 的核心设计原则是：尽量复用主流 AI 工具已有习惯，不引入额外心智负担。能力目录采用如下约定：

- 项目根目录 `AGENTS.md`：存在即自动注入全局上下文（零额外配置）
- `skills/`：技能资产（主流规范）
- `AGENTS.md`：系统上下文与强约束（主流规范）
- `commands/`：自定义命令（主流实践）
- `rules/`：项目规则（主流实践）
- `agents/`：自定义代理（规范名称）
- `hooks/`：生命周期钩子（主流实践）
- `tools/<tool>/`：工具特定配置逃生舱（如 `tools/gemini/`、`tools/cursor/`）
- `ai.config.js`：ai-jue 统一配置入口（含 MCP/运行策略）
- `.ai/`：本地资产工作区，支持映射并发布为 preset

术语说明：

- 规范名称统一为 `agents`。

进一步说，`ai-jue` 的核心不是让用户学习一套新的内部模型，而是：

1. 尽量复用主流工具已经存在的实践
2. 把不同来源的配置收拢为一套统一资产
3. 再把这套统一资产分发到不同工具
4. 允许在必要时通过 `tools/<tool>` 保留工具私有逃生舱

因此：

- 新项目可以直接从 `.ai/` 和 `ai.config.js` 开始
- 已有 `.cursor` / `.gemini` / `.claude` 配置的项目，也可以先通过 `jue format` 低成本收回统一资产
- 后续无论扩展新工具还是扩展新通用能力，都尽量不增加用户侧心智负担

### 🎯 多预设组合

```javascript
// ai.config.js
export default {
  presets: ['base', 'my-team-preset']
}
```

多层预设下的 `AGENTS.md` 合并规则：

- 采用分层追加，不做覆盖替换
- 顺序：依赖 preset -> 当前 preset -> `.ai/AGENTS.md` -> 根 `AGENTS.md` -> `ai.config.js.context.global`
- 结构化能力（`rules/commands/...`）仍是对象深合并，后者覆盖前者

统一能力模型的核心输入为：

- `context.global`
- `rules`
- `commands`
- `skills`
- `agents`
- `hooks`
- `mcp.servers`
- `tools.<tool>`

其中：

- `context.global` 采用分层追加
- 结构化能力采用对象深合并
- `hooks` 保留结构化对象，不在核心层提前压平成字符串

### 📁 本地资产扩展

通过 `.ai` 目录添加团队自定义的 Prompt 和 Skills：

```javascript
// ai.config.js
export default {
  preset: 'base',
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
  preset: 'base',
  mcp: {
    servers: {
      'my-db': { command: 'npx', args: ['@myteam/mcp-server-db'] }
    }
  }
}
```

### 👀 Watch 模式

```bash
npx jue apply --all --watch
```

### 🛡️ 智能共存

- `.md` 文件：只更新 `<!-- AI-JUE:START -->` 和 `<!-- AI-JUE:END -->` 包围的区块，保留你的手动修改
- `.json` 文件：深度合并，只添加/更新管理的字段

### 🔄 正反向低成本转换

- 正向：从 `.ai/` / `ai.config.js` 分发到 `.claude`、`.cursor`、`.gemini`、`.github`
- 反向：从已有 `.claude` / `.cursor` / `.gemini` 等配置收敛回 `.ai/`

这使得：

- 新项目可以直接采用统一管理
- 老项目也不需要推倒重来
- 团队资产可以在“项目沉淀 -> preset 发布 -> 多工具分发”之间形成闭环

---

## 官方预设

| 预设 | 描述 | 安装 |
|------|------|------|
| **jue-preset-base** | 通用最佳实践（代码审查、Git 规范、错误处理） | `npm i -D jue-preset-base` |

---

## 工作原理

```
ai.config.js          →  加载预设 & 合并配置  →  适配器插件生成文件
┌──────────────┐       ┌───────────────────┐    ┌──────────────────────┐
│ preset: 'base' │ →  │  ai-jue-core       │ → │ adapter-claude → CLAUDE.md + .claude/* │
│ mcp: {...}    │      │  (微内核)          │    │ adapter-cursor → AGENTS.md + .cursor/* │
│ commands: {}  │      │  配置合并 & 规范化  │    │ adapter-gemini → settings.json│
└──────────────┘       └───────────────────┘    │ adapter-copilot→ instructions │
                                                 └──────────────────────────────┘
```

> 详细架构见 [architecture.md](packages/docs/guide/architecture.md)

---

## CLI 命令

```bash
npx jue init              # 交互式初始化配置
npx jue apply --adapter cursor --adapter gemini --adapter claude  # 仅生成指定适配器
npx jue apply -a          # 生成全部已发现适配器（等同 --all）
npx jue apply             # 未显式传参时，按 .cursor/.gemini/.claude 等痕迹自动识别
npx jue apply --lang zh   # 运行时覆盖语言（等同 AI_JUE_LANG=zh）
npx jue apply --all --watch  # 监听变化自动重新生成（显式适配器）
npx jue check             # 检查预设是否有新版本
npx jue validate          # 校验配置合法性
npx jue list              # 列出已加载的预设和资产
npx jue format            # 将现有工具配置（.cursor/.gemini 等）规整到 .ai 目录
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
├── AGENTS.md            # 全局系统上下文/强约束
├── skills/              # 技能资产
├── commands/            # 自定义命令
├── rules/               # 项目规则
├── agents/              # 自定义代理
├── hooks/               # 生命周期钩子
└── tools/
    ├── gemini/
    └── cursor/          # 工具特定配置（MCP 等）
```

发布到 npm 后，团队成员只需：

```bash
npm install -D jue-preset-my-team
# ai.config.js → preset: 'my-team'
npx jue apply --all
```

> 详细指南见 [creating-a-preset.md](packages/docs/guide/creating-a-preset.md)

---

## 发布流程

本项目采用「本地生成版本与标签 → GitHub Actions 自动发布」模式。

```bash
npm run release
```

`npm run release` 现在会先触发 `prerelease` 钩子，自动执行：

```bash
npm run release-gate:v1.1
```

门禁检查包含：

1. 全仓构建（`npm run build`）
2. 核心配置测试（`packages/ai-jue/test/config.test.ts`）
3. 文档构建（`npm run docs:build`）
4. 包一致性检查（`check-consistency`）
5. base 双语结构检查（`check-base-i18n`）
6. base/internal 自举 smoke（`smoke-apply`）
7. 发布必要文件检查（`release-note.md`、`packages/ai-jue/CHANGELOG.md`）

门禁通过后，`release` 命令继续自动完成：

1. 基于 `git diff` 检测有变更的包
2. 交互式选择版本策略（patch/minor/major）
3. 生成 CHANGELOG、创建 tag 并推送

触发发布的关键条件：

1. 合并/推送到 `main`
2. 本次变更包含 `release-note.md`（见 [release.yml](.github/workflows/release.yml) 的 `on.push.paths`）

满足条件后，GitHub Actions 自动执行 npm 发布（OIDC Trusted Publishing）。

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

欢迎贡献！本地开发环境搭建、构建测试、调试方法等详见 **[DEVELOPER.md](DEVELOPER.md)**。

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
