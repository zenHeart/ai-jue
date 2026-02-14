# ai-jue-adapter-gemini

<div align="center">

**Gemini CLI 适配器：将 ai-jue 配置转换为 Gemini 原生格式**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-gemini.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-gemini)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能概述

该适配器将 `ai-jue` 规范能力转换为 Gemini CLI (`gemini`) 原生配置格式。

## 能力映射矩阵

| 优先级 | ai-jue 能力 | Gemini 原生特性 | 支持状态 | 用户配置说明 | 实现策略 |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **[AGENTS.md](https://geminicli.com/docs/cli/context/)** | 项目上下文引用 | 🟢 Native | 根目录放置 `AGENTS.md` | 生成 `AGENTS.md` 并在 `GEMINI.md` 中引用 |
| ⭐⭐⭐⭐⭐ | **Rules** | 提示词块 | 🟡 Degraded | 不支持 globs 特定路径 | 规则内容作为 Markdown 块写入 `GEMINI.md` |
| ⭐⭐⭐ | **[Commands](https://geminicli.com/docs/cli/commands/)** | 自定义 Slash Commands | 🟢 Native | `.gemini/commands/*.toml` | 转换为 Gemini 原生 TOML 命令格式 |
| ⭐⭐⭐ | **[Skills](https://geminicli.com/docs/cli/skills/)** | Agent Skills | 🟢 Native | `.gemini/skills/{name}/` | 转换为包含 `SKILL.md` 及资源的技能目录 |
| ⭐⭐⭐ | **[MCP](https://geminicli.com/docs/cli/mcp/)** | Model Context Protocol | 🟢 Native | `settings.json` 的 `mcpServers` | 将 MCP 配置注入 `settings.json` |
| ⭐⭐⭐ | **[Hooks](https://geminicli.com/docs/cli/hooks/)** | 周期钩子 | 🟢 Native | `settings.json` 的 `hooks` | 将钩子脚本注入 `settings.json` |
| ⭐⭐ | **[Agents](https://geminicli.com/docs/cli/agents/)** | 代理 Persona | 🟢 Native | `settings.json` 的 `agents` | 将代理配置及技能映射注入 `settings.json` |
| ⭐⭐ | **[Configuration](https://geminicli.com/docs/cli/configuration/)** | 系统配置与提示词 | 🟢 Native | `settings.json` 与 `GEMINI.md` | 合并系统设置并生成核心 `GEMINI.md` |

## 详细实现说明

### 1. AGENTS.md（全局上下文）

- **兼容性**：Fully Compatible
- **映射策略**：生成物理 `AGENTS.md` 文件，并在 `GEMINI.md` 头部通过 `@AGENTS.md` 引用。
- **用户操作**：运行 `jue apply` 后，Gemini 会自动加载项目中的上下文。
- **技术细节**：利用 Gemini 的文件引用机制，确保大型上下文不阻塞主提示词。

### 2. Rules（路径特定规则）

- **兼容性**：Partial (Degraded)
- **映射策略**：
  - `globs` → ❌ 不支持
  - `alwaysApply` → 🟢 写入 `GEMINI.md`
  - `description` → 🟢 写入 `GEMINI.md`
- **文件输出**：所有规则合并写入 `GEMINI.md` 的 `## Rules (Degraded)` 章节。

### 3. Commands（自定义命令）

- **兼容性**：Fully Compatible
- **映射策略**：将 `commands/` 目录下的 Markdown 转换为 `.gemini/commands/**/*.toml`。
- **使用方式**：用户在 CLI 中通过 `/command-name` 调用。

### 4. Skills（可复用技能）

- **兼容性**：Fully Compatible
- **映射策略**：生成符合 [Agent Skills](https://agentskills.io/specification) 规范的目录结构，包含 `SKILL.md`（YAML frontmatter）及 `references/` 等资源。

### 5. MCP（外部工具集成）

- **兼容性**：Fully Compatible
- **配置格式**：直接映射至 `.gemini/settings.json` 的 `mcpServers` 对象。

### 6. Hooks（生命周期钩子）

- **兼容性**：Fully Compatible
- **支持的事件**：支持 `settings.json` 中定义的所有原生钩子事件。

### 7. Agents（子代理）

- **兼容性**：Fully Compatible
- **映射策略**：映射至 `settings.json` 的 `agents` 字段，支持为不同代理分配特定技能。

### 8. Configuration（全局配置）

- **兼容性**：Fully Compatible
- **映射策略**：合并 `tools.gemini` 中的所有配置项至 `.gemini/settings.json`。

## 限制与降级策略

### 关键限制

1. Gemini CLI 目前不支持针对特定文件通配符 (globs) 的自动触发规则。
2. 不支持类似现代 IDE (如 Cursor) 的多文件规则自动加载机制。

### 降级处理

| ai-jue 能力 | 降级方式 | 用户影响 |
|:---|:---|:---|
| Rules | 写入 `GEMINI.md` | 规则变为全局生效，无法针对特定文件路径。 |

### 手动替代方案

对于路径特定规则，用户可：
1. 在提示词中手动指定路径。
2. 将规则拆分为特定的 Skills 并在需要时激活。

## 安装

```bash
npm install ai-jue-adapter-gemini
```

## 使用

在 `ai.config.js` 中配置：

```javascript
module.exports = {
  preset: 'base',
  adapters: ['gemini']
};
```

然后运行：

```bash
npx jue apply --adapter gemini
```

## 验证

运行适配器测试：

```bash
npm test -- packages/ai-jue-adapter-gemini/test/index.test.ts
```

## 相关链接

- [ai-jue 主项目](https://github.com/zenHeart/ai-jue)
- [Gemini CLI 官方文档](https://geminicli.com/docs/)

## License

[MIT](LICENSE)
