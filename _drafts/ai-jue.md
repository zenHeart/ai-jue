# AI 编程工具能力矩阵

## 文档导航

本文档分为 **5 个主要部分**：

1. **核心能力详解** - 8 大能力的详细说明（按优先级排序）
2. **能力优先级与依赖关系** - 清晰的优先级分类和依赖关系
3. **工具能力矩阵** - 完整的工具支持矩阵
4. **Preset 组织指南** - 如何基于能力组织 Preset
5. **Adapter 开发指南** - 工具适配的关键转换规则

---

## 第一部分：核心能力详解（按优先级排序）

### [AGENTS.md](https://agents.md/) （⭐⭐⭐⭐⭐ 最高优先级）

**概述**：在项目根目录放置 [AGENTS.md](https://agents.md/) 文件，为 AI 提供项目级别的上下文指导 and 工作流规范。支持嵌套，在内部文件夹编写的 `AGENTS.md` 也会加载。

**使用范围**：

- **触发条件**：初始化新项目、团队协作、跨项目一致性
- **原理层面**：会话初始化时自动加载，作为系统提示补充
- **用户视角**：快速启动、团队规范统一、中小型项目
- **最常见场景**：项目开始时定义基础规范，无需复杂配置

**示例**（Claude Code）：

```markdown
# Project Context

## Architecture
We use MVC pattern. Controllers in /api, Models in /models.

## Coding Standards
- Use TypeScript for all new code
- Follow ESLint rules in .eslintrc.json
- Write tests for all functions

## Testing
Run tests with `npm test`. Require 80% coverage.
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Claude Code | [write effective CLAUDE.md](https://code.claude.com/docs/en/best-practices#write-an-effective-claude-md)、[memory manage](https://code.claude.com/docs/en/memory) | 自动加载，支持通过 `@path/to/file` 语法导入额外指令文件 | 采用 `/init` 创建 CLAUDE.md，优先级高于 AGENTS.md |
| Cursor | [Rules - AGENTS.md](https://cursor.com/docs/context/rules#agentsmd) | 作为 .cursor/rules 的简化替代，不支持 globs | 原生支持，规则优先级为：Team > Project > User |
| Gemini CLI | [Project context](https://geminicli.com/docs/core/context/) | 默认名称为 GEMINI.md，支持层级加载 | 利用 `context.fileName` 配置引入多个 context 文件，采用 `/init` 创建 GEMINI.md |
| GitHub Copilot | [Agent Instructions](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-cli/add-custom-instructions#agent-instructions) | 支持通用 Agent 规范（AGENTS.md, CLAUDE.md 等） | 原生支持，需在仓库根目录，.github/copilot-instructions.md 优先级更高 |
| Codex | [AGENTS.md](https://developers.openai.com/codex/guides/agents-md/) | 原生支持 | 支持全局 (`~/.codex/AGENTS.md`) 和项目级多层嵌套覆盖 |
| Trae | [Rules](https://docs.trae.ai/ide/rules?_lang=en) | 同时支持 CLAUDE.md | 注意需在设置中配置开启注入上下文 |
| OpenCode | [AGENTS.md](https://opencode.ai/docs/rules/) | 原生支持 | 采用 `/init` 创建 AGENTS.md |

### 1.2 Rules（⭐⭐⭐⭐⭐ 最高优先级）

**概述**：在项目目录中存储规则文件（`.claude/rules/` 或 `.cursor/rules/`），为 AI 提供项目特定的编码标准、架构决策和工作流。支持 frontmatter 元数据和路径特定规则。

**使用范围**：

- **触发条件**：大型项目、多模块架构、团队协作、渐进式规范化
- **原理层面**：启动时扫描加载，支持 frontmatter 元数据，路径特定规则
- **用户视角**：中大型项目、版本控制、灵活管理
- **最常见场景**：为不同模块定义不同的规则，实现细粒度控制

**示例**（Cursor）：

```markdown
---
description: React component patterns and best practices
globs: src/**/*.tsx
alwaysApply: false
---

# React Component Standards

## Component Structure
- Use functional components with hooks exclusively
- Avoid class components
- Keep components focused on single responsibility
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Claude Code | [Modular Rules](https://code.claude.com/docs/en/memory#modular-rules-with-claude%2Frules%2F) | 目录 `.claude/rules/`，自动加载，采用 `paths` 配置 | 原生支持，推荐用于中大型项目 |
| Cursor | [Rules](https://cursor.com/docs/context/rules#project-rules) | 目录 `.cursor/rules/`，支持 `.mdc` 和 `.md`（含 frontmatter），支持 `globs` 和 `alwaysApply` | 原生支持，.mdc 格式提供最多功能 |
| Gemini CLI | [Project context](https://geminicli.com/docs/core/context/) | 不支持独立 Rules 系统 | 应使用 GEMINI.md 的层级加载实现类似功能 |
| GitHub Copilot | [Custom Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) | 支持路径特定指令（*.instructions.md），采用 `applyTo` 配置 | 原生支持，需在 .github 目录 |
| Codex | ❌ 不支持 | N/A | 应使用 [Custom Instructions](https://developers.openai.com/codex/guides/agents-md#customize-fallback-filenames) |
| Trae | [Rules](https://docs.trae.ai/ide/rules?_lang=en) | 目录 `.trae/rules/`，类似 Cursor 采用 `alwaysApply`、`description`、`globs` 配置 | 原生支持 |
| OpenCode | [Custom Instructions](https://opencode.ai/docs/rules/#custom-instructions) | 自定义配置 | 原生支持 |

### 1.3 Commands（⭐⭐⭐ 高优先级）

**概述**：用户定义的快捷方式，用于执行复杂或常用的 AI 操作。通过斜杠命令（`/command-name`）触发。这是复用 prompts 逻辑的核心机制。

**使用范围**：

- **触发条件**：高频任务简化、工作流标准化、上下文快速切换
- **原理层面**：斜杠命令触发，用户显式调用，支持参数传递
- **用户视角**：快捷命令、工作流简化、团队标准化
- **最常见场景**：定义常用的代码审查、文档生成、重构等命令

**示例**（Codex）：

```toml
[prompts]
draftpr = "Draft a professional pull request description based on the code changes."
writedoc = "Write comprehensive API documentation for the provided code."
refactor = "Analyze the code and suggest refactoring opportunities."
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Cursor | [Commands](https://cursor.com/docs/context/commands) | 支持参数传递 | 可以采用 `/command-name` 形式调用 |
| Claude Code | [Skills](https://code.claude.com/docs/en/build-with-claude-code/extend-claude-with-skills) | 已合并至 Skills，使用 SKILL.md 定义 | 通过 `/skill-name` 调用，功能更丰富 |
| Gemini CLI | [Custom Commands](https://geminicli.com/docs/cli/custom-commands/) | 支持通过 `settings.json` 定义 | 原生支持 |
| GitHub Copilot | [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files) | 自定义 prompts 支持类似 command 调用 | 原生支持 |
| OpenCode | [Commands](https://opencode.ai/docs/commands/)| `commands` 目录内容支持采用 `slash` 调用 | 原生支持 |
| Trae | ❌ 不支持 | N/A | 不支持 Commands，应使用 Rules |
| Codex | [Custom Prompts](https://developers.openai.com/codex/custom-prompts/) | 使用 TOML 格式定义，配置于 `~/.codex/config.toml` | 原生支持，通过 `/prompts:name` 调用 |

### 1.4 [SKILL（技能）](https://agentskills.io/home) （⭐⭐⭐ 高优先级）

**概述**：可复用的、封装特定指令和逻辑的 AI 能力单元。通过 SKILL.md 文件定义，支持参数、前置条件、后置动作，可由 AI 自动触发或手动调用。这是工作流自动化的核心。

**使用范围**：

- **触发条件**：重复任务自动化、领域知识封装、工作流标准化、权限隔离
- **原理层面**：启动时扫描加载，支持斜杠命令、自动触发、工具权限限制
- **用户视角**：工作流自动化、团队标准化、权限管理
- **最常见场景**：代码审查、测试生成、文档生成、重构建议等自动化任务

**示例**（Claude Code）：

```markdown
---
name: review-code
description: Reviews code for quality, security, and best practices
allowed-tools: Read, Grep
---

# Code Review Skill

You are a senior code reviewer. When reviewing code:

1. **Security Check**
   - Look for SQL injection vulnerabilities
   - Check for XSS vulnerabilities
   - Verify proper authentication and authorization

2. **Quality Check**
   - Verify error handling is comprehensive
   - Check for code duplication
   - Validate test coverage (minimum 80%)
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Claude Code | [Skills](https://code.claude.com/docs/en/skills) | 支持 SKILL.md，目录：~/.claude/skills/ | 原生支持，支持 `allowed-tools` 权限限制 |
| Cursor | [Skills](https://cursor.com/docs/context/skills) | 支持 SKILL.md，目录：.cursor/skills/ | 原生支持，配置逻辑与 Claude Code 一致 |
| Gemini CLI | [Skills](https://geminicli.com/docs/cli/skills/) | 目录：.gemini/skills/ 或 ~/.gemini/skills/ | 原生支持，支持按需加载 |
| GitHub Copilot | [Agent Skills](https://github.blog/changelog/2025-12-18-github-copilot-now-supports-agent-skills/) | 目录：.github/skills/ 或 ~/.copilot/skills/ | 2025年12月新增支持，兼容 Claude 格式 |
| Codex | [Skills](https://developers.openai.com/codex/skills/) | 支持 SKILL.md | 原生支持 |
| Trae | [Skills](https://docs.trae.ai/ide/skills) | 目录：.trae/skills/ | 原生支持，技能为按需加载 |
| OpenCode | [Skills](https://opencode.ai/docs/skills/) | 兼容 .claude/skills/ 路径 | 原生支持，主打开源兼容性 |

### 1.5 [MCP（Model Context Protocol）](https://modelcontextprotocol.io/docs/getting-started/intro)（⭐⭐⭐ 高优先级）

**概述**：统一的协议，用于 AI 工具与外部服务的集成。支持文件系统、数据库、API 等各类资源的访问。MCP 是实现外部数据集成的标准协议。

**使用范围**：

- **触发条件**：外部服务集成、数据库访问、文件系统操作、API 调用
- **原理层面**：标准化协议，支持多种服务器实现
- **用户视角**：外部集成、数据访问、工具扩展
- **最常见场景**：集成数据库、文件系统、企业 API、知识库等外部资源

**示例**（Claude Code）：

```json
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-filesystem"]
      },
      "postgres": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-postgres", "--connection-string", "postgresql://..."]
      }
    }
  }
}
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Claude Code | [Configure MCP Servers](https://code.claude.com/docs/en/build-with-claude-code/configure-mcp-servers) | 配置在 settings.json 中的 mcp 字段 | 原生支持，推荐用于外部集成 |
| Cursor | [MCP](https://cursor.com/docs/context/mcp) | 配置方式与 Claude Code 相同 | 原生支持，配置方式相同 |
| Gemini CLI | [MCP servers](https://geminicli.com/docs/tools/mcp-server/) | 配置在 .gemini/settings.json | 原生支持，支持 OAuth 认证 |
| GitHub Copilot | [Configure MCP Servers](https://docs.github.com/en/copilot/customizing-copilot/configuring-mcp-servers) | 配置在 .github/copilot-settings.json | 原生支持，需在仓库根目录 |
| Codex | [MCP](https://developers.openai.com/codex/mcp/) | 配置在 ~/.codex/config.toml | 原生支持，使用 TOML 格式 |
| Trae | [MCP](https://docs.trae.ai/ide/ide-settings-overview?_lang=en) | 配置在 .trae/config.json | 原生支持，支持自动运行模式 |
| OpenCode | [MCP](https://opencode.ai/docs/mcp/) | 配置在 .opencode/config.json | 原生支持 |

---

### 1.6 HOOKS（⭐⭐⭐ 高优先级）

**概述**：在特定事件触发时执行的自动化指令。支持 PreToolUse、PostToolUse、SessionStart 等事件。HOOKS 是实现强制规范执行的关键机制。

**使用范围**：

- **触发条件**：强制规范执行、工具使用前后处理、会话初始化
- **原理层面**：事件驱动，每次工具使用时触发，添加到上下文
- **用户视角**：强制规范、自动处理、高级用法
- **最常见场景**：在编辑前验证、在执行前检查、在会话开始时加载上下文等

**示例**（Claude Code）：

```json
{
  "hooks": {
    "PreToolUse": {
      "edit": {
        "matchers": ["**"],
        "prompt": "Before editing, verify the changes are correct and don't introduce syntax errors."
      }
    },
    "SessionStart": {
      "prompt": "Load the project architecture from ARCHITECTURE.md."
    }
  }
}
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Claude Code | [Hooks](https://code.claude.com/docs/en/hooks) | 支持 PreToolUse、PostToolUse、SessionStart、Notification 等。配置于 settings.json | 行业标准定义者，支持 `command`（脚本）、`prompt`（LLM 判定）和 `agent`（子代理）三种 Hook 类型 |
| Cursor | [Hooks](https://cursor.com/docs/agent/hooks) | 支持 beforeShellExecution、afterFileEdit、stop 等。配置于 .cursor/hooks.json | 深度 Agent 适配，提供 Tab（补全）与 Agent（智能体）两套独立的 Hook 生命周期 |
| Gemini CLI | [Hooks](https://geminicli.com/docs/hooks/) | 详见 [hooks event](https://geminicli.com/docs/hooks/#hook-events) | v0.26.0 新增，采用"中间件"模式，支持通过 `/hooks` 命令实时管理状态，强调同步执行安全性 |
| GitHub Copilot | [Hooks](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks) | 详细 hooks 参考 [hooks config](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-hooks#example-hook-configuration-file) | 2026年1月正式版，重点在于安全审计（如阻止危险命令）和自动化报告生成 |
| Codex | ⚠️ 计划中 | 见 [PR #11067](https://github.com/openai/codex/pull/11067) | 尚未正式发布，正处于从代码生成向 Agent 架构转型的 WIP 阶段 |
| Trae | ❌ 不支持 | N/A | 尚未开放底层的执行钩子机制 |
| OpenCode | [Plugins](https://opencode.ai/docs/plugins) | 通过 .opencode/plugin/*.ts 插件系统实现，支持事件流拦截 | 开放标准，不仅是 Hook，更是完整的 SDK，支持通过 TypeScript 编写复杂的异步拦截逻辑 |

---

### 1.7 Agents（⭐⭐ 中等优先级）

**概述**：专门化的 AI 助手，在独立上下文中处理特定类型的任务。每个子代理拥有独立的系统提示、工具访问权限和模型选择。

**使用范围**：

- **触发条件**：复杂任务隔离、专业化行为、权限隔离、成本优化
- **原理层面**：独立上下文运行，独立系统提示、工具权限、模型选择
- **用户视角**：任务隔离、专业化、权限管理、成本优化
- **最常见场景**：为代码审查、文档生成、测试编写等不同任务创建专门的子代理

**示例**（Claude Code）：

```yaml
---
name: code-reviewer
description: Reviews code for quality, security, and best practices
tools: Read, Glob, Grep
model: sonnet
permissionMode: ask
---

# Code Reviewer Agent

You are a senior code reviewer. Focus on:
1. Security vulnerabilities
2. Code quality and maintainability
3. Performance implications
4. Test coverage
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Claude Code | [Agents](https://code.claude.com/docs/en/sub-agents) | 支持独立上下文、工具权限、模型选择，配置在 .claude/agents/ | 原生支持，推荐用于复杂任务 |
| Cursor | [Agents](https://cursor.com/docs/context/subagents) | 支持类似功能，配置方式与 Claude Code 相同 | 原生支持，功能可能有差异 |
| Gemini CLI | [Agents](https://geminicli.com/docs/core/subagents/#what-are-sub-agents) | 支持独立上下文和工具权限 | 原生支持 |
| GitHub Copilot | [Custom Agents](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents) | 支持自定义代理 | 原生支持 |
| Codex | ❌ 不支持 | N/A | 不支持 Agents |
| Trae | [Agents](https://docs.trae.ai/ide/agent?_lang=en) | 支持代理配置 | 原生支持 |
| OpenCode | [Agents](https://opencode.ai/docs/agents/) | 支持代理配置 | 原生支持 |

---

### 1.8 Configuration（⭐⭐ 中等优先级）

**概述**：工具全局或项目级别的行为设置。通过 `settings.json` 或 `config.toml` 定义。Configuration 是实现个性化和环境适配的基础。

**使用范围**：

- **触发条件**：全局偏好设置、项目环境适配、安全与隐私控制
- **原理层面**：静态配置加载，影响工具底层行为
- **用户视角**：个性化定制、安全控制、环境配置
- **最常见场景**：设置模型参数、配置代理、定义排除路径等

**示例**（Claude Code）：

```json
{
  "permissions": {
    "read": true,
    "write": true,
    "execute": false
  },
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-filesystem"]
      }
    }
  }
}
```

**包含此能力的 AI 工具**：

| 工具名称 | 功能地址 | 配置差异 | 备注 |
| --- | --- | --- | --- |
| Claude Code | [Configuration](https://code.claude.com/docs/en/build-with-claude-code/configure-claude-code) | 支持 settings.json，配置权限、MCP、全局设置 | 原生支持，推荐用于权限管理 |
| Cursor | [Configuration](https://cursor.com/docs/context/configuration) | 支持 .cursor/settings.json，配置方式与 Claude Code 相同 | 原生支持，配置方式相同 |
| GitHub Copilot | [Configuration](https://docs.github.com/en/copilot/customizing-copilot/configuring-github-copilot) | 支持 .github/copilot-settings.json，配置权限和行为 | 原生支持，配置方式有差异 |
| OpenCode | [Configuration](https://opencode.ai/docs/configuration/) | 支持 .opencode/config.json，配置权限和行为 | 原生支持，配置方式有差异 |
| Gemini CLI | [Configuration](https://ai.google.dev/gemini-api/docs/cli) | 支持环境变量和 .gemini/settings.json，配置权限和行为 | 原生支持，配置方式有差异 |
| Trae | [Configuration](https://www.trae.ai/docs/guide/configuration) | 支持 .trae/config.json，配置权限和行为 | 原生支持，配置方式有差异 |
| Codex | [Configuration](https://developers.openai.com/codex/configuration/) | 支持 ~/.codex/config.toml，配置权限和行为 | 原生支持，使用 TOML 格式 |

---

## 第二部分：能力优先级与依赖关系

### 2.1 能力优先级分类（用户使用逻辑）

按照用户从常见场景到高级特性的使用逻辑，能力优先级如下：

| 能力 | 优先级 | 依赖关系 | 是否必需 | 说明 |
| --- | --- | --- | --- | --- |
| **AGENTS.md** | ⭐⭐⭐⭐⭐ | 无 | ✅ 必需 | 基础上下文，所有 Preset 都应包含。最快速的项目启动方式 |
| **Rules** | ⭐⭐⭐⭐⭐ | 无 | ✅ 必需 | 细粒度规则，大型项目必需。为不同模块定义不同规范 |
| **Commands** | ⭐⭐⭐ | 无 | ✅ 必需 | 复用的 prompts 逻辑，定义常用的快捷命令 |
| **SKILL** | ⭐⭐⭐ | Configuration | ✅ 必需 | 工作流自动化的核心，实现重复任务的自动化 |
| **MCP** | ⭐⭐⭐ | Configuration | ⚠️ 可选 | 外部集成，独立功能。需要时才集成外部资源 |
| **HOOKS** | ⭐⭐⭐ | Configuration | ⚠️ 可选 | 强制规范执行，高级用法。实现事件驱动的自动化 |
| **Agents** | ⭐⭐ | Configuration | ⚠️ 可选 | 复杂任务隔离，高级用法。为复杂任务创建专门的代理 |
| **Configuration** | ⭐⭐ | 无 | ⚠️ 可选 | 基于不同工具集成。权限管理和工具配置的基础 |

### 2.2 能力依赖关系图

```
基础层（必需）
├── AGENTS.md ──────────────────────┐
├── Rules ──────────────────┤
└── Commands ────────────────┤
                                    ↓
中层（高频使用）
├── SKILL ─────────────────────────→ Configuration
├── MCP ──────────────────────────→ Configuration
├── HOOKS ───────────────────────→ Configuration
└── Configuration ◄─────────────────┘

高层（高级特性）
└── Agents ─────────────────→ Configuration
```

### 2.3 Preset 粒度指南（基于能力组织）

**推荐的 Preset 粒度**：按**技术栈 + 工作流**组织，而不是按单个能力。

| Preset 类型 | 包含能力 | 示例 | 说明 |
| --- | --- | --- | --- |
| **基础 Preset** | AGENTS.md + Commands | jue-preset-base | 所有项目都应包含，定义通用规范和快捷命令 |
| **技术栈 Preset** | Rules + SKILL + Commands | jue-preset-react, jue-preset-typescript | 针对特定技术栈的最佳实践和自动化 |
| **工作流 Preset** | HOOKS + SKILL + MCP + Configuration | jue-preset-deploy, jue-preset-ci | 针对特定工作流的自动化和集成 |
| **企业级 Preset** | 所有能力 | jue-preset-enterprise | 大型团队的完整解决方案 |

---

## 第三部分：工具能力矩阵

### 3.1 完整的工具能力矩阵

| 能力 | Claude Code | Cursor | Gemini CLI | GitHub Copilot | Codex | Trae | OpenCode | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **AGENTS.md** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 快速定义项目上下文的标准方式 |
| **Rules** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | 规范 AI 行为的指令集 (.cursorrules 等) |
| **SKILL** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 自动化工作流与函数调用能力 |
| **HOOKS** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ | 拦截并介入生命周期事件 |
| **Commands** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅  | 执行特定终端指令的封装能力 |
| **MCP** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Model Context Protocol 外部集成标准 |
| **Agents** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅  | 处理复杂子任务的独立智能体 |
| **Configuration** | ✅ | ✅ | ✅  | ✅  | ✅ | ✅  | ✅ | 个 AI 有自己的配置策略 |

- ✅ 完全支持 - 工具原生支持该能力，功能完整
- ⚠️ 部分支持 - 工具支持该能力，但功能有限制或需要特殊配置
- ❌ 不支持 - 工具不支持该能力，需要使用替代方案

## 第四部分：Preset 组织指南

### 4.1 基础 Preset 示例

```
jue-preset-base/
├── package.json
├── prompts/
│   ├── agents.md                    # AGENTS.md - 通用规范
│   └── custom-commands.toml         # Commands - 快捷命令
├── tools/
│   └── meta.json                    # Configuration - 基础配置
└── README.md
```

### 4.2 技术栈 Preset 示例（React）

```
jue-preset-react/
├── package.json
├── prompts/
│   ├── agents.md                    # AGENTS.md - React 最佳实践
│   ├── component-patterns.md        # Rules - 组件模式
│   ├── performance.md               # Rules - 性能优化
│   └── custom-commands.toml         # Commands - React 特定命令
├── skills/
│   ├── component-generator.md       # SKILL - 组件生成
│   ├── test-generator.md            # SKILL - 测试生成
│   └── refactor.md                  # SKILL - 代码重构
├── tools/
│   └── meta.json                    # Configuration - React 特定配置
└── README.md
```

### 4.3 工作流 Preset 示例（CI/CD）

```
jue-preset-cicd/
├── package.json
├── prompts/
│   ├── agents.md                    # AGENTS.md - CI/CD 规范
│   ├── deployment-rules.md          # Rules - 部署规范
│   └── custom-commands.toml         # Commands - CI/CD 命令
├── skills/
│   ├── deploy-checker.md            # SKILL - 部署检查
│   ├── release-notes.md             # SKILL - 发布说明生成
│   └── rollback.md                  # SKILL - 回滚处理
├── hooks/
│   └── cicd-hooks.json              # HOOKS - CI/CD 事件钩子
├── tools/
│   └── meta.json                    # Configuration - MCP 集成
└── README.md
```

---

## 第五部分：Adapter 开发指南

### 5.1 Adapter 的核心转换规则

**转换类别 1：上下文注入**

| 源能力 | Claude Code | Cursor | GitHub Copilot | OpenCode | Gemini CLI |
| --- | --- | --- | --- | --- | --- |
| AGENTS.md | CLAUDE.md | AGENTS.md | AGENTS.md | AGENTS.md | GEMINI.md |
| Rules | .claude/rules/*.md | .cursor/rules/*.mdc | .github/instructions/*.md | AGENTS.md | GEMINI.md |
| Custom Instructions | Rules | Rules | .github/copilot-instructions.md | AGENTS.md | GEMINI.md |

**转换类别 2：工作流定义**

| 源能力 | Claude Code | Cursor | GitHub Copilot | OpenCode | Gemini CLI |
| --- | --- | --- | --- | --- | --- |
| SKILL | .claude/skills/*.md | .cursor/skills/*.md | .github/skills/*.md | .opencode/skills/*.md | .gemini/skills/*.md |
| Commands | .claude/skills/*.md | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 |
| HOOKS | .claude/settings.json | .cursor/hooks.json | .github/hooks.json | ⚠️ 插件系统 | .gemini/hooks.json |

**转换类别 3：配置格式**

| 源配置 | Claude Code | Cursor | GitHub Copilot | OpenCode | Gemini CLI |
| --- | --- | --- | --- | --- | --- |
| Configuration | settings.json | .cursor/settings.json | .github/copilot-settings.json | .opencode/config.json | 环境变量 |
| MCP | settings.json | .cursor/settings.json | .github/copilot-settings.json | .opencode/config.json | .gemini/settings.json |
| Permissions | allowed-tools | permissions | ❌ 不支持 | permissions | 环境变量 |

### 5.2 降级策略

当目标工具不支持某个能力时，Adapter 应实现以下降级方案：

| 不支持的能力 | 降级方案 | 优先级 | 说明 |
| --- | --- | --- | --- |
| Rules | 使用 AGENTS.md | 高 | 将规则内容合并到 AGENTS.md |
| SKILL | 使用 Commands | 中 | 将 SKILL 转换为快捷命令 |
| HOOKS | 使用 SKILL + Configuration | 中 | 通过 SKILL 的 description 自动触发 |
| Agents | 使用 SKILL + Configuration | 低 | 通过多个 SKILL 模拟隔离 |
| Commands | 使用 SKILL | 高 | 将命令转换为 SKILL |

---

## 总结与建议

### 关键要点

1. **优先级清晰**：从基础的 AGENTS.md 和 Rules 开始，逐步添加高级能力
2. **工具差异明显**：Claude Code 和 Cursor 支持度最高，其他工具需要降级方案
3. **能力组织**：按技术栈和工作流组织 Preset，而不是按单个能力
4. **配置合并**：明确的加载顺序和合并规则，支持多预设组合
5. **Adapter 开发**：实现完整的格式转换、配置合并、降级方案

### 对 ai-jue 项目的建议

1. **Preset 设计**：基于本文档的优先级指南，设计分层的官方预设
2. **Adapter 开发**：基于本文档的转换规则，实现各工具的适配器
3. **文档完善**：基于本文档的能力说明，编写用户指南和开发者指南
4. **质量保证**：基于本文档的工具矩阵，建立自动化验证机制

---

## 参考资源

### 官方文档链接

1. [Claude Code - Overview](https://code.claude.com/docs/en/overview)
2. [Claude Code - Best Practices](https://code.claude.com/docs/en/best-practices#write-an-effective-claude-md)
3. [Claude Code - Memory Management](https://code.claude.com/docs/en/memory)
4. [Claude Code - Modular Rules](https://code.claude.com/docs/en/memory#modular-rules-with-claude%2Frules%2F)
5. [Claude Code - Skills](https://code.claude.com/docs/en/skills)
6. [Claude Code - Hooks](https://code.claude.com/docs/en/hooks)
7. [Claude Code - Agents](https://code.claude.com/docs/en/sub-agents)
8. [Claude Code - MCP](https://code.claude.com/docs/en/build-with-claude-code/configure-mcp-servers)
9. [Claude Code - Configuration](https://code.claude.com/docs/en/build-with-claude-code/configure-claude-code)
10. [Cursor - Rules](https://cursor.com/docs/context/rules)
11. [Cursor - Skills](https://cursor.com/docs/context/skills)
12. [Cursor - Hooks](https://cursor.com/docs/agent/hooks)
13. [Cursor - MCP](https://cursor.com/docs/context/mcp)
14. [Cursor - Configuration](https://cursor.com/docs/context/configuration)
15. [GitHub Copilot - Custom Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
16. [GitHub Copilot - Hooks](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
17. [GitHub Copilot - MCP](https://docs.github.com/en/copilot/customizing-copilot/configuring-mcp-servers)
18. [Gemini CLI - GEMINI.md](https://geminicli.com/docs/cli/gemini-md/)
19. [Gemini CLI - Skills](https://geminicli.com/docs/cli/skills/)
20. [Gemini CLI - Hooks](https://geminicli.com/docs/hooks/)
21. [OpenCode - Rules](https://opencode.ai/docs/rules/)
22. [OpenCode - Skills](https://opencode.ai/docs/skills/)
23. [OpenCode - MCP](https://opencode.ai/docs/mcp/)
24. [OpenCode - Configuration](https://opencode.ai/docs/configuration/)
25. [OpenCode - Plugins](https://opencode.ai/docs/plugins)
26. [Trae - Rules](https://docs.trae.ai/ide/rules)
27. [Trae - Skills](https://docs.trae.ai/ide/skills)
28. [Trae - Agents](https://docs.trae.ai/ide/agent?_lang=en)
29. [Trae - Configuration](https://www.trae.ai/docs/guide/configuration)
30. [Trae - MCP](https://www.trae.ai/docs/guide/mcp)
31. [Codex - AGENTS.md](https://developers.openai.com/codex/guides/agents-md/)
32. [Codex - Custom Prompts](https://developers.openai.com/codex/custom-prompts/)
33. [Codex - Skills](https://developers.openai.com/codex/skills/)
34. [Codex - MCP](https://developers.openai.com/codex/mcp/)
35. [Codex - Configuration](https://developers.openai.com/codex/configuration/)
36. [Model Context Protocol - Official](https://modelcontextprotocol.io/docs/getting-started/intro)
