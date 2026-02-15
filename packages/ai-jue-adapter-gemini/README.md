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

> **开发者注意**：下表中的“Gemini 原生特性”一列包含了指向该特性官方文档的 **精确且已验证** 的 Markdown 链接。

| 优先级 | ai-jue 能力 | Gemini 原生特性 (必须包含文档链接) | 支持状态 | 用户配置说明 | 实现策略 |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | [GEMINI.md](https://geminicli.com/docs/cli/gemini-md/) | 🟢 Native | 根目录放置 `AGENTS.md` | 生成 `AGENTS.md` 并在 `GEMINI.md` 头部引用 |
| ⭐⭐⭐⭐⭐ | **Rules** | 无 | ❌ Unsupported | 不支持路径特定规则 | 逻辑降级：目前将规则作为 Markdown 块写入 `GEMINI.md` |
| ⭐⭐⭐ | **Commands** | [Custom Commands](https://geminicli.com/docs/cli/custom-commands/) | 🟢 Native | 使用 `/command-name` 调用 | 转换为 `.gemini/commands/**/*.toml` 格式 |
| ⭐⭐⭐ | **Skills** | [Agent Skills](https://geminicli.com/docs/cli/skills/) | 🟢 Native | 自动识别并激活相关技能 | 转换为包含 `SKILL.md` 的标准技能目录 |
| ⭐⭐⭐ | **MCP** | [MCP Servers](https://geminicli.com/docs/tools/mcp-server/) | 🟢 Native | 配置文件中的 `mcpServers` | 将 MCP 配置注入 `.gemini/settings.json` |
| ⭐⭐⭐ | **Hooks** | [Hooks](https://geminicli.com/docs/hooks/) | 🟢 Native | 在特定事件（如 Shell 执行前后）触发 | 将钩子脚本注入 `.gemini/settings.json` |
| ⭐⭐ | **Agents** | [Sub-Agents](https://geminicli.com/docs/core/subagents/#what-are-sub-agents) | 🟢 Native | 使用不同角色的独立提示词 | 映射至 `.gemini/settings.json` 的 `agents` 字段 |
| ⭐⭐ | **Configuration** | [Settings](https://geminicli.com/docs/get-started/configuration-v1/#settings-files) | 🟢 Native | 配置模型参数、权限等 | 合并配置并生成 `.gemini/settings.json` |

## 详细实现说明

### 1. AGENTS.md（全局上下文）

- **兼容性**：Fully Compatible
- **映射策略**：生成物理 `AGENTS.md` 文件，并在 `GEMINI.md` 头部通过 `@AGENTS.md` 语法引用。
- **用户操作**：运行 `jue apply` 后，Gemini 会在每次会话开始时加载此上下文。
- **技术细节**：遵循 Gemini 原生文件引用规范。

### 2. Rules（路径特定规则 / Project Rules）

- **兼容性**：Incompatible (Degraded)
- **映射策略**：
  - `globs` → ❌ 不支持
  - `alwaysApply` → 🟢 默认全部写入 `GEMINI.md`
- **文件输出**：所有规则合并写入 `GEMINI.md` 的 `## Rules (Degraded)` 章节。

### 3. Commands（自定义命令）

- **兼容性**：Fully Compatible
- **映射策略**：将 `commands/` 下的 Markdown 指令转换为 `.gemini/commands/` 目录下的 `.toml` 文件。
- **使用方式**：用户在 CLI 中直接键入 `/command-name` 即可触发。

### 4. Skills（可复用技能）

- **兼容性**：Fully Compatible
- **映射策略**：生成符合 Agent Skills 规范的目录结构，包含 `SKILL.md`（含 YAML frontmatter）。

### 5. MCP（外部工具集成）

- **兼容性**：Fully Compatible
- **配置格式**：将 `mcp.servers` 配置直接映射至 `.gemini/settings.json`。

### 6. Hooks（生命周期钩子）

- **兼容性**：Fully Compatible
- **支持的事件**：支持 `PreToolUse`、`PostToolUse` 等原生 Hook。

### 7. Agents（子代理）

- **兼容性**：Fully Compatible
- **映射策略**：映射至 `settings.json` 的 `agents` 字段。

### 8. Configuration（全局配置）

- **兼容性**：Fully Compatible
- **映射策略**：合并 `tools.gemini` 配置项至 `.gemini/settings.json`。

## 限制与降级策略

### 关键限制

1. Gemini CLI 目前不支持针对特定文件通配符 (globs) 的动态触发规则。

### 降级处理

| ai-jue 能力 | 降级方式 | 用户影响 |
|:---|:---|:---|
| Rules | 写入 `GEMINI.md` | 规则变为全局生效，无法针对特定路径自动切换。 |

## 安装

```bash
npm install ai-jue-adapter-gemini
```

## 使用

```javascript
module.exports = {
  preset: 'base',
  adapters: ['gemini']
};
```

## 相关链接

- [ai-jue 主项目](https://github.com/zenHeart/ai-jue)
- [Gemini CLI 官方文档](https://geminicli.com/docs/)

## License

[MIT](LICENSE)
