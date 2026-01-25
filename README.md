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

你可能已经习惯了这样配置项目：

```bash
npm install -D eslint prettier
npm install -D eslint-config-airbnb prettier-config-standard
```

**但是配置 AI 工具时呢？**

```bash
# ❌ 手动创建 CLAUDE.md，复制粘贴之前的配置
# ❌ 手动创建 .cursorrules，又要重新写一遍
# ❌ 每个项目都要重复这个过程
# ❌ 团队成员各自维护，标准不统一
```

**ai-jue 让 AI 工具配置和 ESLint 一样简单：**

```bash
npm install -D ai-jue jue-preset-react
npx jue init
```

一条命令，自动生成 CLAUDE.md、.cursorrules 等所有 AI 工具配置。

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
✓ 已生成 .cursorrules
```

### 3. 完成！

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
// jue.config.js
export default {
  preset: 'react',  // 使用 React 预设
}
```

```bash
npx jue apply
```

### 方式二：组合多个预设

```javascript
// jue.config.js
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
// jue.config.js
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

预设是预配置的 AI 能力组合，类似 ESLint 的 `eslint-config-*`。

**官方预设：**

```bash
jue-preset-base          # 基础能力（代码审查、Git 最佳实践）
jue-preset-react         # React 开发
jue-preset-vue           # Vue 开发
jue-preset-typescript    # TypeScript 开发
jue-preset-node          # Node.js 后端
jue-preset-fullstack     # 全栈开发
```

**社区/团队预设：**

```bash
@yourcompany/jue-preset-internal   # 公司内部标准
jue-preset-nextjs                  # Next.js 项目
jue-preset-tdd                     # 测试驱动开发
```

### 插件 (Plugins)

插件提供具体的能力实现，类似 ESLint 的 `eslint-plugin-*`。

**能力类型：**
- **Prompts/Instructions** - 系统提示词和上下文
- **Skills** - Claude Code Skills
- **Commands** - 自定义命令
- **MCP Servers** - Model Context Protocol 服务器
- **Sub-agents** - 子代理配置

所有这些都被统一抽象为"能力"，通过预设组合使用。

### 配置文件

支持多种配置方式（优先级从高到低）：

```
jue.config.js         # JS 配置（推荐，支持动态配置）
jue.config.json       # JSON 配置
.juerc.js             # RC 文件
.juerc.json
package.json          # jue 字段
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
│     jue.config.js / package.json            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  2. 加载预设                                 │
│     jue-preset-react                        │
│     └─ 包含所需的插件和能力                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3. 组装内容                                 │
│     - Prompts/Instructions                  │
│     - Skills & Commands                     │
│     - MCP Servers                           │
│     - Sub-agents                            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  4. 生成工具配置文件                         │
│     ✓ CLAUDE.md (Claude Code)               │
│     ✓ .cursorrules (Cursor)                 │
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

# jue.config.js
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
# ✓ .cursorrules - Cursor 读取
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
// jue.config.js
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
cat jue.config.js

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
# .cursorrules
# jue.config.js
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

## 路线图

- [x] 核心概念设计
- [x] 项目初始化
- [ ] **v0.1 - MVP**
  - [ ] 基础 CLI 命令
  - [ ] 预设系统
  - [ ] 官方预设：base, react
- [ ] **v0.2 - 生态**
  - [ ] 更多官方预设（vue, node, typescript）
  - [ ] 插件市场
  - [ ] 配置验证
- [ ] **v0.3 - 集成**
  - [ ] 脚手架集成（create-*）
  - [ ] IDE 插件
  - [ ] 可视化配置工具
- [ ] **v1.0 - 稳定版**
  - [ ] 完整文档
  - [ ] 性能优化
  - [ ] 社区生态

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
