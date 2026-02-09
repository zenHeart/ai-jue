# ai-jue

<div align="center">

**像配置 ESLint 一样配置你的 AI 工具**

[![NPM version](https://img.shields.io/npm/v/ai-jue.svg?style=flat)](https://www.npmjs.com/package/ai-jue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

```bash
npm install -D ai-jue jue-preset-react
```

[快速开始](#快速开始) · [配置指南](#配置指南) · [预设列表](#官方预设)

</div>

---

## 为什么需要 ai-jue？

`ai-jue` 项目的诞生，是为了解决 AI 辅助开发时代下，开发者经验无法有效沉淀、复用和共享的核心痛点。

具体来说，它要解决以下三个相互关联的问题：

1.  **配置碎片化 (Configuration Fragmentation)**
    *   **问题**: 随着 AI 编程工具（如 Gemini, Claude, Cursor, Copilot Workspace）的增多，每个工具都有自己独立的配置文件（`.gemini/`, `CLAUDE.md`, `.vscode/settings.json` 等）。开发者需要在不同项目、不同工具间手动维护这些零散的配置，非常繁琐且容易出错。
    *   **`ai-jue` 的解法**: 提供一个统一的入口 `ai.config.js`，实现“一次配置，多处生效”，将开发者从重复的配置工作中解放出来。

2.  **经验难沉淀 (Experience Evaporation)**
    *   **问题**: 开发者在使用 AI 的过程中，会总结出很多高价值的“最佳实践”，例如针对特定场景的优质 Prompt、解决特定问题的“技能”（Skill）、或者与项目代码库深度结合的上下文指令。这些宝贵的智力资产，目前大多以零散的文本片段形式存在于开发者的个人笔记或大脑中，无法形成系统性的知识库。
    *   **`ai-jue` 的解法**: 创造 **“预设（Preset）”** 的概念。让开发者可以将这些碎片化的经验，打包成一个结构化的、可被版本控制和分发的 `npm` 包。

3.  **共享成本高 (High Sharing Cost)**
    *   **问题**: 即使一个团队总结出了一套高效的 AI 使用模式，也很难在团队成员或跨团队之间高效地同步和推广。传统的做法是口口相传或维护一篇共享文档，效率低下且难以保持更新。
    *   **`ai-jue` 的解法**: 通过 `npm` 生态来实现“一键分享、一键复用”。团队的最佳实践可以发布为一个私有的 `@my-company/jue-preset-internal` 包，团队成员只需在 `ai.config.js` 中引入即可。优秀的通用能力也可以发布到公共 `npm` 仓库，供整个社区使用。

**总结来说，`ai-jue` 的使命，就是成为 AI 开发领域的 `ESLint` 或 `Babel`：它不直接产出业务代码，而是通过提供标准、工具和生态，将开发者高价值的、抽象的“AI 开发能力”进行标准化、工程化和资产化，从而极大地提升整个开发工作流的效率和质量。**

---

## 快速开始

### 1. 安装

```bash
# 安装 ai-jue 和预设
npm install -D ai-jue jue-preset-react

# 或者使用其他预设
npm install -D ai-jue jue-preset-vue
npm install -D ai-jue jue-preset-node
```

### 2. 初始化

```bash
npx jue init
```

交互式选择你的配置：

```
? 检测到 React + TypeScript 项目，使用推荐配置？ (Y/n)
? 选择 AI 工具:
  ◉ Claude Code
  ◉ Cursor
  ◯ GitHub Copilot

✓ 已生成 CLAUDE.md
✓ 已生成 .cursor/cli.json
```

### 3. 完成

现在你的 AI 工具已经配置好了，包含：

- 项目上下文理解
- 代码规范指导
- 常用命令和技巧
- 最佳实践提示

---

## 配置方式

### 方式一：使用预设（推荐）

就像 `eslint-config-airbnb` 一样：

```javascript
// ai.config.js
export default {
  preset: 'react',  // 使用 React 预设
}
```

```bash
npx jue apply
```

### 方式二：组合多个预设

```javascript
// ai.config.js
export default {
  presets: [
    'base',           // 基础配置
    'react',          // React 配置
    'typescript'      // TypeScript 配置
  ]
}
```

### 方式三：自定义扩展

```javascript
// ai.config.js
export default {
  preset: 'react',

  // 添加自定义内容
  extends: {
    prompts: './prompts/custom-rules.md',
    skills: ['./skills/my-skill.md']
  },

  // 覆盖配置
  overrides: {
    tools: ['claude', 'cursor']
  }
}
```

### 方式四：在 package.json 中配置

```json
{
  "name": "my-app",
  "devDependencies": {
    "ai-jue": "^1.0.0",
    "jue-preset-react": "^1.0.0"
  },
  "jue": {
    "preset": "react",
    "tools": ["claude", "cursor"]
  }
}
```

---

## 核心概念

### 预设 (Presets)

预设是预配置的 AI 能力组合，类似 ESLint 的 `eslint-config-*`。它是一系列“能力资产”的打包，这些资产可能包括：
- **Prompts/Instructions** - 系统提示词和上下文
- **Skills** - 各种 AI 的技能文件
- **Commands** - 自定义命令
- **MCP Servers** - Model Context Protocol 服务器配置
- **Sub-agents** - 子代理配置

**多语言资产加载 (i18n) 提示：**
`ai-jue` 采用**渐进增强**的策略加载多语言资产。它不强制预设提供 `prompt.md` 这样的通用文件，而是根据用户在 `ai.config.js` 中 `language` 配置（如 `zh-CN`）智能地选择。
查找优先级如下：
1.  如果 `language` 已配置，则优先查找 `[文件名].<language>.md`（例如 `prompt.zh-CN.md`）。
2.  其次，查找 `[文件名].md`（无语言后缀的通用版本）。
3.  其次，如果找不到特定语言的文件，则回退到加载 `[文件名].md`（无语言后缀的通用版本）。
这种策略确保了默认情况下用户无需关心语言配置，系统会自动适应现有文件；但当需要时，用户可以简单地通过配置来获得本地化体验。

**官方预设：**

### 配置文件

支持多种配置方式（优先级从高到低）：

```
ai.config.js          # JS 配置（推荐，支持动态配置）
ai.config.json        # JSON 配置
.airc.js              # RC 文件
.airc.json
jue.config.js         # 兼容模式，备选
jue.config.json       # 兼容模式，备选
.juerc.js             # 兼容模式，备选
.juerc.json           # 兼容模式，备选
package.json          # ai 字段
```

---

## 命令行

```bash
# 初始化配置（交互式）
npx jue init

# 应用配置（生成 AI 工具配置文件）
npx jue apply

# 应用指定预设
npx jue apply --preset react

# 仅生成特定工具的配置
npx jue apply --tool claude

# 列出可用预设
npx jue list presets

# 列出已安装插件
npx jue list plugins

# 验证配置
npx jue validate
```

---

## 工作原理

```
┌─────────────────────────────────────────────┐
│  1. 读取配置                                 │
│     ai.config.js / package.json            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  2. 加载预设                                 │
│     jue-preset-react                        │
│     └─ 包含所需的插件和能力                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3. 编译抽象能力 (Compile Abstract Capabilities) │
│     - Prompts, Skills, Commands 等          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  4. 生成工具配置文件 (Generate Tool Configs)   │
│     (针对不同 AI 工具的“后端”)              │
│     ✓ CLAUDE.md (Claude Code)               │
│     ✓ .cursor/cli.json (Cursor)             │
│     ✓ .gemini/settings.json (Gemini)        │
│     ✓ .github/copilot-instructions.md       │
└─────────────────────────────────────────────┘
```

---

## 使用场景

### 场景 1：新项目标准化配置

```bash
# 创建项目
npm create vite@latest my-app -- --template react-ts
cd my-app

# 安装 AI 配置（就像安装 ESLint）
npm install -D ai-jue jue-preset-react
npx jue init

# ✓ 完成！所有 AI 工具配置就绪
```

### 场景 2：团队统一标准

```bash
# 1. 团队发布内部预设
# packages/jue-preset-company/
npm publish @company/jue-preset-internal

# 2. 成员使用团队预设
npm install -D ai-jue @company/jue-preset-internal

# ai.config.js
export default {
  preset: '@company/internal'
}
```

### 场景 3：多项目复用

```bash
# 项目 A
cd project-a
npm install -D ai-jue jue-preset-react
npx jue apply

# 项目 B - 相同的配置，一行命令
cd project-b
npm install -D ai-jue jue-preset-react
npx jue apply

# 配置完全一致！
```

### 场景 4：跨 AI 工具使用

```bash
# 一次配置，多工具使用
npx jue apply

# 自动生成：
# ✓ CLAUDE.md - Claude Code 读取
# ✓ .cursor/cli.json - Cursor 读取
# ✓ .gemini/settings.json - Gemini 读取
# ✓ .github/copilot-instructions.md - Copilot 读取

# 所有工具使用相同的知识库！
```

---

## 官方预设

### `jue-preset-base`

基础配置，适用于所有项目。

**包含能力：**

- 代码审查指导
- Git 最佳实践
- 清晰的错误处理建议
- 性能优化提示

```bash
npm install -D jue-preset-base
```

### `jue-preset-react`

React 项目专用配置。

**包含能力：**

- React Hooks 最佳实践
- 组件设计模式
- 性能优化（useMemo, useCallback）
- 常见错误规避
- 测试建议

**自动包含：** `jue-preset-base`

```bash
npm install -D jue-preset-react
```

### `jue-preset-typescript`

TypeScript 项目配置。

**包含能力：**

- 类型定义最佳实践
- 泛型使用技巧
- 类型收窄建议
- 常见类型错误解决

```bash
npm install -D jue-preset-typescript
```

### 组合使用

```javascript
// ai.config.js
export default {
  presets: [
    'base',
    'react',
    'typescript'
  ]
}
```

---

## 创建自己的预设

### 1. 创建包

```bash
mkdir jue-preset-myteam
cd jue-preset-myteam
npm init -y
```

### 2. 定义预设

```javascript
// index.js
export default {
  name: 'myteam',

  // 继承其他预设
  extends: ['base', 'react'],

  // 添加自定义内容
  prompts: [
    './prompts/team-standards.md',
    './prompts/code-review-checklist.md'
  ],

  skills: [
    './skills/deploy-command.md'
  ],

  // 配置 MCP servers
  mcp: {
    servers: {
      'team-db': {
        command: 'npx',
        args: ['@myteam/mcp-server-db']
      }
    }
  }
}
```

### 3. 添加内容

```
jue-preset-myteam/
├── package.json
├── index.js
├── prompts/
│   ├── team-standards.md
│   └── code-review-checklist.md
└── skills/
    └── deploy-command.md
```

### 4. 发布

```json
{
  "name": "jue-preset-myteam",
  "version": "1.0.0",
  "keywords": ["jue-preset"],
  "main": "index.js",
  "files": ["index.js", "prompts", "skills"]
}
```

```bash
npm publish
```

### 5. 使用

```bash
npm install -D jue-preset-myteam
npx jue apply --preset myteam
```

---

## 对比

### vs 手动配置

| 维度 | 手动配置 | ai-jue |
|------|---------|--------|
| 新项目配置 | 复制粘贴，10+ 分钟 | `npx jue init`，30 秒 |
| 多项目同步 | 手动更新每个项目 | 更新预设包，统一升级 |
| 团队协作 | 文档传递，容易遗漏 | 共享预设包，自动同步 |
| 跨工具配置 | 每个工具单独配置 | 一次配置，自动生成 |
| 版本管理 | 难以追踪变更 | Git + npm 版本控制 |

### vs 其他工具

ai-jue 不是替代品，而是标准化工具：

- **不替代** Claude Code/Cursor/Copilot → 配置它们
- **不替代** MCP Servers → 管理和组合它们
- **不替代** Custom Skills → 标准化分发它们

---

## 迁移指南

### 从手动配置迁移

```bash
# 1. 安装 ai-jue
npm install -D ai-jue

# 2. 创建配置（会检测现有配置）
npx jue init

# 3. ai-jue 会询问：
#    "检测到现有的 CLAUDE.md，是否导入？"
#    选择 Yes，自动迁移内容
```

### 从其他项目迁移

```bash
# 1. 找出之前项目用的预设
cd old-project
cat ai.config.js

# 2. 在新项目使用相同预设
cd new-project
npm install -D ai-jue jue-preset-react
npx jue apply --preset react
```

---

## 常见问题

### Q: 和 ESLint/Prettier 的区别是什么？

A:

- **ESLint** - 检查代码质量
- **Prettier** - 格式化代码
- **ai-jue** - 配置 AI 工具的行为和知识

它们解决不同的问题，可以一起使用。

### Q: 是否支持自定义？

A: 完全支持！就像 ESLint 可以自定义规则一样，你可以：

- 扩展现有预设
- 添加自定义 prompts/skills
- 创建自己的预设包

### Q: 会影响项目运行吗？

A: 不会。ai-jue 只生成配置文件（CLAUDE.md 等），不影响代码运行，类似 `.eslintrc` 文件。

### Q: ai-jue 会覆盖我的手动修改吗？

A: **绝对不会粗暴覆盖。** `ai-jue` 的核心设计原则之一就是**尊重并保护用户的手动修改**。我们的“智能共存”策略确保了这一点：

- **对于 `.md` 这类文本文件**：`ai-jue` 只会更新它自己管理的、被 `<!-- AI-JUE:START -->` 和 `<!-- AI-JUE:END -->` 包围的区块。**您在该区块之外添加的任何内容都将永远被保留**，不会受到任何影响。
- **对于 `.json` 这类配置文件**：`ai-jue` 会执行**深度合并 (Deep Merge)**。这意味着它只会添加或更新它所管理的字段，而**您手动添加的任何其他字段都会被完整地保留下来**。

您可以放心地将 `ai-jue` 集成到现有项目中，而无需担心它会破坏您已有的宝贵配置。

### Q: 需要每次都运行吗？

A: 不需要。配置文件生成后就可以提交到 Git，团队成员直接使用。需要更新时再运行 `jue apply`。

### Q: 支持哪些 AI 工具？

A: 目前支持：

- Claude Code
- Cursor
- GitHub Copilot
- Windsurf
- 任何支持 markdown 配置的 AI 工具

---

## 最佳实践

### 1. 在项目初始化时配置

```bash
# 创建项目后立即配置
npm create vite@latest
npm install -D ai-jue jue-preset-react
npx jue init
git add .
git commit -m "chore: setup ai tools config"
```

### 2. 配置文件纳入版本控制

```bash
# .gitignore - 不要忽略这些文件
# CLAUDE.md
# .cursor/cli.json
# .gemini/settings.json
# ai.config.js
```

### 3. 团队使用统一预设

```json
// package.json
{
  "devDependencies": {
    "ai-jue": "^1.0.0",
    "@company/jue-preset-internal": "^1.0.0"
  }
}
```

### 4. 定期更新预设

```bash
# 更新预设包获取最新最佳实践
npm update jue-preset-react
npx jue apply
```

---

## Release (发布流程)

本项目的发布流程设计为「代码合并到 master 后一键发布」，遵循严格的 Monorepo 规范。

### 1. 环境准备

发布操作需在本地执行，请确保满足以下条件：
- **Node.js**: ≥ 18.0.0
- **Git**: ≥ 2.35
- **NPM**: 已登录 (`npm login`) 且拥有对应包的发布权限
- **Branch**: 当前处于 `master` 分支，且已同步最新代码 (`git pull --rebase`)

### 2. 执行发布

运行以下命令启动交互式发布流程：

```bash
npm run release
```

**交互示例：**

```text
? Select packages to release: (Press <space> to select, <a> to toggle all, <i> to invert selection)
❯ ◯ ai-jue (current: 1.0.1)
  ◉ ai-jue-core (current: 1.0.0) -> has changes
  ◯ jue-preset-react (current: 1.0.2)

? Select release type for ai-jue-core:
  Patch (1.0.1)
❯ Minor (1.1.0)
  Major (2.0.0)
  Prerelease (1.0.1-beta.0)

✓ Updated package.json
✓ Generated CHANGELOG.md
✓ Created git tag: ai-jue-core@1.1.0
✓ Pushed to remote
```

### 3. 常见错误码对照表

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| `E_TAG_EXISTS` | 远程已存在相同 Tag | 检查是否重复发布，或手动删除远程错误 Tag |
| `E_GIT_DIRTY` | 本地有未提交的变更 | 请先提交或 stash 本地变更后再执行发布 |
| `E_CI_FAILED` | CI 状态检查未通过 | 确保最近一次 commit 的 CI 构建成功 |
| `E_NPM_AUTH` | NPM 未授权 (401) | 运行 `npm login` 重新登录 |
| `E_PREID_CONFLICT` | Prerelease ID 冲突 | 检查版本号策略，确保 preid (如 beta/alpha) 一致 |

### 4. 自动化流程

本地命令执行成功并 push tag 后，GitHub Actions 会自动接管：
1.  **触发**：识别 `packagename@vxx.xx.xx` 格式的 tag。
2.  **构建**：安装依赖并构建对应包。
3.  **发布**：执行 `npm publish --provenance` 发布到 npm registry。
4.  **Release**：在 GitHub 生成 Release 记录，并附带 CHANGELOG。

---

## 路线图 (Roadmap)

`ai-jue` 的发展路径将遵循从“有用的工具”到“无感的基建”，最终成为“繁荣的生态”的演进策略。

- [x] **v0.1 - MVP 验证**
  - [x] 核心概念设计 (`ai.config.js`, `.ai` 目录)。
  - [x] 实现 `apply` 命令，完成“预设 -> 配置文件”的核心流程。
  - [x] 实现项目自我“自举”，使用 `ai-jue` 管理自身AI配置。

- [ ] **v0.2 - 可用性与本地体验**
  - [ ] 实现 `init` 命令，提供顺滑的上手体验。
  - [ ] 完善多预设组合与本地 `.ai` 资产的 `extends` 继承能力。
  - [ ] 增加 `check` 命令，主动检测预设更新。
  - [ ] 官方预设：覆盖 React, Vue, Node, TypeScript 等主流场景。

- [ ] **v1.0 - 生态飞轮启动**
  - [ ] **核心功能：** `create-preset` 命令，实现从本地 `.ai` 目录一键打包、发布新预设。
  - [ ] **生态治理：** 建立预设的社区策展机制（如官方认证、质量评分）。
  - [ ] **文档完善：** 提供预设开发的完整指南和最佳实践。

- [ ] **v2.0 - 无缝工作流与高级架构**
  - [ ] **无缝体验：** `apply --watch` 模式，实现 AI 配置的热重载。
  - [ ] **IDE 集成：** VS Code 扩展，提供配置校验、源映射追溯（Prompt Source Maps）等高级功能。
  - [ ] **高级架构：** 引入更强大的配置语言（如 `patch` 操作符）、将核心重构为“编译器+后端插件”模式、支持“逃生通道”等。

- [ ] **未来...**
  - [ ] 可视化配置工具。
  - [ ] 与更多第三方工具（如脚手架）的深度集成。

---

## 技术栈与开发哲学 (Technical Stack & Development Philosophy)

`ai-jue` 致力于构建一个简洁、高效、可维护的 AI 配置管理工具，因此在技术栈和开发哲学上遵循以下原则：

*   **技术栈:**
    *   **核心语言:** 最新的 TypeScript，确保代码质量和可维护性。
    *   **命令行工具:** Yargs，提供强大且友好的命令行交互体验。
*   **编码风格:**
    *   **函数式编程范式:** 鼓励使用纯函数、不可变数据和函数组合，以提高代码的可预测性和可测试性。
*   **设计原则:**
    *   **Unix 哲学:** 遵循“做一件事，并把它做好；小而精巧，可以组合”的理念。
    *   **KISS 原则 (Keep It Simple, Stupid):** 优先选择最简单、最直接的解决方案，避免不必要的复杂性，确保项目的长期可维护性。

---

## 贡献

欢迎贡献！你可以：

- 🐛 [报告问题](https://github.com/yourusername/ai-jue/issues)
- 💡 [提出建议](https://github.com/yourusername/ai-jue/discussions)
- 📦 [创建预设](docs/creating-presets.md)
- 🔧 [开发插件](docs/plugin-development.md)

---

## License

[MIT](LICENSE)

---

<div align="center">

**让 AI 工具配置像 ESLint 一样简单** 🚀

Made with ❤️ for developers

</div>
