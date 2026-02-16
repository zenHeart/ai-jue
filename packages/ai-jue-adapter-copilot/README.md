# ai-jue-adapter-copilot

<div align="center">

**GitHub Copilot 适配器：将 ai-jue 配置转换为 Copilot 原生格式**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-copilot.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-copilot)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能概述

该适配器将 `ai-jue` 规范能力转换为 GitHub Copilot 原生配置格式。由于 Copilot 的配置系统相对简单，本适配器采用**降级策略**，将结构化能力转换为文本指令，确保所有配置都被显式处理而非静默忽略。

## 能力映射矩阵

> **开发者注意**：下表中的"Copilot 原生特性"一列包含了指向该特性官方文档的 **已验证** 的 Markdown 链接。

| 优先级 | ai-jue 能力 | Copilot 原生特性 | 支持状态 | 用户配置说明 | 实现策略 |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | [Repository Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) | 🟢 Native | 生成 `.github/copilot-instructions.md` | 转换为指令文件头部 |
| ⭐⭐⭐⭐⭐ | **Rules** | [Path-specific Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) | 🟡 Degraded | 降级为路径特定指令 | 作为 `.github/instructions/*.instructions.md` 输出 |
| ⭐⭐⭐ | **Commands** | [Prompt Files](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) | 🟡 Degraded | 转换为 prompt files | 输出到 `.github/prompts/` |
| ⭐⭐⭐ | **Skills** | 无原生技能系统 | 🟡 Degraded | 写入指令文件 | 作为指令文档的一部分 |
| ⭐⭐⭐ | **MCP** | [MCP Configuration](https://docs.github.com/en/copilot/customizing-copilot) | 🟡 Degraded | 添加能力说明 | 在指令中提示用户手动配置 |
| ⭐⭐⭐ | **Hooks** | 无原生钩子系统 | 🟡 Degraded | 添加工作流提示 | 在指令中提醒用户执行 |
| ⭐⭐ | **Agents** | [Agent Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) | 🟡 Degraded | 作为角色指导 | 将代理定义转为 AGENTS.md |
| ⭐⭐ | **Configuration** | [Copilot Settings](https://docs.github.com/en/copilot/customizing-copilot) | 🟢 Native | `.github/copilot-settings.json` | 直接透传配置 |

## 详细实现说明

### 1. AGENTS.md（全局上下文）

- **兼容性**：Fully Compatible
- **映射策略**：`config.context.global` 内容作为 `copilot-instructions.md` 的核心指令部分
- **用户操作**：无需额外操作，Copilot 会自动读取 `.github/copilot-instructions.md`
- **技术细节**：作为指令文件的第一部分内容输出

### 2. Rules（项目规则）

- **兼容性**：Partial (Degraded)
- **映射策略**：
  - 支持 `globs` → `applyTo` frontmatter 字段
  - 输出为 `.github/instructions/{name}.instructions.md`
- **限制**：
  - 无原生 globs/alwaysApply 支持，通过 frontmatter 模拟
- **文件输出**：`.github/instructions/{ruleName}.instructions.md`
- **格式示例**：

```yaml
---
applyTo: "src/**/*.ts"
---

Use strict typing. Avoid `any`.
```

### 3. Commands（自定义命令）

- **兼容性**：Partial (Degraded)
- **映射策略**：转换为 `.github/prompts/{name}.prompt.md` 格式
- **使用方式**：Copilot 会在对话中识别命令关键词
- **格式示例**：

```markdown
---
applyTo: "**/*"
---

# Explain Code

Analyze this code and explain...
```

### 4. Skills（可复用技能）

- **兼容性**：Incompatible (Degraded)
- **映射策略**：转换为指令文档中的 "Available Skills" 章节
- **用户影响**：技能内容被转换为文本描述，Copilot 会根据上下文尝试应用

### 5. MCP（外部工具集成）

- **兼容性**：Incompatible (Degraded)
- **映射策略**：在指令文件中添加能力说明章节
- **用户操作**：用户需要手动在编辑器中配置 MCP 服务器
- **降级说明**：

```markdown
## Capability Notes

- MCP servers are defined in project config. Treat them as external tool context...
```

### 6. Hooks（生命周期钩子）

- **兼容性**：Incompatible (Degraded)
- **映射策略**：转换为 "Workflow Note" 章节
- **用户影响**：Copilot 会在相关场景提醒用户执行钩子，但不会自动触发

```markdown
## Workflow Note

This project defines the following workflow hooks. Please remind the user to run them:

- **pre-commit**: `npm test`
```

### 7. Agents（子代理）

- **兼容性**：Partial (Degraded)
- **映射策略**：
  - 生成 `.github/instructions/{agent}.instructions.md` 文件
  - 或作为角色指导写入主指令文档
- **用户影响**：用户需通过自然语言提示 Copilot 采用特定角色

### 8. Configuration（全局配置）

- **兼容性**：Fully Compatible
- **映射策略**：`tools.copilot` 直接透传至 `.github/copilot-settings.json`
- **用途**：存储 Copilot 特定的编辑器设置

## 限制与降级策略

### 关键限制

1. **无结构化配置**：Copilot 不支持原生的 Rules、Commands、Skills 配置文件化
2. **无 MCP 原生支持**：需在编辑器设置中手动配置 MCP 服务器
3. **无生命周期钩子**：无法自动触发工作流脚本
4. **无子代理系统**：无法切换不同 AI 角色

### 降级处理汇总

| ai-jue 能力 | 降级方式 | 用户影响 |
|:---|:---|:---|
| Rules | `.github/instructions/*.instructions.md` | 通过 `applyTo` frontmatter 模拟路径特定规则 |
| Commands | `.github/prompts/*.prompt.md` | 转换为 prompt files，通过自然语言触发 |
| Skills | 写入 `copilot-instructions.md` | 内容转换为文本，依赖 Copilot 理解 |
| MCP | 添加说明文字 | 需手动在编辑器中配置 |
| Hooks | 添加提醒文字 | 需手动执行，无自动触发 |
| Agents | `.github/instructions/*.instructions.md` | 需通过提示词引导 |

### 手动替代方案

对于不支持的能力，用户可手动：

1. **MCP 配置**：在 VS Code/Cursor 设置中手动添加 MCP 服务器
2. **Hooks**：使用 Git hooks 或编辑器任务替代
3. **Agents**：在对话开始时明确指定角色

## 安装

```bash
npm install ai-jue-adapter-copilot
```

## 使用

在 `ai.config.js` 中配置：

```javascript
module.exports = {
  preset: 'base',
  adapters: ['copilot']
};
```

然后运行：

```bash
npx jue apply --adapter copilot
```

## 验证

运行适配器测试：

```bash
npm test -- packages/ai-jue-adapter-copilot/test/index.test.ts
```

## 相关链接

- [ai-jue 主项目](https://github.com/zenHeart/ai-jue)
- [GitHub Copilot 官方文档](https://docs.github.com/en/copilot)
- [Adding custom instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)

## License

[MIT](LICENSE)
