# ai-jue-adapter-cursor

<div align="center">

**Cursor 适配器：将 ai-jue 配置转换为 Cursor 原生格式**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-cursor.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-cursor)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能概述

该适配器将 `ai-jue` 规范能力转换为 Cursor 原生配置格式，支持完整的规则系统、命令、技能、MCP 集成、生命周期钩子和忽略文件配置。

## 能力映射矩阵

> **开发者注意**：下表中的"Cursor 原生特性"一列包含了指向该特性官方文档的 **已验证** 的 Markdown 链接。

| 优先级 | ai-jue 能力 | Cursor 原生特性 | 支持状态 | 用户配置说明 | 实现策略 |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | [Project Rules](https://docs.cursor.com/context/rules) | 🟢 Native | 根目录放置 `AGENTS.md` | 生成 `AGENTS.md` 作为全局上下文入口 |
| ⭐⭐⭐⭐⭐ | **Rules** | [Project Rules](https://docs.cursor.com/context/rules#project-rules) | 🟢 Native | `.cursor/rules/*.mdc` | 转换为 MDC 格式规则文件，支持 globs/alwaysApply |
| ⭐⭐⭐⭐ | **Ignore Files** | [Ignore Files](https://docs.cursor.com/context/ignore-files) | 🟢 Native | `.cursorignore`, `.cursorindexingignore` | 生成忽略文件控制 AI 访问范围 |
| ⭐⭐⭐ | **Commands** | [Context Commands](https://docs.cursor.com/context/commands) | 🟢 Native | `.cursor/commands/*.md` | 生成 Markdown 格式命令定义 |
| ⭐⭐⭐ | **Skills** | [Cursor Skills](https://docs.cursor.com/context/skills) | 🟢 Native | `.cursor/skills/*/SKILL.md` | 生成标准技能目录结构 |
| ⭐⭐⭐ | **MCP** | [MCP Servers](https://docs.cursor.com/context/mcp) | 🟢 Native | `.cursor/mcp.json` | 完整映射 MCP 服务器配置（含 env/autoApprove） |
| ⭐⭐⭐ | **Hooks** | [Agent Hooks](https://docs.cursor.com/agent/hooks) | 🟢 Native | `.cursor/hooks.json` | 生成钩子配置文件，支持所有事件类型 |
| ⭐⭐ | **Agents** | [Agent Overview](https://docs.cursor.com/agent/overview) | 🟢 Native | `.cursor/agents/*.md` | 生成代理定义文件 |
| ⭐⭐ | **Configuration** | [Settings](https://docs.cursor.com/get-started/migrate-from-vscode#settings) | 🟢 Native | `.cursor/settings.json` | 合并工具配置到 settings.json |

## 详细实现说明

### 1. AGENTS.md（全局上下文）

- **兼容性**：Fully Compatible
- **映射策略**：生成物理 `AGENTS.md` 文件，Cursor 会在启动时自动加载。
- **用户操作**：将全局上下文放置在项目根目录的 `AGENTS.md` 中。
- **技术细节**：支持 Markdown 格式，可包含 `@file` 引用其他资源。

### 2. Rules（项目规则）

- **兼容性**：Fully Compatible
- **映射策略**：
  - `description` → MDC frontmatter 的 `description` 字段
  - `alwaysApply` → MDC frontmatter 的 `alwaysApply` 字段
  - `globs` → MDC frontmatter 的 `globs` 字段（支持数组格式）
  - `content` → MDC 文件主体内容
- **文件输出**：`.cursor/rules/{ruleName}.mdc`
- **格式示例**：

```yaml
---
description: TypeScript best practices
alwaysApply: true
globs: ["*.ts", "*.tsx"]
---

Use strict typing. Avoid `any`.
```

### 3. Ignore Files（忽略文件）

- **兼容性**：Fully Compatible
- **支持文件**：
  - `.cursorignore` - 阻止 AI 访问特定文件/目录
  - `.cursorindexingignore` - 排除文件 from 索引（仍可访问）
- **映射策略**：
  - `ignore` → `.cursorignore`
  - `indexingIgnore` → `.cursorindexingignore`
- **格式**：使用 `.gitignore` 语法

```javascript
// ai.config.js
{
  cursor: {
    ignore: [
      "dist/",
      "*.log",
      "node_modules/"
    ],
    indexingIgnore: [
      "*.min.js",
      "build/"
    ]
  }
}
```

### 4. Commands（自定义命令）

- **兼容性**：Fully Compatible
- **映射策略**：转换为 `.cursor/commands/*.md` 格式
- **使用方式**：用户在 Cursor 命令面板中输入命令名称触发
- **格式示例**：

```markdown
# /explain

## Action

Explain the selected code...

## Triggers

/explain, /exp
```

### 5. Skills（可复用技能）

- **兼容性**：Fully Compatible
- **映射策略**：生成 `.cursor/skills/{name}/SKILL.md` 目录结构
- **内容格式**：包含技能描述和指令内容

### 6. MCP（外部工具集成）

- **兼容性**：Fully Compatible
- **文件路径**：`.cursor/mcp.json`
- **配置格式**：完整映射 MCP 服务器配置，包括：
  - `command` - 可执行命令
  - `args` - 参数数组
  - `env` - 环境变量
  - `disabled` - 是否禁用
  - `autoApprove` - 自动批准的操作列表

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite"],
      "env": { "DATABASE_URL": "..." },
      "disabled": false,
      "autoApprove": ["read"]
    }
  }
}
```

### 7. Hooks（生命周期钩子）

- **兼容性**：Fully Compatible
- **文件路径**：`.cursor/hooks.json`
- **支持的事件类型**：

**Agent 生命周期：**
- `sessionStart` / `sessionEnd` - 会话开始/结束
- `preToolUse` / `postToolUse` / `postTool` - 工具执行前后

**Cursor Tab：**
- `preInlineCompletion` / `postInlineCompletion` - 内联补全前后

**传统事件（向后兼容）：**
- `pre-commit` - 提交前触发
- `post-build` - 构建后触发
- `on-save` - 保存文件时触发

```json
{
  "sessionStart": "./scripts/init.sh",
  "preToolUse": {
    "matcher": "Bash",
    "script": "./scripts/validate.sh"
  }
}
```

### 8. Agents（AI 代理）

- **兼容性**：Fully Compatible
- **映射策略**：映射至 `.cursor/agents/{name}.md`
- **内容格式**：包含代理描述、提示词和技能引用列表

### 9. Configuration（全局配置）

- **兼容性**：Fully Compatible
- **映射策略**：合并 `tools.cursor` 配置项至 `.cursor/settings.json`
- **用途**：存储 Cursor 特定的设置，如温度、模型选择等

## 安装

```bash
npm install ai-jue-adapter-cursor
```

## 使用

在 `ai.config.js` 中配置：

```javascript
module.exports = {
  preset: 'base',
  adapters: ['cursor']
};
```

然后运行：

```bash
npx jue apply --adapter cursor
```

## 验证

运行适配器测试：

```bash
npm test -- packages/ai-jue-adapter-cursor/test/index.test.ts
```

## 相关链接

- [ai-jue 主项目](https://github.com/zenHeart/ai-jue)
- [Cursor 官方文档](https://docs.cursor.com/)
- [Cursor Rules 文档](https://docs.cursor.com/context/rules)
- [Cursor MCP 文档](https://docs.cursor.com/context/mcp)
- [Cursor Hooks 文档](https://docs.cursor.com/agent/hooks)
- [Cursor Ignore Files](https://docs.cursor.com/context/ignore-files)

## License

[MIT](LICENSE)
