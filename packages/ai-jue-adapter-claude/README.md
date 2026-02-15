# ai-jue-adapter-claude

<div align="center">

**Claude Code 适配器：将 ai-jue 配置转换为 Claude 原生格式**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-claude.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-claude)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能概述

该适配器将 `ai-jue` 规范能力转换为 Claude Code (`claude`) 原生配置格式。

## 能力映射矩阵

> **开发者注意**：下表中的“Claude Code 原生特性”一列包含了指向该特性官方文档的 **已验证** 的 Markdown 链接。

| 优先级 | ai-jue 能力 | Claude Code 原生特性 (必须包含文档链接) | 支持状态 | 用户配置说明 | 实现策略 |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | [CLAUDE.md Context](https://code.claude.com/docs/en/best-practices) | 🟢 Native | 根目录放置 `CLAUDE.md` | 生成 `CLAUDE.md` 并映射全局上下文 |
| ⭐⭐⭐⭐⭐ | **Rules** | [Modular Rules](https://code.claude.com/docs/en/memory) | 🟢 Native | `.claude/rules/` 路径 | 转换为目录下的多文件规则系统 |
| ⭐⭐⭐ | **Commands** | [Skills / Commands](https://code.claude.com/docs/en/skills) | 🟢 Native | 使用 `/skill-name` 调用 | 转换为 `.claude/skills/` 下的 SKILL.md |
| ⭐⭐⭐ | **Skills** | [Agent Skills Specification](https://agentskills.io/specification) | 🟢 Native | 自动识别并激活相关技能 | 生成标准技能目录及 YAML Frontmatter |
| ⭐⭐⭐ | **MCP** | [MCP Servers](https://code.claude.com/docs/en/build-with-claude-code/mcp) | 🟢 Native | 根目录的 `.mcp.json` | 将 MCP 配置注入根目录 `.mcp.json` |
| ⭐⭐⭐ | **Hooks** | [Lifecycle Hooks](https://code.claude.com/docs/en/hooks) | 🟢 Native | 事件驱动的自动化指令 | 将钩子配置注入 `.claude/settings.json` |
| ⭐⭐ | **Agents** | [Sub-Agents](https://code.claude.com/docs/en/sub-agents) | 🟢 Native | 独立提示词的专业助手 | 映射至 `.claude/agents/` 下的 Persona |
| ⭐⭐ | **Configuration** | [Settings Scopes](https://code.claude.com/docs/en/build-with-claude-code/settings) | 🟢 Native | 配置权限、偏好与模型 | 合并配置并生成 `.claude/settings.json` |

## 详细实现说明

### 1. AGENTS.md（全局上下文）

- **兼容性**：Fully Compatible
- **映射策略**：生成物理 `CLAUDE.md` 文件。
- **用户操作**：Claude Code 会在启动时自动加载项目根目录下的 `CLAUDE.md`。
- **技术细节**：支持在该文件中通过 `@path/to/file` 引用额外资源。

### 2. Rules（路径特定规则 / Project Rules）

- **兼容性**：Fully Compatible
- **映射策略**：
  - `globs` → 映射至规则文件的 `paths` 配置（支持数组和字符串）
  - `alwaysApply` → 映射至 `auto-apply` 元数据
- **文件输出**：输出至 `.claude/rules/*.md`。
- **高级配置**：通过 YAML frontmatter 中的 `claude:` 命名空间配置工具特定选项

### 3. Commands（自定义命令）

- **兼容性**：Fully Compatible
- **映射策略**：Claude Code 将 Commands 与 Skills 合并。`commands/` 下的内容会被转换为 `.claude/skills/` 下的 SKILL.md（而非过时的 `.claude/commands/`）。
- **使用方式**：用户使用 `/command-name` 调用。
- **默认行为**：
  - `disable-model-invocation: true`（命令默认不由 Claude 自动调用）
  - `user-invocable: true`（用户可通过 `/` 菜单调用）
- **Frontmatter 配置**：支持通过 `claude:` 命名空间配置高级选项

```yaml
---
description: Deploy to production
claude:
  argument-hint: '[environment]'
  model: sonnet
  allowed-tools: [Bash, Read, Write]
---
```

### 4. Skills（可复用技能）

- **兼容性**：Fully Compatible
- **映射策略**：生成完全符合 [Agent Skills](https://agentskills.io/specification) 规范的目录，包含 `SKILL.md` 及其关联的 `scripts/`、`references/`。
- **默认行为**：
  - `disable-model-invocation: false`（技能可由 Claude 根据上下文自动加载）
- **支持的 Frontmatter 字段**（通过 `claude:` 命名空间）：
  - `argument-hint`: 参数提示
  - `disable-model-invocation`: 是否禁止自动调用
  - `user-invocable`: 是否显示在 `/` 菜单
  - `allowed-tools`: 允许使用的工具
  - `model`: 使用的模型 (sonnet/opus/haiku)
  - `context`: 运行上下文 (fork 表示在 subagent 中运行)
  - `agent`: subagent 类型 (Explore/Plan/general-purpose)

### 5. Agents（子代理）

- **兼容性**：Fully Compatible
- **映射策略**：`agents/` 目录下的内容映射至 `.claude/agents/*.md`。
- **支持的 Frontmatter 字段**（通过 `claude:` 命名空间）：
  - `description`: 代理描述（必须）
  - `tools`: 允许的工具白名单
  - `disallowedTools`: 禁止的工具黑名单
  - `model`: 模型 (sonnet/opus/haiku/inherit)
  - `permissionMode`: 权限模式
  - `maxTurns`: 最大轮数
  - `skills`: 预加载的技能
  - `mcpServers`: MCP 服务器配置
  - `memory`: 持久化记忆 (user/project/local)
  - `hooks`: 生命周期钩子

```yaml
---
name: code-reviewer
description: Reviews code for quality
claude:
  tools: [Read, Grep, Glob, Bash]
  model: sonnet
  memory: user
---
```

### 6. MCP（外部工具集成）

- **兼容性**：Fully Compatible
- **文件路径**：输出至根目录下的 `.mcp.json`（project scope）。
- **配置格式**：直接映射至顶层的 `mcpServers` 对象。
- **Scope 支持**：
  - `project`: `.mcp.json`（默认，团队共享）
  - `user`: 需通过 `claude mcp add --scope user` 配置
  - `local`: 需通过 `claude mcp add --scope local` 配置

```javascript
// ai.config.js
mcp: {
  servers: {
    'my-db': {
      command: 'npx',
      args: ['@myteam/mcp-server-db'],
      scope: 'project'  // 'local' | 'project' | 'user'
    }
  }
}
```

### 7. Hooks（生命周期钩子）

- **兼容性**：Fully Compatible
- **映射路径**：注入 `.claude/settings.json` 的 `hooks` 字段。
- **支持的事件**：`PreToolUse`, `PostToolUse`, `SessionStart`, `Notification`, `SubagentStart`, `SubagentStop` 等。
- **配置格式**：支持简单字符串、对象或完整嵌套结构

```yaml
# 简化语法
hooks:
  PostToolUse: './scripts/lint.sh'

# 完整语法
hooks:
  PreToolUse:
    matcher: 'Bash'
    script: './scripts/validate.sh'
    async: true
    timeout: 120
```

### 8. Configuration（全局配置）

- **兼容性**：Fully Compatible
- **映射策略**：合并 `tools.claude` 的所有设置至 `.claude/settings.json`。
- **工具特定配置**：如需无法通过 frontmatter 表达的配置，可使用 `tools/claude/` 逃生舱

## 安装

```bash
npm install ai-jue-adapter-claude
```

## 使用

在 `ai.config.js` 中配置：

```javascript
module.exports = {
  preset: 'base',
  adapters: ['claude']
};
```

## 验证

运行适配器测试：

```bash
npm test -- packages/ai-jue-adapter-claude/test/index.test.ts
```

## 相关链接

- [ai-jue 主项目](https://github.com/zenHeart/ai-jue)
- [Claude Code 官方文档](https://code.claude.com/docs/en/overview)

## License

[MIT](LICENSE)
