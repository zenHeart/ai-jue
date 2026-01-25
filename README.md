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

作为前端开发者，你已经习惯了标准化的工具链：

- **代码质量**: `eslint` + `eslint-config-airbnb`
- **代码格式**: `prettier` + `prettier-config-standard`

**但是配置 AI 工具时呢？** 你的工作流可能是这样的：

- ❌ 手动维护不同工具下的配置文件，比如 `.gemini、.cursor、.claude` 等
- ❌ 如何沉淀经验实现跨项目的复用，比如 `skill、command、sub-agent、mcp 配置` 等

`ai-jue` 将 AI 工具的配置带入你所熟悉的标准化时代。我们复用了你已有的知识，无需学习新概念：

| 核心概念     | 与 ESLint 的类比             | 说明                               |
|--------------|------------------------------|------------------------------------|
| **预设 (Preset)**  | `eslint-config-airbnb` | 开箱即用的 AI 能力配置包 (e.g., `jue-preset-react`) |
| **配置 (Config)**  | `.eslintrc.js`               | 项目配置文件 (e.g., `ai.config.js`) |

**ai-jue 让 AI 工具配置和 ESLint 一样简单：**

```bash
npm install -D ai-jue jue-preset-react
npx jue init
```

只需一条命令，即可自动生成 `CLAUDE.md`、`.cursor/cli.json`、`.gemini/settings.json` 等所有 AI 工具的配置，让你的 AI 助手即刻理解项目上下文和团队规范。

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

**高级用法提示：**
`ai-jue` 的预设和 `.ai` 目录支持通过子目录为不同环境提供差异化配置。例如，你可以创建一个 `prompts/claude/` 或 `prompts/zh-CN/` 目录来存放特定于 Claude 或中文环境的能力资产。详情请关注未来的高级配置指南。

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

A: 不会粗暴覆盖。`ai-jue` 的核心原则是“智能共存”，它会尽力保护你的手动修改：
- **对于 `.md` 文件**，它只更新由它自己管理的特定区块（`<!-- AI-JUE:START -->...`），区块外的内容完全不受影响。
- **对于 `.json` 文件**，它会执行“深度合并”，只更新它所管理的字段，并完整保留你额外添加的字段。

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
